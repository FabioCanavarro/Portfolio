"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, Check, AlertCircle, Trash2, Edit, Save, Lock, LogOut, 
  Eye, EyeOff, Globe, Calendar, Tag, Plus, X, Loader2, Sparkles, MapPin, Settings, RefreshCw, Layers
} from "lucide-react";
import exifr from "exifr";

type Photo = {
  id: string;
  title: string;
  description: string;
  backstory: string;
  date: string;
  year: string;
  tags: string[];
  original: string;
  edited: string;
  city?: string;
  province?: string;
  country?: string;
  published?: boolean;
  hash?: string;
};

interface UploadItem {
  id: string; // client-side temp id
  fileName: string;
  title: string;
  description: string;
  backstory: string;
  date: string;
  year: string;
  tags: string[];
  city: string;
  province: string;
  country: string;
  published: boolean;
  hash: string;
  
  // File details
  editedFile: File;
  originalFile: File | null;
  
  // Statuses
  exifParsed: boolean;
  geocoding: boolean;
  uploading: boolean;
  uploadProgress: number;
  uploaded: boolean;
  saved: boolean;
  error: string | null;
  
  // Temp previews
  previewUrl: string;
  originalPreviewUrl: string;
}

interface DuplicateItem {
  file: File;
  hash: string;
  matchedTitle: string;
  matchedSource: "database" | "queue";
  previewUrl: string;
  originalFile: File | null;
}

// Helper to format date to local datetime-local format YYYY-MM-DDTHH:mm:ss
function formatDateToLocalDatetime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const seconds = String(d.getSeconds()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }
  } catch (e) {}
  return "";
}

// Helper to convert File to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.substring(result.indexOf(",") + 1);
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

