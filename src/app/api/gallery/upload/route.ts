import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";

const PASSWORD = process.env.GALLERY_ADMIN_PASSWORD || "admin123";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://naksphcpbukbbjhamshm.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy-key-to-prevent-build-crash";

// Initialize Supabase Admin client with service role key to bypass RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// Helper to verify if session is valid
async function verifySession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("gallery_admin_session");
  const expectedToken = createHash("sha256").update(PASSWORD + "salt-for-gallery-secret").digest("hex");
  return session && session.value === expectedToken;
}

// Helper to extract storage path from public URL
function getStoragePathFromUrl(url: string, bucketName: string = "photography") {
  try {
    const searchString = `/public/${bucketName}/`;
    const index = url.indexOf(searchString);
    if (index !== -1) {
      return url.substring(index + searchString.length);
    }
  } catch (e) {
    console.error("Error parsing storage path from URL:", url, e);
  }
  return null;
}

// GET - List all photos for admin dashboard
export async function GET(request: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ 
      error: "SUPABASE_SERVICE_ROLE_KEY is not configured on the server. Please check your .env file." 
    }, { status: 500 });
  }

  try {
    const { data: photos, error } = await supabaseAdmin
      .from("photos")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching photos for admin:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map legacy column names to avoid frontend breaks
    const mappedPhotos = (photos || []).map((p) => {
      const dbPhoto = p as Record<string, unknown>;
      return {
        ...dbPhoto,
        original: (dbPhoto.original as string) || (dbPhoto.original_url as string) || "",
        edited: (dbPhoto.edited as string) || (dbPhoto.edited_url as string) || "",
      };
    });

    return NextResponse.json({ photos: mappedPhotos });
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST - Handle actions
export async function POST(request: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ 
      error: "SUPABASE_SERVICE_ROLE_KEY is not configured on the server. Please check your .env file." 
    }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    // ACTION: get-upload-url
    if (action === "get-upload-url") {
      const { filename, folder } = body;
      if (!filename || !folder) {
        return NextResponse.json({ error: "Filename and folder are required" }, { status: 400 });
      }

      const cleanFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, "_"); // Sanitize filename
      const uniqueFilename = `${Date.now()}_${cleanFilename}`;
      const storagePath = `${folder}/${uniqueFilename}`;

      console.log(`Generating signed URL for path: photography/${storagePath}`);

      const { data, error } = await supabaseAdmin.storage
        .from("photography")
        .createSignedUploadUrl(storagePath);

      if (error) {
        console.error("Error creating signed upload URL:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Generate the public URL that will be accessible after successful upload
      const publicUrl = supabaseAdmin.storage
        .from("photography")
        .getPublicUrl(storagePath).data.publicUrl;

      return NextResponse.json({ 
        signedUrl: data.signedUrl, 
        token: data.token, 
        path: storagePath,
        publicUrl
      });
    }

    // ACTION: save-photo
    if (action === "save-photo") {
      const { photo } = body;
      if (!photo) {
        return NextResponse.json({ error: "Photo data is required" }, { status: 400 });
      }

      // Format row for database insertion
      const row: Record<string, unknown> = {
        title: photo.title || "Untitled",
        description: photo.description || "",
        backstory: photo.backstory || "",
        date: photo.date || new Date().toISOString(),
        year: photo.year || new Date().getFullYear().toString(),
        tags: Array.isArray(photo.tags) ? photo.tags : [],
        city: photo.city || "",
        province: photo.province || "",
        country: photo.country || "",
        published: photo.published !== undefined ? photo.published : false,
        hash: photo.hash || null,
        original: photo.original || "",
        edited: photo.edited || "",
      };

      console.log("Saving photo:", row);

      let result;
      if (photo.id) {
        // Update existing row
        result = await supabaseAdmin
          .from("photos")
          .update(row)
          .eq("id", photo.id)
          .select();

        // If schema cache mismatch, fall back to legacy original_url / edited_url columns
        if (result.error && (result.error.message.includes("column") || result.error.message.includes("schema cache"))) {
          console.warn("Save photo warning, retrying with fallback columns:", result.error.message);
          const { original, edited, ...rest } = row;
          const fallbackRow = {
            ...rest,
            original_url: original as string,
            edited_url: edited as string,
          };
          result = await supabaseAdmin
            .from("photos")
            .update(fallbackRow)
            .eq("id", photo.id)
            .select();
        }
      } else {
        // Insert new row
        result = await supabaseAdmin
          .from("photos")
          .insert(row)
          .select();

        // If schema cache mismatch, fall back to legacy original_url / edited_url columns
        if (result.error && (result.error.message.includes("column") || result.error.message.includes("schema cache"))) {
          console.warn("Save photo warning, retrying with fallback columns:", result.error.message);
          const { original, edited, ...rest } = row;
          const fallbackRow = {
            ...rest,
            original_url: original as string,
            edited_url: edited as string,
          };
          result = await supabaseAdmin
            .from("photos")
            .insert(fallbackRow)
            .select();
        }
      }

      if (result.error) {
        console.error("Database error while saving photo:", result.error);
        return NextResponse.json({ error: result.error.message }, { status: 500 });
      }

      const savedItem = result.data[0] as Record<string, unknown>;
      const mappedSavedItem = {
        ...savedItem,
        original: (savedItem.original as string) || (savedItem.original_url as string) || "",
        edited: (savedItem.edited as string) || (savedItem.edited_url as string) || "",
      };

      return NextResponse.json({ success: true, photo: mappedSavedItem });
    }

    // ACTION: delete-photo
    if (action === "delete-photo") {
      const { id, original, edited } = body;
      if (!id) {
        return NextResponse.json({ error: "Photo ID is required" }, { status: 400 });
      }

      console.log(`Deleting photo with ID: ${id}`);

      // Delete database row
      const { error: dbError } = await supabaseAdmin
        .from("photos")
        .delete()
        .eq("id", id);

      if (dbError) {
        console.error("Database error while deleting photo:", dbError);
        return NextResponse.json({ error: dbError.message }, { status: 500 });
      }

      // Delete storage files if URLs were provided
      const pathsToDelete: string[] = [];
      if (original) {
        const path = getStoragePathFromUrl(original, "photography");
        if (path) pathsToDelete.push(path);
      }
      if (edited) {
        const path = getStoragePathFromUrl(edited, "photography");
        if (path) pathsToDelete.push(path);
      }

      if (pathsToDelete.length > 0) {
        console.log("Deleting files from storage:", pathsToDelete);
        const { error: storageError } = await supabaseAdmin.storage
          .from("photography")
          .remove(pathsToDelete);

        if (storageError) {
          console.error("Storage error while deleting photo files:", storageError);
          // We don't fail the whole request because the DB row is already deleted
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    console.error("POST action error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
