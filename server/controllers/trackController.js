import prisma from "../config/db.js";
import fs from "fs";
import path from "path";
import crypto from "crypto";

function deriveSegmentKey(sharedSecret, segmentIndex) {
  const secretBytes = Buffer.from(sharedSecret, "base64");
  const idxBuf = Buffer.alloc(4);
  idxBuf.writeUInt32BE(segmentIndex, 0);

  return crypto.createHash("sha256")
    .update(secretBytes)
    .update(idxBuf)
    .digest()
    .subarray(0, 16);
}

// GET /tracks/get-tracks
export async function getTracks(req, res) {
  try {
    const tracks = await prisma.$queryRaw`
      SELECT t.id, t.title, t."coverUrl", t.duration, t.album, t.genre, json_agg(a.name) AS artists
      FROM "Track" t
      JOIN "TrackArtist" ta ON t.id = ta."trackId"
      JOIN "Artist" a ON ta."artistId" = a.id
      GROUP BY t.id
      ORDER BY RANDOM()
      LIMIT 40;
    `;
    res.json(tracks);
  } catch (error) {
    console.error("Failed to fetch tracks", error);
    res.status(500).json({ error: "Failed to fetch tracks" });
  }
}

// GET /tracks/:id
export async function getTrackById(req, res) {
  const { id } = req.params;
  try {
    const track = await prisma.track.findUnique({
      where: { id },
      include: {
        trackArtists: {
          include: { artist: true }
        }
      }
    });
    if (!track) return res.status(404).json({ error: "Track not found" });

    const artists = track.trackArtists.map((ta) => ta.artist.name);
    const { trackArtists, ...trackData } = track;

    res.json({ ...trackData, artists });
  } catch (error) {
    console.error("Failed to fetch track", error);
    res.status(500).json({ error: "Failed to fetch track" });
  }
}

// GET /tracks/:id/stream
export async function streamTrack(req, res) {
  const { id } = req.params;

  const sharedSecret = req.session?.sharedSecret;
  if (!sharedSecret) {
    return res.status(401).json({ error: "Missing shared secret. Please perform key exchange first." });
  }

  try {
    const track = await prisma.track.findUnique({ where: { id } });
    if (!track) return res.status(404).json({ error: "Track not found" });

    const filePath = track.audioUrl;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Audio file not found" });
    }

    const segmentSize = 1024 * 1024;
    const stat = fs.statSync(filePath);
    const totalSegments = Math.ceil(stat.size / segmentSize);

    res.writeHead(200, {
      "Content-Type": "application/octet-stream",
      "X-Segments": totalSegments,
      "X-File-Size": stat.size,
    });

    const fd = fs.openSync(filePath, "r");
    let offset = 0, segmentIndex = 0;
    const buffer = Buffer.alloc(segmentSize);

    while (offset < stat.size) {
      const readBytes = fs.readSync(fd, buffer, 0, segmentSize, offset);
      const segmentData = buffer.slice(0, readBytes);

      const segmentKey = deriveSegmentKey(sharedSecret, segmentIndex);

      // Tạo IV ngẫu nhiên cho AES-GCM (12 bytes)
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv("aes-128-gcm", segmentKey, iv);
      const encSegment = Buffer.concat([cipher.update(segmentData), cipher.final()]);
      const tag = cipher.getAuthTag();
      console.log("Shared secret:", sharedSecret);
      console.log(`Segment ${segmentIndex} encrypted with key: ${segmentKey.toString("hex")}`);
      
      // Format: [segmentIndex|iv|tag|encSegmentLength|encSegment]
      const meta = Buffer.alloc(4 + 12 + 16 + 4);
      meta.writeUInt32BE(segmentIndex, 0);             // 0-3: segmentIndex
      iv.copy(meta, 4);                                // 4-15: IV
      tag.copy(meta, 16);                              // 16-31: GCM tag
      meta.writeUInt32BE(encSegment.length, 32);       // 32-35: encSegment length

      res.write(meta);
      res.write(encSegment);

      offset += readBytes;
      segmentIndex += 1;
    }

    fs.closeSync(fd);
    res.end();

  } catch (err) {
    console.error("Failed to stream track", err);
    res.status(500).json({ error: "Failed to stream track" });
  }
}
