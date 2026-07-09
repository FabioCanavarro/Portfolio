"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, Check, AlertCircle, Trash2, Edit, Save, Lock, LogOut, 
  Eye, EyeOff, Globe, Calendar, Tag, Plus, X, Loader2, Sparkles, MapPin 
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
  
  // Temp preview
  previewUrl: string;
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

  // State for existing photos management
  const [existingPhotos, setExistingPhotos] = useState<Photo[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Geocoding queue refs to avoid rate limits (OSM Nominatim limit is 1 req/sec)
  const geocodeQueue = useRef<{ id: string; lat: number; lon: number }[]>([]);
  const geocodingInProgress = useRef(false);

  // Check auth status on load
  useEffect(() => {
    checkAuth();
  }, []);

  // Fetch photos if authenticated and active tab changes to 'manage'
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

  // Process Geocoding queue sequentially with 1.2s delay to comply with OSM rules
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

      // Wait 1.2 seconds before the next OSM API request
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    geocodingInProgress.current = false;
  };

  // Add files to the upload queue and match original/edited automatically
  const handleFilesAdded = async (files: FileList) => {
    const fileArray = Array.from(files);
    const newItems: UploadItem[] = [];

    // Separate possible original files and regular/edited files
    // Group files by base name
    const origSuffixes = ["_orig", "-orig", "_original", "-original"];
    
    // Create preview URLs and basic structures
    for (const file of fileArray) {
      // Check if it's an original file. If so, we'll try to pair it with the main edited file
      const lowercaseName = file.name.toLowerCase();
      const isOriginalFile = origSuffixes.some(suffix => {
        const extIndex = lowercaseName.lastIndexOf(".");
        const nameWithoutExt = extIndex !== -1 ? lowercaseName.substring(0, extIndex) : lowercaseName;
        return nameWithoutExt.endsWith(suffix);
      });

      if (isOriginalFile) continue; // We will handle matching original files inside the main loop

      const tempId = Math.random().toString(36).substring(2, 9);
      const extIndex = file.name.lastIndexOf(".");
      const baseName = extIndex !== -1 ? file.name.substring(0, extIndex) : file.name;
      
      // Auto prefill title: Capitalize words, replace dashes/underscores
      const formattedTitle = baseName
        .replace(/[_\-]/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase());

      // Look for a matching original file in the list
      let matchedOriginalFile: File | null = null;
      for (const origFile of fileArray) {
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

      const item: UploadItem = {
        id: tempId,
        fileName: file.name,
        title: formattedTitle,
        description: "",
        backstory: "",
        date: new Date().toISOString().split("T")[0],
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
        previewUrl: URL.createObjectURL(file)
      };

      newItems.push(item);
    }

    setUploadQueue((prev) => [...prev, ...newItems]);

    // Parse EXIF and GPS details for each new item
    for (const item of newItems) {
      try {
        const exif = await exifr.parse(item.editedFile, {
          gps: true,
          tiff: true,
        });

        let exifDate = item.date;
        let exifYear = item.year;

        if (exif && exif.DateTimeOriginal) {
          const d = new Date(exif.DateTimeOriginal);
          if (!isNaN(d.getTime())) {
            exifDate = d.toISOString().split("T")[0];
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

        // If GPS details are present, push to geocoding queue
        if (exif && exif.latitude && exif.longitude) {
          geocodeQueue.current.push({
            id: item.id,
            lat: exif.latitude,
            lon: exif.longitude,
          });
          processGeocodeQueue();
        }
      } catch (e) {
        console.error("Error reading EXIF data for file:", item.fileName, e);
        // Still mark as parsed to clear loading indicators
        setUploadQueue((prev) =>
          prev.map((qItem) =>
            qItem.id === item.id ? { ...qItem, exifParsed: true } : qItem
          )
        );
      }
    }
  };

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

  // Helper to upload a single file directly to Supabase storage via signed upload URL
  const uploadFileToStorage = async (
    file: File, 
    folder: "original" | "edited", 
    onProgress: (progress: number) => void
  ): Promise<string> => {
    // 1. Get signed upload URL from backend
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

    // 2. Upload file directly to signed URL using XMLHTTPRequest to track upload progress
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

  // Save/Publish a single item from the queue
  const savePhotoItem = async (itemId: string) => {
    const item = uploadQueue.find((q) => q.id === itemId);
    if (!item || item.saved || item.uploading) return;

    setUploadQueue((prev) =>
      prev.map((q) => (q.id === itemId ? { ...q, uploading: true, error: null } : q))
    );

    try {
      let editedUrl = "";
      let originalUrl = "";

      // 1. Upload Edited Image
      setUploadQueue((prev) =>
        prev.map((q) => (q.id === itemId ? { ...q, uploadProgress: 10 } : q))
      );
      
      editedUrl = await uploadFileToStorage(
        item.editedFile, 
        "edited", 
        (progress) => {
          setUploadQueue((prev) =>
            prev.map((q) => 
              q.id === itemId 
                ? { ...q, uploadProgress: Math.round(progress * 0.45) } // Scales to 45% of total progress
                : q
            )
          );
        }
      );

      // 2. Upload Original Image if exists, else copy edited URL
      if (item.originalFile) {
        setUploadQueue((prev) =>
          prev.map((q) => (q.id === itemId ? { ...q, uploadProgress: 50 } : q))
        );

        originalUrl = await uploadFileToStorage(
          item.originalFile,
          "original",
          (progress) => {
            setUploadQueue((prev) =>
              prev.map((q) =>
                q.id === itemId
                  ? { ...q, uploadProgress: 50 + Math.round(progress * 0.45) } // Scales to 50-95%
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

      // 3. Save photo metadata to database
      const saveRes = await fetch("/api/gallery/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-photo",
          photo: {
            title: item.title,
            description: item.description,
            backstory: item.backstory,
            date: item.date,
            year: item.year,
            tags: item.tags,
            original: originalUrl,
            edited: editedUrl,
            city: item.city,
            province: item.province,
            country: item.country,
            published: item.published
          }
        })
      });

      if (!saveRes.ok) {
        const errData = await saveRes.json();
        throw new Error(errData.error || "Failed to save photo metadata");
      }

      // Success
      setUploadQueue((prev) =>
        prev.map((q) => 
          q.id === itemId 
            ? { ...q, uploading: false, uploaded: true, saved: true, uploadProgress: 100 } 
            : q
        )
      );

      // Remove from list after a short delay so user can see it completed
      setTimeout(() => {
        setUploadQueue((prev) => prev.filter((q) => q.id !== itemId));
      }, 1500);

    } catch (err) {
      console.error(`Error saving item ${item.fileName}:`, err);
      const errMsg = err instanceof Error ? err.message : "Failed to save";
      setUploadQueue((prev) =>
        prev.map((q) => (q.id === itemId ? { ...q, uploading: false, error: errMsg } : q))
      );
    }
  };

  const saveAllPhotos = async () => {
    // Only process unsaved, non-uploading files
    const pendingItems = uploadQueue.filter((q) => !q.saved && !q.uploading);
    for (const item of pendingItems) {
      await savePhotoItem(item.id);
    }
  };

  const removeQueueItem = (id: string) => {
    setUploadQueue((prev) => {
      const filtered = prev.filter((q) => q.id !== id);
      const item = prev.find((q) => q.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return filtered;
    });
  };

  // Toggle publish status of an existing photo in database directly
  const handleTogglePublish = async (photo: Photo) => {
    const updatedPhoto = { ...photo, published: !photo.published };
    
    // Update local state immediately for visual responsiveness
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
        // Rollback state on error
        setExistingPhotos((prev) =>
          prev.map((p) => (p.id === photo.id ? photo : p))
        );
        alert("Failed to update status.");
      }
    } catch (e) {
      setExistingPhotos((prev) =>
        prev.map((p) => (p.id === photo.id ? photo : p))
      );
      alert("Failed to connect to server.");
    }
  };

  // Delete an existing photo from db and bucket
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
        // Rollback
        setExistingPhotos((prev) => [...prev, photo].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        alert("Failed to delete photo.");
      }
    } catch (e) {
      setExistingPhotos((prev) => [...prev, photo].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      alert("Failed to connect to server.");
    }
  };

  // Save changes to photo edited in modal
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

  // Update fields in the upload queue items
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
        {/* Glow ambient backgrounds */}
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
      
      {/* Admin header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b border-surface0 pb-8 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-mauve flex items-center gap-2">
            <Sparkles size={28} /> Photography Portal
          </h1>
          <p className="text-subtext0 mt-2 text-sm">
            Bulk-upload photos, parse GPS locations, and edit backstories.
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
            onClick={handleLogout}
            className="p-2 bg-surface0 hover:bg-red/20 text-subtext0 hover:text-red border border-surface1 hover:border-red/30 rounded-xl transition-all cursor-pointer ml-2"
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
              <Upload size={32} />
            </div>
            
            <h3 className="text-lg font-bold text-text mb-1">Drag and drop your photos</h3>
            <p className="text-sm text-subtext0 max-w-md px-4">
              Select multiple photos at once. If you want comparison cards, upload matching original and edited files. 
              Original file name must end with <code className="bg-surface0 px-1 py-0.5 rounded text-mauve">_orig</code> (e.g. <code className="bg-surface0 px-1.5 py-0.5 rounded">lake.jpg</code> & <code className="bg-surface0 px-1.5 py-0.5 rounded">lake_orig.jpg</code>).
            </p>
          </div>

          {/* Pending Upload List */}
          {uploadQueue.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-surface0 pb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  Pending Uploads <span className="bg-mauve/20 text-mauve px-2.5 py-0.5 rounded-full text-xs font-semibold">{uploadQueue.length}</span>
                </h3>
                <button
                  onClick={saveAllPhotos}
                  disabled={uploadQueue.some((q) => q.uploading)}
                  className="flex items-center gap-2 bg-green text-crust font-bold px-5 py-2.5 rounded-xl hover:bg-opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-green/10"
                >
                  <Save size={18} /> Save & Publish All
                </button>
              </div>

              <div className="space-y-6">
                {uploadQueue.map((item) => (
                  <div
                    key={item.id}
                    className="bg-crust/50 border border-surface0/70 p-6 rounded-2xl flex flex-col md:flex-row gap-6 relative overflow-hidden transition-colors"
                  >
                    {/* Status glow overlay */}
                    {item.uploading && (
                      <div className="absolute bottom-0 left-0 h-1 bg-mauve transition-all duration-300" style={{ width: `${item.uploadProgress}%` }} />
                    )}
                    {item.saved && (
                      <div className="absolute inset-0 bg-green/5 border border-green/30 backdrop-blur-[1px] pointer-events-none flex items-center justify-center z-20">
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }} 
                          animate={{ scale: 1, opacity: 1 }}
                          className="bg-crust border border-green p-4 rounded-xl flex items-center gap-3 shadow-2xl text-green"
                        >
                          <Check size={24} className="stroke-[3]" />
                          <span className="font-bold text-lg">Successfully Saved!</span>
                        </motion.div>
                      </div>
                    )}

                    {/* Thumbnail Preview & Pair indicator */}
                    <div className="w-full md:w-48 shrink-0 flex flex-col gap-3">
                      <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-surface0 border border-surface1 relative">
                        <img src={item.previewUrl} alt={item.fileName} className="w-full h-full object-cover" />
                        
                        {/* Overlay statuses */}
                        {!item.exifParsed && (
                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 text-xs">
                            <Loader2 className="animate-spin text-mauve" size={20} />
                            <span>Reading EXIF...</span>
                          </div>
                        )}
                        {item.geocoding && (
                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 text-xs">
                            <Loader2 className="animate-spin text-mauve" size={20} />
                            <span>Geocoding coordinates...</span>
                          </div>
                        )}
                      </div>

                      {/* Matching info */}
                      <div className="text-xs bg-surface0/60 p-2.5 rounded-lg border border-surface1/60 space-y-1">
                        <div className="truncate font-mono" title={item.fileName}>
                          <span className="text-mauve font-semibold">File:</span> {item.fileName}
                        </div>
                        {item.originalFile ? (
                          <div className="truncate text-green flex items-center gap-1">
                            <Check size={12} className="stroke-[2.5]" />
                            <span>Paired: {item.originalFile.name}</span>
                          </div>
                        ) : (
                          <div className="text-subtext0 italic">No comparison original</div>
                        )}
                      </div>
                    </div>

                    {/* Meta Fields Form */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Left form section */}
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-semibold text-subtext1 mb-1 block">Title</label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => updateQueueItem(item.id, { title: e.target.value })}
                            className="w-full bg-surface0 border border-surface1/80 rounded-lg px-3 py-2 text-sm text-text placeholder:text-overlay0 outline-none focus:border-mauve transition-colors"
                            placeholder="Enter photo title..."
                          />
                        </div>
                        
                        <div>
                          <label className="text-xs font-semibold text-subtext1 mb-1 block">Subheading / Description</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateQueueItem(item.id, { description: e.target.value })}
                            className="w-full bg-surface0 border border-surface1/80 rounded-lg px-3 py-2 text-sm text-text placeholder:text-overlay0 outline-none focus:border-mauve transition-colors"
                            placeholder="Brief description/subtitle..."
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-subtext1 mb-1 block">Backstory</label>
                          <textarea
                            value={item.backstory}
                            onChange={(e) => updateQueueItem(item.id, { backstory: e.target.value })}
                            rows={3}
                            className="w-full bg-surface0 border border-surface1/80 rounded-lg px-3 py-2 text-sm text-text placeholder:text-overlay0 outline-none focus:border-mauve transition-colors resize-none"
                            placeholder="Enter the backstory behind this capture..."
                          />
                        </div>
                      </div>

                      {/* Right form section */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-subtext1 mb-1 block">Date Taken</label>
                            <div className="relative">
                              <input
                                type="date"
                                value={item.date}
                                onChange={(e) => {
                                  const dateVal = e.target.value;
                                  const yearVal = dateVal ? new Date(dateVal).getFullYear().toString() : item.year;
                                  updateQueueItem(item.id, { date: dateVal, year: yearVal });
                                }}
                                className="w-full bg-surface0 border border-surface1/80 rounded-lg px-3 py-1.5 text-sm text-text outline-none focus:border-mauve transition-colors"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-subtext1 mb-1 block">Year</label>
                            <input
                              type="text"
                              value={item.year}
                              onChange={(e) => updateQueueItem(item.id, { year: e.target.value })}
                              className="w-full bg-surface0 border border-surface1/80 rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-mauve transition-colors"
                              placeholder="Year"
                            />
                          </div>
                        </div>

                        {/* Location Prefills */}
                        <div>
                          <label className="text-xs font-semibold text-subtext1 mb-1 block flex items-center gap-1">
                            <MapPin size={12} className="text-mauve" /> Location Details
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={item.city}
                              onChange={(e) => updateQueueItem(item.id, { city: e.target.value })}
                              className="bg-surface0 border border-surface1/80 rounded-lg px-2.5 py-1.5 text-xs text-text placeholder:text-overlay0 outline-none focus:border-mauve"
                              placeholder="City"
                            />
                            <input
                              type="text"
                              value={item.province}
                              onChange={(e) => updateQueueItem(item.id, { province: e.target.value })}
                              className="bg-surface0 border border-surface1/80 rounded-lg px-2.5 py-1.5 text-xs text-text placeholder:text-overlay0 outline-none focus:border-mauve"
                              placeholder="Province"
                            />
                            <input
                              type="text"
                              value={item.country}
                              onChange={(e) => updateQueueItem(item.id, { country: e.target.value })}
                              className="bg-surface0 border border-surface1/80 rounded-lg px-2.5 py-1.5 text-xs text-text placeholder:text-overlay0 outline-none focus:border-mauve"
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
                            className="w-full bg-surface0 border border-surface1/80 rounded-lg px-3 py-2 text-sm text-text placeholder:text-overlay0 outline-none focus:border-mauve transition-colors"
                            placeholder="Nature, Travel, Landscape..."
                          />
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-surface0/50">
                          {/* Publish directly status toggle */}
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={item.published}
                              onChange={(e) => updateQueueItem(item.id, { published: e.target.checked })}
                              className="w-4 h-4 accent-mauve rounded border-surface1"
                            />
                            <span className="text-xs font-semibold text-subtext1">Publish Immediately</span>
                          </label>

                          {/* Individual action buttons */}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => removeQueueItem(item.id)}
                              disabled={item.uploading}
                              className="p-2 bg-surface0 hover:bg-red/10 text-subtext1 hover:text-red border border-surface1 hover:border-red/20 rounded-lg transition-colors cursor-pointer"
                              title="Discard upload"
                            >
                              <Trash2 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => savePhotoItem(item.id)}
                              disabled={item.uploading}
                              className="flex items-center gap-1.5 bg-mauve text-base px-3 py-1.5 rounded-lg font-semibold hover:bg-opacity-95 disabled:opacity-50 cursor-pointer text-xs"
                            >
                              {item.uploading ? (
                                <>
                                  <Loader2 size={14} className="animate-spin" />
                                  <span>{item.uploadProgress}%</span>
                                </>
                              ) : (
                                <>
                                  <Save size={14} />
                                  <span>Save</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {item.error && (
                          <div className="text-red text-xs mt-1 bg-red/15 border border-red/20 p-2 rounded-lg flex items-center gap-1">
                            <AlertCircle size={14} />
                            <span className="font-medium">Error: {item.error}</span>
                          </div>
                        )}

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
                <h4 className="font-bold text-text mb-1 italic">Tip for your 283 photos:</h4>
                <p className="text-sm text-subtext0 leading-relaxed font-sans font-normal">
                  Drop them here in small batches (e.g. 10–20 files at a time). Our tool will instantly parse all dates and geotags in the background, geocoding coordinates sequentially. You can edit details in the forms and hit <strong className="text-mauve font-semibold">Save</strong> when ready!
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
            <h3 className="text-xl font-bold">Existing Photos</h3>
            <button
              onClick={fetchExistingPhotos}
              className="text-xs bg-surface0 border border-surface1 hover:bg-surface1 px-3 py-1.5 rounded-lg transition-colors font-mono cursor-pointer"
            >
              Refresh
            </button>
          </div>

          {photosLoading ? (
            <div className="flex items-center justify-center py-20 text-subtext0">
              <Loader2 className="animate-spin text-mauve mr-2" size={24} />
              <span>Loading photos from database...</span>
            </div>
          ) : existingPhotos.length === 0 ? (
            <div className="text-center py-20 bg-crust/30 border border-surface0/60 rounded-2xl">
              <p className="text-subtext0">No photos found in database. Go back to upload!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {existingPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="bg-crust border border-surface0/60 rounded-xl overflow-hidden flex flex-col group relative"
                >
                  {/* Status label (Draft / Published) */}
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
                      
                      {/* Location and Date indicators */}
                      <div className="flex flex-wrap gap-2 text-[10px] font-mono text-subtext1 mb-4">
                        {photo.date && (
                          <span className="flex items-center gap-1 bg-surface0 border border-surface1/60 px-2 py-0.5 rounded-full">
                            <Calendar size={10} className="text-mauve" /> {photo.date}
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
                        <label className="text-xs font-semibold text-subtext1 mb-1 block">Date</label>
                        <input
                          type="date"
                          value={editingPhoto.date}
                          onChange={(e) => {
                            const dateVal = e.target.value;
                            const yearVal = dateVal ? new Date(dateVal).getFullYear().toString() : editingPhoto.year;
                            setEditingPhoto({ ...editingPhoto, date: dateVal, year: yearVal });
                          }}
                          className="w-full bg-surface0 border border-surface1 rounded-lg px-3 py-1.5 text-sm text-text outline-none focus:border-mauve"
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
