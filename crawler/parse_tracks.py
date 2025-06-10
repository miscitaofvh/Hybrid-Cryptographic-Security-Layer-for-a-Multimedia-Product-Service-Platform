import os
import json
import psycopg2
from mutagen.mp3 import MP3
from mutagen.easyid3 import EasyID3
from mutagen.id3 import ID3, APIC
from datetime import datetime
import uuid

DB_CONFIG = {
    "dbname": os.getenv("DB_NAME", "your_db"),
    "user": os.getenv("DB_USER", "your_user"),
    "password": os.getenv("DB_PASS", "your_pass"),
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
}

MUSIC_DIR = "./media" 

try:
    conn = psycopg2.connect(**DB_CONFIG)
except Exception as e:
    print("❌ Cannot connect to database:", e)
    exit(1)

cursor = conn.cursor()


def generate_uuid():
    return str(uuid.uuid4())

def extract_metadata(file_path):
    audio = MP3(file_path, ID3=EasyID3)
    metadata = dict(audio)
    duration = int(audio.info.length)
    return metadata, duration


def find_or_create_artist(name):
    cursor.execute("SELECT id FROM \"Artist\" WHERE name = %s", (name,))
    row = cursor.fetchone()
    if row:
        return row[0]

    artist_id = generate_uuid()
    cursor.execute("""
        INSERT INTO "Artist" (id, name, "createdAt") VALUES (%s, %s, %s)
    """, (artist_id, name, datetime.utcnow()))
    print(f"🎤 Created artist: {name}")
    return artist_id

def extract_cover_image(file_path):
    audio = ID3(file_path)
    for tag in audio.values():
        if isinstance(tag, APIC):
            return tag.data 
    return None

def insert_track(filename, metadata, duration, artist_names):
    track_id = generate_uuid()
    title = metadata.get("title", [filename.replace(".mp3", "")])[0]
    audio_url = f"/tracks/{filename}"
    album = metadata.get("album", [None])[0]
    genre = metadata.get("genre", [None])[0]
    composer = metadata.get("composer", [None])[0]
    conver_url = "http://localhost:3000/static/covers/" + filename.replace(".mp3", ".jpg")

    # Thêm track
    cursor.execute("""
        INSERT INTO "Track" (
            id, title, "audioUrl", duration, album, genre, composer, 
            "coverUrl", metadata, "encryptedKey", "createdAt"
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NULL, %s)
    """, (
        track_id, title, audio_url, duration, album, genre, composer, 
        conver_url, json.dumps(metadata), datetime.utcnow()
    ))

    # Thêm quan hệ TrackArtist
    for name in artist_names:
        artist_id = find_or_create_artist(name)
        track_artist_id = generate_uuid()
        cursor.execute("""
            INSERT INTO "TrackArtist" (id, "trackId", "artistId")
            VALUES (%s, %s, %s)
        """, (track_artist_id, track_id, artist_id))

    conn.commit()
    print(f"✅ Inserted track: {title}")


for file in os.listdir(MUSIC_DIR):
    if file.endswith(".mp3"):
        path = os.path.join(MUSIC_DIR, file)
        try:
            metadata, duration = extract_metadata(path)

            raw_artists = metadata.get("artist", ["Unknown"])[0]
            artist_list = [name.strip() for name in raw_artists.split(",")]

            insert_track(file, metadata, duration, artist_list)
        except Exception as e:
            print(f"❌ Error processing {file}: {e}")

cursor.close()
conn.close()
