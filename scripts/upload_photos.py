import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv(dotenv_path="../.env.local")

url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    print("Error: Missing SUPABASE_URL or Key inside ../.env.local")
    exit(1)

supabase: Client = create_client(url, key)

# Define directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "photo_metadata.json")
ORIGINAL_DIR = os.path.join(BASE_DIR, "images", "original")
EDITED_DIR = os.path.join(BASE_DIR, "images", "edited")

bucket_name = "photography"

def upload_file(filepath, folder):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return None

    filename = os.path.basename(filepath)
    storage_path = f"{folder}/{filename}"
    
    with open(filepath, "rb") as f:
        # Check if file exists, if so, you can choose to overwrite or skip.
        try:
            res = supabase.storage.from_(bucket_name).upload(
                file=f,
                path=storage_path,
                file_options={"cache-control": "3600", "upsert": "true"}
            )
            print(f"Uploaded {filename} to {storage_path}")
            # Get public URL
            public_url = supabase.storage.from_(bucket_name).get_public_url(storage_path)
            # The python SDK get_public_url returns a string directly
            return public_url
        except Exception as e:
            print(f"Error uploading {filename}: {e}")
            return None

def main():
    if not os.path.exists(DATA_FILE):
        print(f"Creating a sample metadata JSON template at {DATA_FILE}...")
        sample_data = [
            {
                "file_name": "example1.jpg",
                "title": "Example Photo",
                "description": "Short description here",
                "backstory": "Long backstory here",
                "date": "2026-03-15",
                "year": "2026",
                "tags": ["Nature", "Photography"]
            }
        ]
        with open(DATA_FILE, "w") as f:
            json.dump(sample_data, f, indent=4)
        print("Please populate it and place your images in scripts/images/original/ and scripts/images/edited/")
        os.makedirs(ORIGINAL_DIR, exist_ok=True)
        os.makedirs(EDITED_DIR, exist_ok=True)
        return

    with open(DATA_FILE, "r") as f:
        metadata_list = json.load(f)

    for meta in metadata_list:
        file_name = meta.get("file_name")
        
        # Paths
        orig_path = os.path.join(ORIGINAL_DIR, file_name)
        edit_path = os.path.join(EDITED_DIR, file_name)

        print(f"-- Processing {file_name} --")
        
        orig_url = upload_file(orig_path, "original")
        edit_url = upload_file(edit_path, "edited")

        # Database Insertion
        row = {
            "title": meta.get("title", ""),
            "description": meta.get("description", ""),
            "backstory": meta.get("backstory", ""),
            "date": meta.get("date", None),
            "year": meta.get("year", ""),
            "tags": meta.get("tags", []),
            "original_url": orig_url,
            "edited_url": edit_url
        }

        try:
            data, count = supabase.table("photos").insert(row).execute()
            print(f"Successfully inserted metadata for {file_name} into DB.")
        except Exception as e:
            print(f"Failed to insert row for {file_name}: {e}")

if __name__ == "__main__":
    main()
