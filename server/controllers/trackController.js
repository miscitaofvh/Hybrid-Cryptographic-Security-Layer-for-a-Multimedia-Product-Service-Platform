import prisma from "../config/db.js";

export async function getTracks(req, res) {
  try {
    const tracks = await prisma.$queryRaw`
      SELECT t.id, t.title, t.duration, t.album, t.genre, json_agg(a.name) AS artists
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
