import type { Track } from "@/types/track";

export default function TrackCard({ track }: { track: Track }) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition">
      <div className="aspect-square bg-gray-600 rounded mb-3" />
      <h3 className="text-white font-semibold truncate">{track.title}</h3>
      <p className="text-gray-400 text-sm truncate">{track.artists.join(", ")}</p>
      <p className="text-gray-500 text-xs">{track.album}</p>
    </div>
  );
}
