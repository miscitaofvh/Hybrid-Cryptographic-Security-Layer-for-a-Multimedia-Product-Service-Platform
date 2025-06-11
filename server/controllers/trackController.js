// controllers/trackController.js
import prisma from "../config/db.js";
import fs from "fs";
import path from "path";

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
  try {
    const track = await prisma.track.findUnique({ where: { id } });
    if (!track) return res.status(404).json({ error: "Track not found" });

    const filePath = track.audioUrl;

    console.log("Streaming track from path:", filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Audio file not found" });
    }

    const ext = path.extname(filePath).toLowerCase();
    let mimeType = "application/octet-stream";
    if (ext === ".mp3") mimeType = "audio/mpeg";
    if (ext === ".mp4") mimeType = "video/mp4";
    if (ext === ".wav") mimeType = "audio/wav";
    if (ext === ".ogg") mimeType = "audio/ogg";

    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      "Content-Type": mimeType,
      "Content-Length": stat.size,
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  } catch (err) {
    console.error("Failed to stream track", err);
    res.status(500).json({ error: "Failed to stream track" });
  }
}