// Helper to compute SHA-256 hash of a file
async function calculateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function AdminGalleryClient() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);

  // Tabs: 'upload' | 'manage'
  const [activeTab, setActiveTab] = useState<"upload" | "manage">("upload");

  // State for upload dashboard
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [queueLoading, setQueueLoading] = useState(false);

  // Duplicate states
  const [pendingDuplicates, setPendingDuplicates] = useState<DuplicateItem[]>([]);

  // AI settings
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiBaseUrl, setAiBaseUrl] = useState("https://api.openai.com/v1");
  const [aiModel, setAiModel] = useState("gpt-4o-mini");
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [aiLoadingMap, setAiLoadingMap] = useState<Record<string, boolean>>({});
  const [bulkAiLoading, setBulkAiLoading] = useState(false);

  // State for existing photos management
  const [existingPhotos, setExistingPhotos] = useState<Photo[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Geocoding queue refs to avoid rate limits
  const geocodeQueue = useRef<{ id: string; lat: number; lon: number }[]>([]);
  const geocodingInProgress = useRef(false);

  // Load AI configuration & auth
  useEffect(() => {
    checkAuth();
    
    // Load local storage AI config
    const key = localStorage.getItem("gallery_ai_api_key") || "";
    const url = localStorage.getItem("gallery_ai_base_url") || "https://api.openai.com/v1";
    const model = localStorage.getItem("gallery_ai_model") || "gpt-4o-mini";
    setAiApiKey(key);
    setAiBaseUrl(url);
    setAiModel(model);
  }, []);

  useEffect(() => {
    if (isAuthenticated && activeTab === "manage") {
      fetchExistingPhotos();
    }
  }, [isAuthenticated, activeTab]);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/gallery/auth");
      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(data.authenticated);
      } else {
        setIsAuthenticated(false);
      }
    } catch (e) {
      setIsAuthenticated(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    setShouldShake(false);

    try {
      const res = await fetch("/api/gallery/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setIsAuthenticated(true);
        fetchExistingPhotos(); // Pre-fetch photos to have their hashes ready for duplicate check
      } else {
        const data = await res.json();
        setAuthError(data.error || "Incorrect password");
        setShouldShake(true);
      }
    } catch (err) {
      setAuthError("Failed to connect to authentication API");
      setShouldShake(true);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/gallery/auth", { method: "DELETE" });
      setIsAuthenticated(false);
      setPassword("");
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  const fetchExistingPhotos = async () => {
    setPhotosLoading(true);
    try {
      const res = await fetch("/api/gallery/upload");
      if (res.ok) {
        const data = await res.json();
        setExistingPhotos(data.photos || []);
      }
    } catch (e) {
      console.error("Error fetching photos:", e);
    } finally {
      setPhotosLoading(false);
    }
  };

  // Sequential geocoding processor
  const processGeocodeQueue = async () => {
    if (geocodingInProgress.current || geocodeQueue.current.length === 0) return;
    geocodingInProgress.current = true;

    while (geocodeQueue.current.length > 0) {
      const item = geocodeQueue.current.shift();
      if (!item) continue;

      setUploadQueue((prev) =>
        prev.map((qItem) => (qItem.id === item.id ? { ...qItem, geocoding: true } : qItem))
      );

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${item.lat}&lon=${item.lon}&zoom=10&addressdetails=1`,
          {
            headers: {
              "User-Agent": "FabioPortfolioPhotoUploader/1.0",
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          const address = data.address || {};
          const city = address.city || address.town || address.village || address.suburb || address.county || "";
          const province = address.state || address.region || "";
          const country = address.country || "";

          setUploadQueue((prev) =>
            prev.map((qItem) => {
              if (qItem.id === item.id) {
                const formattedLoc = [city, country].filter(Boolean).join(", ");
                return {
                  ...qItem,
                  city,
                  province,
                  country,
                  description: qItem.description || (formattedLoc ? `Captured in ${formattedLoc}` : ""),
                  geocoding: false,
                };
              }
              return qItem;
            })
          );
        } else {
          setUploadQueue((prev) =>
            prev.map((qItem) => (qItem.id === item.id ? { ...qItem, geocoding: false } : qItem))
          );
        }
      } catch (e) {
        console.error("Geocoding failed:", e);
        setUploadQueue((prev) =>
          prev.map((qItem) => (qItem.id === item.id ? { ...qItem, geocoding: false } : qItem))
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    geocodingInProgress.current = false;
  };

  // SHA-256 Hashing and duplicate matching loop
  const handleFilesAdded = async (files: FileList) => {
    const fileArray = Array.from(files);
    const origSuffixes = ["_orig", "-orig", "_original", "-original"];
    
    // Separate originals and edited/mains
    const mainFiles = fileArray.filter(file => {
      const lowercaseName = file.name.toLowerCase();
      return !origSuffixes.some(suffix => {
        const extIndex = lowercaseName.lastIndexOf(".");
        const nameWithoutExt = extIndex !== -1 ? lowercaseName.substring(0, extIndex) : lowercaseName;
        return nameWithoutExt.endsWith(suffix);
      });
    });

    const potentialOriginals = fileArray.filter(file => {
      const lowercaseName = file.name.toLowerCase();
      return origSuffixes.some(suffix => {
        const extIndex = lowercaseName.lastIndexOf(".");
        const nameWithoutExt = extIndex !== -1 ? lowercaseName.substring(0, extIndex) : lowercaseName;
        return nameWithoutExt.endsWith(suffix);
      });
    });

    const duplicatesList: DuplicateItem[] = [];
    const validItems: UploadItem[] = [];
    const currentBatchHashes = new Set<string>();

    setQueueLoading(true);

    for (const file of mainFiles) {
      try {
        const hash = await calculateFileHash(file);
        
        // Match against database, active queue, and current batch
        const dbMatch = existingPhotos.find(p => p.hash === hash);
        const queueMatch = uploadQueue.find(q => q.hash === hash);
        const batchMatch = currentBatchHashes.has(hash);

        const matchedTitle = dbMatch?.title || queueMatch?.title || (batchMatch ? "a file in the current batch" : "");
        const matchedSource = dbMatch ? "database" : (queueMatch || batchMatch) ? "queue" : null;

        // Auto-detect comparison original
        const extIndex = file.name.lastIndexOf(".");
        const baseName = extIndex !== -1 ? file.name.substring(0, extIndex) : file.name;
        
        let matchedOriginalFile: File | null = null;
        for (const origFile of potentialOriginals) {
          const origLowercase = origFile.name.toLowerCase();
          for (const suffix of origSuffixes) {
            const matchTarget = `${baseName.toLowerCase()}${suffix}`;
            const origExtIndex = origLowercase.lastIndexOf(".");
            const origNameWithoutExt = origExtIndex !== -1 ? origLowercase.substring(0, origExtIndex) : origLowercase;
            if (origNameWithoutExt === matchTarget) {
              matchedOriginalFile = origFile;
              break;
            }
          }
          if (matchedOriginalFile) break;
        }

        if (matchedSource) {
          duplicatesList.push({
            file,
            hash,
            matchedTitle,
            matchedSource: matchedSource as "database" | "queue",
            previewUrl: URL.createObjectURL(file),
            originalFile: matchedOriginalFile
          });
        } else {
          currentBatchHashes.add(hash);
          
          const tempId = Math.random().toString(36).substring(2, 9);
          const formattedTitle = baseName
            .replace(/[_\-]/g, " ")
            .replace(/\b\w/g, c => c.toUpperCase());

          const item: UploadItem = {
            id: tempId,
            fileName: file.name,
            title: formattedTitle,
            description: "",
            backstory: "",
            date: formatDateToLocalDatetime(new Date().toISOString()),
            year: new Date().getFullYear().toString(),
            tags: [],
            city: "",
            province: "",
            country: "",
            published: false,
            editedFile: file,
            originalFile: matchedOriginalFile,
            exifParsed: false,
            geocoding: false,
            uploading: false,
            uploadProgress: 0,
            uploaded: false,
            saved: false,
            error: null,
            previewUrl: URL.createObjectURL(file),
            originalPreviewUrl: matchedOriginalFile ? URL.createObjectURL(matchedOriginalFile) : "",
            hash
          };
          
          validItems.push(item);
        }
      } catch (e) {
        console.error("Hashing failed for file:", file.name, e);
      }
    }

    setQueueLoading(false);

    if (validItems.length > 0) {
      setUploadQueue((prev) => [...prev, ...validItems]);
      triggerExifAndGeocode(validItems);
    }

    if (duplicatesList.length > 0) {
      setPendingDuplicates(duplicatesList);
    }
  };

  const triggerExifAndGeocode = async (items: UploadItem[]) => {
    for (const item of items) {
      try {
        const exif = await exifr.parse(item.editedFile, {
          gps: true,
          tiff: true,
        });

        let exifDate = formatDateToLocalDatetime(new Date().toISOString());
        let exifYear = new Date().getFullYear().toString();

        if (exif && exif.DateTimeOriginal) {
          const d = new Date(exif.DateTimeOriginal);
          if (!isNaN(d.getTime())) {
            exifDate = formatDateToLocalDatetime(d.toISOString());
            exifYear = d.getFullYear().toString();
          }
        }

        setUploadQueue((prev) =>
          prev.map((qItem) =>
            qItem.id === item.id
              ? {
                  ...qItem,
                  date: exifDate,
                  year: exifYear,
                  exifParsed: true,
                }
              : qItem
          )
        );

        if (exif && exif.latitude && exif.longitude) {
          geocodeQueue.current.push({
            id: item.id,
            lat: exif.latitude,
            lon: exif.longitude,
          });
          processGeocodeQueue();
        }
      } catch (e) {
        console.error("EXIF parsing failed:", item.fileName, e);
        setUploadQueue((prev) =>
          prev.map((qItem) =>
            qItem.id === item.id ? { ...qItem, exifParsed: true } : qItem
          )
        );
      }
    }
  };

  // Duplicate Resolution Modal Actions
  const resolveDuplicate = (upload: boolean) => {
    const current = pendingDuplicates[0];
    if (!current) return;

    if (upload) {
      const extIndex = current.file.name.lastIndexOf(".");
      const baseName = extIndex !== -1 ? current.file.name.substring(0, extIndex) : current.file.name;
      const formattedTitle = baseName.replace(/[_\-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());

      const item: UploadItem = {
        id: Math.random().toString(36).substring(2, 9),
        fileName: current.file.name,
        title: formattedTitle,
        description: "",
        backstory: "",
        date: formatDateToLocalDatetime(new Date().toISOString()),
        year: new Date().getFullYear().toString(),
        tags: [],
        city: "",
        province: "",
        country: "",
        published: false,
        editedFile: current.file,
        originalFile: current.originalFile,
        exifParsed: false,
        geocoding: false,
        uploading: false,
        uploadProgress: 0,
        uploaded: false,
        saved: false,
        error: null,
        previewUrl: current.previewUrl,
        originalPreviewUrl: current.originalFile ? URL.createObjectURL(current.originalFile) : "",
        hash: current.hash
      };
      
      setUploadQueue((prev) => [...prev, item]);
      triggerExifAndGeocode([item]);
    } else {
      URL.revokeObjectURL(current.previewUrl);
    }
    setPendingDuplicates((prev) => prev.slice(1));
  };

  const skipAllDuplicates = () => {
    pendingDuplicates.forEach(d => URL.revokeObjectURL(d.previewUrl));
    setPendingDuplicates([]);
  };

  const uploadAllDuplicates = () => {
    const itemsToAdd = pendingDuplicates.map((current) => {
      const extIndex = current.file.name.lastIndexOf(".");
      const baseName = extIndex !== -1 ? current.file.name.substring(0, extIndex) : current.file.name;
      const formattedTitle = baseName.replace(/[_\-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      
      return {
        id: Math.random().toString(36).substring(2, 9),
        fileName: current.file.name,
        title: formattedTitle,
        description: "",
        backstory: "",
        date: formatDateToLocalDatetime(new Date().toISOString()),
        year: new Date().getFullYear().toString(),
        tags: [],
        city: "",
        province: "",
        country: "",
        published: false,
        editedFile: current.file,
        originalFile: current.originalFile,
        exifParsed: false,
        geocoding: false,
        uploading: false,
        uploadProgress: 0,
        uploaded: false,
        saved: false,
        error: null,
        previewUrl: current.previewUrl,
        originalPreviewUrl: current.originalFile ? URL.createObjectURL(current.originalFile) : "",
        hash: current.hash
      };
    });

    setUploadQueue((prev) => [...prev, ...itemsToAdd]);
    triggerExifAndGeocode(itemsToAdd);
    setPendingDuplicates([]);
  };

  // Swapping original and edited slot references
  const handleSwapSlots = (itemId: string) => {
    setUploadQueue((prev) =>
      prev.map((item) => {
        if (item.id === itemId && item.originalFile) {
          const edited = item.originalFile;
          const original = item.editedFile;
          
          const newPreviewUrl = item.originalPreviewUrl;
          const newOriginalPreviewUrl = item.previewUrl;
          
          return {
            ...item,
            editedFile: edited,
            originalFile: original,
            previewUrl: newPreviewUrl,
            originalPreviewUrl: newOriginalPreviewUrl,
            fileName: edited.name
          };
        }
        return item;
      })
    );
  };

  // AI Settings functions
  const handleSaveAiSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("gallery_ai_api_key", aiApiKey);
    localStorage.setItem("gallery_ai_base_url", aiBaseUrl);
    localStorage.setItem("gallery_ai_model", aiModel);
    setShowAiSettings(false);
  };

  // Client-side Multimodal Vision AI metadata extraction
  const generateAiMetadata = async (itemId: string): Promise<boolean> => {
    if (!aiApiKey) {
      alert("AI API Key is missing. Please open 'AI Settings' in the top bar to configure your key.");
      setShowAiSettings(true);
      return false;
    }

    const item = uploadQueue.find(q => q.id === itemId);
    if (!item || item.saved) return false;

    setAiLoadingMap(prev => ({ ...prev, [itemId]: true }));

    try {
      const base64 = await fileToBase64(item.editedFile);
      
      const response = await fetch("/api/gallery/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          aiBaseUrl,
          aiApiKey,
          aiModel,
          imageBase64: base64,
          imageType: item.editedFile.type
        })
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("Empty response content from AI model.");

      let cleanText = content.trim();
      if (cleanText.startsWith("```json")) {
        cleanText = cleanText.substring(7);
      }
      if (cleanText.startsWith("```")) {
        cleanText = cleanText.substring(3);
      }
      if (cleanText.endsWith("```")) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
      }

      const parsed = JSON.parse(cleanText.trim());

      setUploadQueue((prev) =>
        prev.map((q) =>
          q.id === itemId
            ? {
                ...q,
                title: parsed.title || q.title,
                description: parsed.description || q.description,
                tags: Array.isArray(parsed.tags) ? parsed.tags : q.tags,
              }
            : q
        )
      );

      return true;
    } catch (e) {
      console.error("AI Autotag error:", e);
      const errMsg = e instanceof Error ? e.message : String(e);
      alert(`AI metadata generation failed for ${item.fileName}: ${errMsg}`);
      return false;
    } finally {
      setAiLoadingMap(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleBulkAiAutofill = async () => {
    const unsavedItems = uploadQueue.filter(q => !q.saved && !q.uploading);
    if (unsavedItems.length === 0) return;

    setBulkAiLoading(true);
    for (const item of unsavedItems) {
      await generateAiMetadata(item.id);
    }
    setBulkAiLoading(false);
  };

  // Drag and Drop Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  // Supabase Storage upload
  const uploadFileToStorage = async (
    file: File, 
    folder: "original" | "edited", 
    onProgress: (progress: number) => void
  ): Promise<string> => {
    const signRes = await fetch("/api/gallery/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        action: "get-upload-url", 
        filename: file.name,
        folder
      })
    });

    if (!signRes.ok) {
      const errorData = await signRes.json();
      throw new Error(`Failed to generate signed URL: ${errorData.error || signRes.statusText}`);
    }

    const { signedUrl, publicUrl } = await signRes.json();

    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", signedUrl, true);
      xhr.setRequestHeader("Content-Type", file.type);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          onProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(publicUrl);
        } else {
          reject(new Error(`Storage upload failed with status ${xhr.status}: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during storage upload"));
      xhr.send(file);
    });
  };

  // Save single photo record
  const savePhotoItem = async (itemId: string) => {
    const item = uploadQueue.find((q) => q.id === itemId);
    if (!item || item.saved || item.uploading) return;

    setUploadQueue((prev) =>
      prev.map((q) => (q.id === itemId ? { ...q, uploading: true, error: null } : q))
    );

    try {
      let editedUrl = "";
      let originalUrl = "";

      // 1. Upload Edited Version
      editedUrl = await uploadFileToStorage(
        item.editedFile, 
        "edited", 
        (progress) => {
          setUploadQueue((prev) =>
            prev.map((q) => 
              q.id === itemId 
                ? { ...q, uploadProgress: Math.round(progress * 0.45) }
                : q
            )
          );
        }
      );

      // 2. Upload Original Version
      if (item.originalFile) {
        originalUrl = await uploadFileToStorage(
          item.originalFile,
          "original",
          (progress) => {
            setUploadQueue((prev) =>
              prev.map((q) =>
                q.id === itemId
                  ? { ...q, uploadProgress: 45 + Math.round(progress * 0.45) }
                  : q
              )
            );
          }
        );
      } else {
        originalUrl = editedUrl;
      }

      setUploadQueue((prev) =>
        prev.map((q) => (q.id === itemId ? { ...q, uploadProgress: 95 } : q))
      );

      // 3. Save DB record
      const saveRes = await fetch("/api/gallery/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-photo",
          photo: {
            title: item.title,
            description: item.description,
            backstory: item.backstory,
            date: item.date, // Stored as ISO or datetime string
            year: item.year,
            tags: item.tags,
            original: originalUrl,
            edited: editedUrl,
            city: item.city,
            province: item.province,
            country: item.country,
            published: item.published,
            hash: item.hash
          }
        })
      });

      if (!saveRes.ok) {
        const errData = await saveRes.json();
        throw new Error(errData.error || "Failed to save photo metadata");
      }

      const resData = await saveRes.json();

      setUploadQueue((prev) =>
        prev.map((q) => 
          q.id === itemId 
            ? { ...q, uploading: false, uploaded: true, saved: true, uploadProgress: 100 } 
            : q
        )
      );

      // Prepend to existing photos list locally
      setExistingPhotos(prev => [resData.photo, ...prev]);

      setTimeout(() => {
        setUploadQueue((prev) => {
          const filtered = prev.filter((q) => q.id !== itemId);
          URL.revokeObjectURL(item.previewUrl);
          if (item.originalPreviewUrl) URL.revokeObjectURL(item.originalPreviewUrl);
          return filtered;
        });
      }, 1200);

    } catch (err) {
      console.error(`Error saving item ${item.fileName}:`, err);
      const errMsg = err instanceof Error ? err.message : "Failed to save";
      setUploadQueue((prev) =>
        prev.map((q) => (q.id === itemId ? { ...q, uploading: false, error: errMsg } : q))
      );
    }
  };

  const saveAllPhotos = async () => {
    const pendingItems = uploadQueue.filter((q) => !q.saved && !q.uploading);
    for (const item of pendingItems) {
      await savePhotoItem(item.id);
    }
  };

  const removeQueueItem = (id: string) => {
    setUploadQueue((prev) => {
      const filtered = prev.filter((q) => q.id !== id);
      const item = prev.find((q) => q.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
        if (item.originalPreviewUrl) URL.revokeObjectURL(item.originalPreviewUrl);
      }
      return filtered;
    });
  };

  const clearQueue = () => {
    if (confirm("Discard all pending uploads in your queue?")) {
      uploadQueue.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
        if (item.originalPreviewUrl) URL.revokeObjectURL(item.originalPreviewUrl);
      });
      setUploadQueue([]);
    }
  };

  const handleTogglePublish = async (photo: Photo) => {
    const updatedPhoto = { ...photo, published: !photo.published };
    
    setExistingPhotos((prev) =>
      prev.map((p) => (p.id === photo.id ? updatedPhoto : p))
    );

    try {
      const res = await fetch("/api/gallery/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-photo",
          photo: updatedPhoto
        })
      });

      if (!res.ok) {
        setExistingPhotos((prev) =>
          prev.map((p) => (p.id === photo.id ? photo : p))
        );
        alert("Failed to update publication status.");
      }
    } catch (e) {
      setExistingPhotos((prev) =>
        prev.map((p) => (p.id === photo.id ? photo : p))
      );
      alert("Failed to connect to server.");
    }
  };

  const handleDeletePhoto = async (photo: Photo) => {
    if (!confirm(`Are you sure you want to delete "${photo.title}"? This will erase it permanently.`)) {
      return;
    }

    setExistingPhotos((prev) => prev.filter((p) => p.id !== photo.id));

    try {
      const res = await fetch("/api/gallery/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete-photo",
          id: photo.id,
          original: photo.original,
          edited: photo.edited
        })
      });

      if (!res.ok) {
        setExistingPhotos((prev) => [...prev, photo].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        alert("Failed to delete photo.");
      }
    } catch (e) {
      setExistingPhotos((prev) => [...prev, photo].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      alert("Failed to connect to server.");
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto) return;
    setSavingEdit(true);

    try {
      const res = await fetch("/api/gallery/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-photo",
          photo: editingPhoto
        })
      });

      if (res.ok) {
        const data = await res.json();
        setExistingPhotos((prev) =>
          prev.map((p) => (p.id === editingPhoto.id ? data.photo : p))
        );
        setEditingPhoto(null);
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || "Failed to save edits."}`);
      }
    } catch (e) {
      alert("Network error. Failed to save.");
    } finally {
      setSavingEdit(false);
    }
  };

  const updateQueueItem = (id: string, fields: Partial<UploadItem>) => {
    setUploadQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...fields } : item))
    );
  };

  // Lock Screen Render
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base text-text">
        <Loader2 className="animate-spin text-mauve" size={48} />
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center bg-base relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-mauve/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue/10 rounded-full blur-3xl" />

        <motion.div
          animate={shouldShake ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-crust/80 border border-surface0/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl relative z-10"
        >
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="p-4 bg-surface0/60 rounded-full border border-surface1 mb-4 text-mauve">
              <Lock size={32} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text">Gallery Admin</h1>
            <p className="text-sm text-subtext0 mt-2">Unlock the secret portal to upload and manage your photography</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-subtext1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface0 border border-surface1 rounded-xl px-4 py-3 text-text placeholder:text-overlay0 outline-none focus:border-mauve transition-colors"
                  placeholder="Enter secret password..."
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-subtext0 hover:text-text transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {authError && (
                <div className="flex items-center gap-2 text-red text-xs mt-1 font-medium bg-red/10 px-3 py-2 rounded-lg border border-red/20">
                  <AlertCircle size={14} />
                  <span>{authError}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full flex items-center justify-center gap-2 bg-mauve text-base font-bold py-3.5 rounded-xl hover:bg-opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-mauve/20"
            >
              {authLoading ? <Loader2 className="animate-spin" size={18} /> : <>Unlock Portal</>}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Dashboard Render
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-text bg-base">
      
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b border-surface0 pb-8 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-mauve flex items-center gap-2">
            <Sparkles size={28} /> Photography Portal
          </h1>
          <p className="text-subtext0 mt-2 text-sm">
            Bulk-upload photos, parse GPS locations, swap comparisons, and run Vision AI metadata fills.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-4 py-2 text-sm font-semibold rounded-xl border transition-all cursor-pointer ${
              activeTab === "upload" 
                ? "bg-mauve text-base border-mauve shadow-lg shadow-mauve/10" 
                : "bg-surface0 border-surface1 hover:bg-surface1 text-text"
            }`}
          >
            Upload Photos
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={`px-4 py-2 text-sm font-semibold rounded-xl border transition-all cursor-pointer ${
              activeTab === "manage" 
                ? "bg-mauve text-base border-mauve shadow-lg shadow-mauve/10" 
                : "bg-surface0 border-surface1 hover:bg-surface1 text-text"
            }`}
          >
            Manage Gallery ({existingPhotos.length || "..."})
          </button>
          
          <button
            onClick={() => setShowAiSettings(true)}
            className="p-2 bg-surface0 hover:bg-surface1 text-subtext0 hover:text-text border border-surface1 rounded-xl transition-all cursor-pointer"
            title="Configure Vision AI Settings"
          >
            <Settings size={20} />
          </button>

          <button
            onClick={handleLogout}
            className="p-2 bg-surface0 hover:bg-red/20 text-subtext0 hover:text-red border border-surface1 hover:border-red/30 rounded-xl transition-all cursor-pointer"
            title="Log Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Tab: UPLOAD */}
      {activeTab === "upload" && (
        <div className="space-y-8">
          
          {/* File Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`relative min-h-[220px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-all ${
              dragActive 
                ? "border-mauve bg-mauve/5" 
                : "border-surface1 hover:border-surface2 bg-crust/40"
            }`}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => e.target.files && handleFilesAdded(e.target.files)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            
            <div className="p-4 bg-surface0/60 rounded-full border border-surface1 mb-4 text-mauve">
              {queueLoading ? <Loader2 className="animate-spin" size={32} /> : <Upload size={32} />}
            </div>
            
            <h3 className="text-lg font-bold text-text mb-1">
              {queueLoading ? "Computing SHA-256 hashes..." : "Drag and drop your photos"}
            </h3>
            <p className="text-sm text-subtext0 max-w-md px-4">
              Supports bulk imports. Drop edited files and matching originals named <code className="bg-surface0 px-1.5 py-0.5 rounded text-mauve">[name]_orig.jpg</code> to auto-match them.
            </p>
          </div>

          {/* Pending Upload List */}
          {uploadQueue.length > 0 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-surface0 pb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  Pending Upload Queue 
                  <span className="bg-mauve/20 text-mauve px-2.5 py-0.5 rounded-full text-xs font-semibold">{uploadQueue.length}</span>
                </h3>
                
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleBulkAiAutofill}
                    disabled={bulkAiLoading || uploadQueue.some((q) => q.uploading)}
                    className="flex items-center gap-2 bg-mauve/20 border border-mauve/30 text-mauve font-semibold px-4 py-2 rounded-xl hover:bg-mauve/30 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer text-sm"
                  >
                    {bulkAiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    <span>AI Auto-Fill All</span>
                  </button>

                  <button
                    onClick={clearQueue}
                    disabled={uploadQueue.some((q) => q.uploading)}
                    className="flex items-center gap-2 bg-surface0 hover:bg-surface1 text-text border border-surface1 px-4 py-2 rounded-xl active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer text-sm"
                  >
                    <X size={16} /> Discard All
                  </button>

                  <button
                    onClick={saveAllPhotos}
                    disabled={uploadQueue.some((q) => q.uploading)}
                    className="flex items-center gap-2 bg-green text-crust font-bold px-5 py-2.5 rounded-xl hover:bg-opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-green/10 text-sm"
                  >
                    <Save size={16} /> Save & Publish All
                  </button>
                </div>
              </div>

              {/* Upload queue forms */}
              <div className="space-y-8">
                {uploadQueue.map((item) => (
                  <div
                    key={item.id}
                    className="bg-crust/50 border border-surface0/70 p-6 rounded-2xl flex flex-col md:flex-row gap-6 relative overflow-hidden transition-colors"
                  >
                    {/* Status progress bar */}
                    {item.uploading && (
                      <div className="absolute bottom-0 left-0 h-1 bg-mauve transition-all duration-300" style={{ width: `${item.uploadProgress}%` }} />
                    )}
                    
                    {/* Saved modal overlay */}
                    {item.saved && (
                      <div className="absolute inset-0 bg-green/5 border border-green/30 backdrop-blur-[1px] pointer-events-none flex items-center justify-center z-20">
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }} 
                          animate={{ scale: 1, opacity: 1 }}
                          className="bg-crust border border-green p-4 rounded-xl flex items-center gap-3 shadow-2xl text-green"
                        >
                          <Check size={24} className="stroke-[3]" />
                          <span className="font-bold text-lg">Saved successfully!</span>
                        </motion.div>
                      </div>
                    )}

                    {/* Thumbnail preview details */}
                    <div className="w-full md:w-56 shrink-0 flex flex-col gap-3">
                      <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-surface0 border border-surface1 relative">
                        <img src={item.previewUrl} alt={item.fileName} className="w-full h-full object-cover" />
                        
                        {/* Queue Item Status Overlays */}
                        {!item.exifParsed && (
                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 text-xs">
                            <Loader2 className="animate-spin text-mauve" size={20} />
                            <span>EXIF Scan...</span>
                          </div>
                        )}
                        {item.geocoding && (
                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 text-xs">
                            <Loader2 className="animate-spin text-mauve" size={20} />
                            <span>Geocoding coordinates...</span>
                          </div>
                        )}
                        {aiLoadingMap[item.id] && (
                          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 text-xs">
                            <Sparkles className="animate-pulse text-mauve" size={24} />
                            <span className="font-semibold text-mauve">AI categorizing...</span>
                          </div>
                        )}
                      </div>

                      {/* File Details box */}
                      <div className="text-[10px] bg-surface0/60 p-3 rounded-lg border border-surface1/60 space-y-1.5 font-mono">
                        <div className="truncate" title={item.fileName}>
                          <span className="text-mauve font-semibold">Name:</span> {item.fileName}
                        </div>
                        <div className="truncate" title={item.hash}>
                          <span className="text-mauve font-semibold">Hash:</span> {item.hash.substring(0, 16)}...
                        </div>
                        {item.originalFile ? (
                          <div className="truncate text-green flex items-center gap-1 font-semibold">
                            <Check size={11} className="stroke-[3]" />
                            <span>Paired Comparison</span>
                          </div>
                        ) : (
                          <div className="text-subtext0 italic">No original version</div>
                        )}
                      </div>
                    </div>

                    {/* Metadata fields form */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Left form inputs */}
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-semibold text-subtext1 mb-1 block">Title</label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => updateQueueItem(item.id, { title: e.target.value })}
                            className="w-full bg-surface0 border border-surface1/80 rounded-lg px-3 py-2 text-sm text-text placeholder:text-overlay0 outline-none focus:border-mauve"
                            placeholder="Creative title..."
                          />
                        </div>
                        
                        <div>
                          <label className="text-xs font-semibold text-subtext1 mb-1 block">Subheading / Description</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateQueueItem(item.id, { description: e.target.value })}
                            className="w-full bg-surface0 border border-surface1/80 rounded-lg px-3 py-2 text-sm text-text placeholder:text-overlay0 outline-none focus:border-mauve"
                            placeholder="Captured in Paris, France..."
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-subtext1 mb-1 block">Backstory</label>
                          <textarea
                            value={item.backstory}
                            onChange={(e) => updateQueueItem(item.id, { backstory: e.target.value })}
                            rows={3}
                            className="w-full bg-surface0 border border-surface1/80 rounded-lg px-3 py-2 text-sm text-text placeholder:text-overlay0 outline-none focus:border-mauve resize-none"
                            placeholder="Tell the story behind this shot..."
                          />
                        </div>
                      </div>

                      {/* Right form inputs */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            {/* Datetime support with hours, minutes, seconds */}
                            <label className="text-xs font-semibold text-subtext1 mb-1 block">Date & Time (Local)</label>
                            <input
                              type="datetime-local"
                              step="1"
                              value={item.date}
                              onChange={(e) => {
                                const val = e.target.value;
                                const yearVal = val ? new Date(val).getFullYear().toString() : item.year;
                                updateQueueItem(item.id, { date: val, year: yearVal });
                              }}
                              className="w-full bg-surface0 border border-surface1/80 rounded-lg px-3 py-1.5 text-xs text-text outline-none focus:border-mauve"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-subtext1 mb-1 block">Year</label>
                            <input
                              type="text"
                              value={item.year}
                              onChange={(e) => updateQueueItem(item.id, { year: e.target.value })}
                              className="w-full bg-surface0 border border-surface1/80 rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-mauve"
                              placeholder="Year"
                            />
                          </div>
                        </div>

                        {/* Location Details (Country, Province, City) */}
                        <div>
                          <label className="text-xs font-semibold text-subtext1 mb-1 block flex items-center gap-1">
                            <MapPin size={12} className="text-mauve" /> Location Details
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={item.city}
                              onChange={(e) => updateQueueItem(item.id, { city: e.target.value })}
                              className="bg-surface0 border border-surface1/80 rounded-lg px-2 py-1.5 text-xs text-text placeholder:text-overlay0 outline-none focus:border-mauve"
                              placeholder="City"
                            />
                            <input
                              type="text"
                              value={item.province}
                              onChange={(e) => updateQueueItem(item.id, { province: e.target.value })}
                              className="bg-surface0 border border-surface1/80 rounded-lg px-2 py-1.5 text-xs text-text placeholder:text-overlay0 outline-none focus:border-mauve"
                              placeholder="Province"
                            />
                            <input
                              type="text"
                              value={item.country}
                              onChange={(e) => updateQueueItem(item.id, { country: e.target.value })}
                              className="bg-surface0 border border-surface1/80 rounded-lg px-2 py-1.5 text-xs text-text placeholder:text-overlay0 outline-none focus:border-mauve"
                              placeholder="Country"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-subtext1 mb-1 block">Tags (comma-separated)</label>
                          <input
                            type="text"
                            value={item.tags.join(", ")}
                            onChange={(e) => updateQueueItem(item.id, { tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                            className="w-full bg-surface0 border border-surface1/80 rounded-lg px-3 py-2 text-sm text-text placeholder:text-overlay0 outline-none focus:border-mauve"
                            placeholder="nature, landscape, travel..."
                          />
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-surface0/50">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={item.published}
                              onChange={(e) => updateQueueItem(item.id, { published: e.target.checked })}
                              className="w-4 h-4 accent-mauve rounded border-surface1"
                            />
                            <span className="text-xs font-semibold text-subtext1">Publish Immediately</span>
                          </label>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => removeQueueItem(item.id)}
                              disabled={item.uploading}
                              className="p-2 bg-surface0 hover:bg-red/10 text-subtext1 hover:text-red border border-surface1 hover:border-red/20 rounded-lg transition-colors cursor-pointer"
                              title="Discard pending photo"
                            >
                              <Trash2 size={16} />
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => generateAiMetadata(item.id)}
                              disabled={aiLoadingMap[item.id] || item.uploading}
                              className="p-2 bg-surface0 hover:bg-mauve/20 text-mauve border border-surface1 hover:border-mauve/30 rounded-lg transition-colors cursor-pointer"
                              title="AI Auto-Fill fields"
                            >
                              <Sparkles size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => savePhotoItem(item.id)}
                              disabled={item.uploading || aiLoadingMap[item.id]}
                              className="flex items-center gap-1.5 bg-mauve text-base px-3.5 py-2 rounded-lg font-bold hover:bg-opacity-95 disabled:opacity-50 cursor-pointer text-xs"
                            >
                              {item.uploading ? (
                                <>
                                  <Loader2 size={13} className="animate-spin" />
                                  <span>{item.uploadProgress}%</span>
                                </>
                              ) : (
                                <>
                                  <Save size={13} />
                                  <span>Save</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {item.error && (
                          <div className="text-red text-xs mt-1 bg-red/15 border border-red/20 p-2.5 rounded-lg flex items-center gap-1">
                            <AlertCircle size={14} />
                            <span className="font-semibold">Error: {item.error}</span>
                          </div>
                        )}
                      </div>

                      {/* Comparison upload & slot swapping */}
                      <div className="col-span-full border-t border-surface0/60 pt-4 mt-2">
                        <label className="text-xs font-semibold text-subtext1 mb-2 block">Comparison Images</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                          
                          {/* Edited image preview */}
                          <div className="bg-surface0/20 border border-surface1/40 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                            <span className="text-[10px] uppercase font-bold text-mauve tracking-wider mb-2">Edited Version (Main)</span>
                            <div className="w-24 h-18 rounded overflow-hidden bg-black/40 border border-surface1 mb-2 relative">
                              <img src={item.previewUrl} alt="Edited preview" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[10px] text-subtext0 truncate max-w-[150px] font-mono">{item.editedFile.name}</span>
                          </div>

                          {/* Swap button */}
                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={() => handleSwapSlots(item.id)}
                              disabled={!item.originalFile}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                item.originalFile
                                  ? "bg-surface0 border-surface1 hover:bg-surface1 text-text cursor-pointer active:scale-95"
                                  : "bg-surface0/10 border-surface0/30 text-overlay0 cursor-not-allowed"
                              }`}
                              title={item.originalFile ? "Swap Edited and Original slots" : "Add an original photo comparison below to enable swapping"}
                            >
                              <RefreshCw size={12} />
                              <span>⇄ Swap Slots</span>
                            </button>
                          </div>

                          {/* Original image slot */}
                          <div className="bg-surface0/20 border border-surface1/40 rounded-xl p-3 flex flex-col items-center justify-center text-center relative">
                            <span className="text-[10px] uppercase font-bold text-subtext1 tracking-wider mb-2">Original Version (Comparison)</span>
                            
                            {item.originalFile ? (
                              <>
                                <div className="w-24 h-18 rounded overflow-hidden bg-black/40 border border-surface1 mb-2 relative">
                                  <img 
                                    src={item.originalPreviewUrl} 
                                    alt="Original preview"
                                    className="w-full h-full object-cover" 
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      URL.revokeObjectURL(item.originalPreviewUrl);
                                      updateQueueItem(item.id, { originalFile: null, originalPreviewUrl: "" });
                                    }}
                                    className="absolute -top-1.5 -right-1.5 bg-red text-crust rounded-full p-0.5 hover:scale-105 transition-transform cursor-pointer"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                                <span className="text-[10px] text-subtext0 truncate max-w-[150px] font-mono">{item.originalFile.name}</span>
                              </>
                            ) : (
                              <div className="relative border border-dashed border-surface2/60 rounded-lg w-24 h-18 flex items-center justify-center bg-black/20 hover:border-mauve transition-colors">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      updateQueueItem(item.id, { 
                                        originalFile: e.target.files[0],
                                        originalPreviewUrl: URL.createObjectURL(e.target.files[0])
                                      });
                                    }
                                  }}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <Plus size={16} className="text-overlay0" />
                              </div>
                            )}
                          </div>

                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploadQueue.length === 0 && (
            <div className="note-block bg-crust/50 border-l-mauve p-6 rounded-xl flex items-start gap-4">
              <Sparkles className="text-mauve shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-bold text-text mb-1 italic">Vibe check for uploading:</h4>
                <p className="text-sm text-subtext0 leading-relaxed font-sans font-normal">
                  Drop your images in. We will check for duplicate files instantly in the browser. You can click <strong className="text-mauve font-semibold">AI Auto-Fill</strong> to automatically generate gorgeous tags, titles, and descriptions!
                </p>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Tab: MANAGE */}
      {activeTab === "manage" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Existing Gallery Photos</h3>
            <button
              onClick={fetchExistingPhotos}
              className="text-xs bg-surface0 border border-surface1 hover:bg-surface1 px-3 py-1.5 rounded-lg transition-colors font-mono cursor-pointer"
            >
              Refresh List
            </button>
          </div>

          {photosLoading ? (
            <div className="flex items-center justify-center py-20 text-subtext0">
              <Loader2 className="animate-spin text-mauve mr-2" size={24} />
              <span>Loading photos from database...</span>
            </div>
          ) : existingPhotos.length === 0 ? (
            <div className="text-center py-20 bg-crust/30 border border-surface0/60 rounded-2xl">
              <p className="text-subtext0">No photos found. Upload some above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {existingPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="bg-crust border border-surface0/60 rounded-xl overflow-hidden flex flex-col group relative"
                >
                  <div className="absolute top-3 left-3 z-10 flex gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border backdrop-blur-md ${
                      photo.published 
                        ? "bg-green/15 text-green border-green/30" 
                        : "bg-overlay0/20 text-overlay0 border-overlay0/20"
                    }`}>
                      {photo.published ? "Published" : "Draft"}
                    </span>
                  </div>

                  <div className="aspect-[4/3] bg-surface0 border-b border-surface0 relative">
                    <img src={photo.edited} alt={photo.title} className="w-full h-full object-cover" />
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-lg truncate mb-1">{photo.title}</h4>
                      <p className="text-xs text-subtext0 line-clamp-2 mb-3">{photo.description || "No description"}</p>
                      
                      <div className="flex flex-wrap gap-2 text-[10px] font-mono text-subtext1 mb-4">
                        {photo.date && (
                          <span className="flex items-center gap-1 bg-surface0 border border-surface1/60 px-2 py-0.5 rounded-full">
                            <Calendar size={10} className="text-mauve" /> {new Date(photo.date).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                          </span>
                        )}
                        {(photo.city || photo.country) && (
                          <span className="flex items-center gap-0.5 bg-surface0 border border-surface1/60 px-2 py-0.5 rounded-full truncate max-w-[150px]">
                            <MapPin size={10} className="text-mauve" /> {[photo.city, photo.country].filter(Boolean).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-surface0">
                      <button
                        onClick={() => handleTogglePublish(photo)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
                          photo.published 
                            ? "bg-surface0 border-surface1 hover:bg-surface1 text-text" 
                            : "bg-green text-crust border-green font-bold"
                        }`}
                      >
                        {photo.published ? "Revert to Draft" : "Publish"}
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingPhoto(photo)}
                          className="p-1.5 bg-surface0 border border-surface1 text-subtext0 hover:text-text rounded-lg transition-colors cursor-pointer"
                          title="Edit metadata"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeletePhoto(photo)}
                          className="p-1.5 bg-surface0 border border-surface1 text-subtext0 hover:text-red hover:border-red/30 rounded-lg transition-colors cursor-pointer"
                          title="Delete photo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DUPLICATE RESOLUTION MODAL */}
      <AnimatePresence>
        {pendingDuplicates.length > 0 && (
          <div className="fixed inset-0 bg-base/90 backdrop-blur-md z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-crust border border-surface0 p-6 rounded-2xl max-w-md w-full shadow-2xl flex flex-col gap-6"
            >
              <div className="text-center">
                <div className="p-3 bg-red/10 border border-red/20 rounded-full text-red w-fit mx-auto mb-3">
                  <AlertCircle size={28} />
                </div>
                <h3 className="text-xl font-bold text-text">Duplicate Image Detected</h3>
                <p className="text-xs text-subtext0 mt-2">
                  The file <code className="bg-surface0 px-1 py-0.5 rounded text-red">{pendingDuplicates[0].file.name}</code> has the exact same content as a photo already in the {pendingDuplicates[0].matchedSource === "database" ? "published gallery" : "upload queue"} (matches: &quot;{pendingDuplicates[0].matchedTitle}&quot;).
                </p>
              </div>

              {/* Image Preview */}
              <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-black/40 border border-surface1 relative">
                <img src={pendingDuplicates[0].previewUrl} alt="Duplicate preview" className="w-full h-full object-contain" />
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => resolveDuplicate(false)}
                  className="bg-surface0 border border-surface1 hover:bg-surface1 text-text py-2.5 rounded-xl font-semibold transition-all cursor-pointer text-xs"
                >
                  Skip File
                </button>
                <button
                  onClick={() => resolveDuplicate(true)}
                  className="bg-mauve text-base hover:bg-opacity-90 text-crust py-2.5 rounded-xl font-bold transition-all cursor-pointer text-xs"
                >
                  Upload Anyway
                </button>

                <button
                  onClick={skipAllDuplicates}
                  className="col-span-1 bg-surface0/40 hover:bg-surface0 border border-surface1/60 text-subtext1 py-2 rounded-xl text-[10px] font-semibold transition-all cursor-pointer"
                >
                  Skip All Remaining ({pendingDuplicates.length})
                </button>
                <button
                  onClick={uploadAllDuplicates}
                  className="col-span-1 bg-surface0/40 hover:bg-surface0 border border-surface1/60 text-subtext1 py-2 rounded-xl text-[10px] font-semibold transition-all cursor-pointer"
                >
                  Upload All Remaining ({pendingDuplicates.length})
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI CONFIGURATION MODAL */}
      <AnimatePresence>
        {showAiSettings && (
          <div className="fixed inset-0 bg-base/80 backdrop-blur-md z-[130] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-crust border border-surface0 p-6 rounded-2xl max-w-md w-full shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-mauve flex items-center gap-2">
                  <Settings size={20} /> Vision AI Settings
                </h3>
                <button onClick={() => setShowAiSettings(false)} className="text-subtext0 hover:text-text cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveAiSettings} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-subtext1 mb-1 block">API Base URL</label>
                  <input
                    type="text"
                    value={aiBaseUrl}
                    onChange={(e) => setAiBaseUrl(e.target.value)}
                    className="w-full bg-surface0 border border-surface1 rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-mauve"
                    placeholder="https://api.openai.com/v1"
                    required
                  />
                  <span className="text-[10px] text-overlay0 mt-1 block">Compatible with standard OpenAI API specs.</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-subtext1 mb-1 block">API Key</label>
                  <input
                    type="password"
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    className="w-full bg-surface0 border border-surface1 rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-mauve"
                    placeholder="sk-..."
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-subtext1 mb-1 block">Model Name</label>
                  <input
                    type="text"
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="w-full bg-surface0 border border-surface1 rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-mauve"
                    placeholder="gpt-4o-mini"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-surface0">
                  <button
                    type="button"
                    onClick={() => setShowAiSettings(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-surface0 border border-surface1 hover:bg-surface1 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-mauve text-base px-5 py-2 rounded-lg font-bold hover:bg-opacity-95 transition-all cursor-pointer text-xs"
                  >
                    Save Config
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT MODAL FOR EXISTING PHOTOS */}
      <AnimatePresence>
        {editingPhoto && (
          <div className="fixed inset-0 bg-base/80 backdrop-blur-md z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-crust border border-surface0 p-6 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
            >
              <button
                onClick={() => setEditingPhoto(null)}
                className="absolute top-4 right-4 text-subtext0 hover:text-text transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <h3 className="text-xl font-bold mb-6 text-mauve flex items-center gap-2">
                <Edit size={20} /> Edit Photo Details
              </h3>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-subtext1 mb-1 block">Title</label>
                      <input
                        type="text"
                        value={editingPhoto.title}
                        onChange={(e) => setEditingPhoto({ ...editingPhoto, title: e.target.value })}
                        className="w-full bg-surface0 border border-surface1 rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-mauve"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-subtext1 mb-1 block">Subheading / Description</label>
                      <input
                        type="text"
                        value={editingPhoto.description}
                        onChange={(e) => setEditingPhoto({ ...editingPhoto, description: e.target.value })}
                        className="w-full bg-surface0 border border-surface1 rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-mauve"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-subtext1 mb-1 block">Backstory</label>
                      <textarea
                        value={editingPhoto.backstory}
                        onChange={(e) => setEditingPhoto({ ...editingPhoto, backstory: e.target.value })}
                        rows={4}
                        className="w-full bg-surface0 border border-surface1 rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-mauve resize-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        {/* datetime-local editing for existing images */}
                        <label className="text-xs font-semibold text-subtext1 mb-1 block">Date & Time</label>
                        <input
                          type="datetime-local"
                          step="1"
                          value={editingPhoto.date ? formatDateToLocalDatetime(editingPhoto.date) : ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const yearVal = val ? new Date(val).getFullYear().toString() : editingPhoto.year;
                            setEditingPhoto({ ...editingPhoto, date: val, year: yearVal });
                          }}
                          className="w-full bg-surface0 border border-surface1 rounded-lg px-3 py-1.5 text-xs text-text outline-none focus:border-mauve"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-subtext1 mb-1 block">Year</label>
                        <input
                          type="text"
                          value={editingPhoto.year}
                          onChange={(e) => setEditingPhoto({ ...editingPhoto, year: e.target.value })}
                          className="w-full bg-surface0 border border-surface1 rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-mauve"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-subtext1 mb-1 block">Location</label>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={editingPhoto.city || ""}
                          onChange={(e) => setEditingPhoto({ ...editingPhoto, city: e.target.value })}
                          className="bg-surface0 border border-surface1 rounded-lg px-2.5 py-1.5 text-xs text-text outline-none focus:border-mauve"
                          placeholder="City"
                        />
                        <input
                          type="text"
                          value={editingPhoto.province || ""}
                          onChange={(e) => setEditingPhoto({ ...editingPhoto, province: e.target.value })}
                          className="bg-surface0 border border-surface1 rounded-lg px-2.5 py-1.5 text-xs text-text outline-none focus:border-mauve"
                          placeholder="Province"
                        />
                        <input
                          type="text"
                          value={editingPhoto.country || ""}
                          onChange={(e) => setEditingPhoto({ ...editingPhoto, country: e.target.value })}
                          className="bg-surface0 border border-surface1 rounded-lg px-2.5 py-1.5 text-xs text-text outline-none focus:border-mauve"
                          placeholder="Country"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-subtext1 mb-1 block">Tags (comma-separated)</label>
                      <input
                        type="text"
                        value={editingPhoto.tags.join(", ")}
                        onChange={(e) => setEditingPhoto({ 
                          ...editingPhoto, 
                          tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) 
                        })}
                        className="w-full bg-surface0 border border-surface1 rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-mauve"
                        placeholder="Tags"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="modal-published"
                        checked={editingPhoto.published || false}
                        onChange={(e) => setEditingPhoto({ ...editingPhoto, published: e.target.checked })}
                        className="w-4 h-4 accent-mauve rounded border-surface1"
                      />
                      <label htmlFor="modal-published" className="text-xs font-semibold text-subtext1 cursor-pointer select-none">
                        Published (visible in gallery)
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-surface0 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditingPhoto(null)}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-surface0 border border-surface1 hover:bg-surface1 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="flex items-center gap-1.5 bg-mauve text-base px-5 py-2 rounded-lg font-bold hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {savingEdit ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
