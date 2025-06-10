from bs4 import BeautifulSoup
import requests
import re
import os

media_dir = "media"
os.makedirs(media_dir, exist_ok=True)  # Tạo thư mục nếu chưa có


url = "https://www.nhaccuatui.com/playlist/top-100-nhac-tre-hay-nhat-various-artists.m3liaiy6vVsF.html"

def extract_song_id(url):
    match = re.search(r'\.([a-zA-Z0-9]+)\.html', url)
    return match.group(1) if match else None

def get_stream_url(song_id, headers):
    api_url = f"https://www.nhaccuatui.com/download/song/{song_id}_128"
    res = requests.get(api_url, headers=headers)
    if res.status_code == 200:
        data = res.json()
        return data.get("data", {}).get("stream_url")
    return None

def download_song(stream_url, filename, headers):
    res = requests.get(stream_url, headers=headers, stream=True)

    content_length = res.headers.get("Content-Length")
    if content_length and int(content_length) < 200 * 1024:
        print(f"⚠️ Bỏ qua {filename} vì file quá nhỏ ({int(content_length)} bytes)")
        return
    
    filepath = os.path.join(media_dir, filename)
    if "audio" in res.headers.get("Content-Type", ""):
        with open(filepath, "wb") as f:
            for chunk in res.iter_content(8192):
                f.write(chunk)
        print(f"✅ Downloaded: {filename}")
    else:
        print(f"❌ Failed to download {filename}. Content-Type:", res.headers.get("Content-Type"))
        print("Preview:", res.text[:200])

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    "Referer": "https://www.nhaccuatui.com/playlist/top-100-nhac-tre-hay-nhat-various-artists.m3liaiy6vVsF.html",
    "Cookie": "NCT_BALLOON_INDEX=true; JSESSIONID=pyqg7nv8m0g1k44eqm7mik04; nct_uuid=8C1A508C499144EEA6917C97B2219130; nctads_ck=5c01kfbdsis01lsfdmbbp9xlm_1749469479333; NCTNPLS=5763e30b82f0bd5ef16b9ca6b277667c"
}

response = requests.get(url, headers=headers)

soup = BeautifulSoup(response.text, 'html.parser')

links = soup.select('a[href*="/bai-hat/"]')

base = "https://www.nhaccuatui.com"
song_links = set()
for a in links:
    href = a.get('href')
    song_link = ""
    if href.startswith("https://www.nhaccuatui.com/bai-hat/"):
        song_link = extract_song_id(href)
    elif href.startswith("/bai-hat/"):
        song_link = extract_song_id(base + href)
    if song_link:
        song_links.add(song_link)
    
print(f"🔎 Found {len(song_links)} songs. Downloading...")

for song_id in song_links:
    stream = get_stream_url(song_id, headers)
    if stream:
        filename = f"{song_id}.mp3"
        download_song(stream, filename, headers)
    else:
        print(f"⚠️  Stream not found for {song_id}")