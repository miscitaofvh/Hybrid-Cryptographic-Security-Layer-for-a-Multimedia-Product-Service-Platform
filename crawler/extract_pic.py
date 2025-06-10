import os
from mutagen.mp3 import MP3
from mutagen.id3 import APIC, ID3, ID3NoHeaderError

MUSIC_DIR = "./media"
COVERS_DIR = "./static/covers"

def extract_cover_image(file_path, track_id):
    try:
        audio = MP3(file_path, ID3=ID3)

        if audio.tags is None:
            print(f"⚠️ No ID3 tags found in {file_path}")
            return None

        for tag in audio.tags.values():
            if isinstance(tag, APIC):
                os.makedirs(COVERS_DIR, exist_ok=True)
                image_path = os.path.join(COVERS_DIR, f"{track_id}.jpg")
                with open(image_path, "wb") as img_file:
                    img_file.write(tag.data)
                print(f"✅ Saved cover for {os.path.basename(file_path)} to {image_path}")
                return f"/static/covers/{track_id}.jpg"

        print(f"⚠️ No APIC tag in {file_path}")
    except ID3NoHeaderError:
        print(f"❌ No ID3 header found in {file_path}")
    except Exception as e:
        print(f"❌ Error reading cover from {file_path}: {e}")
    return None

# Ensure cover directory exists
os.makedirs(COVERS_DIR, exist_ok=True)

print("🔎 Starting cover extraction from ./media...")

# Process all MP3 files in the media directory
for file in os.listdir(MUSIC_DIR):
    if file.lower().endswith(".mp3"):
        file_path = os.path.join(MUSIC_DIR, file)
        # Use filename without extension as track_id
        track_id = os.path.splitext(file)[0]
        extract_cover_image(file_path, track_id)

print("✅ Cover extraction complete.")