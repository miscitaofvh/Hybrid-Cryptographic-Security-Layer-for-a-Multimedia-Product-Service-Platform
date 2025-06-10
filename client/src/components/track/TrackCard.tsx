import type { Track } from "@/types/track";

export default function TrackCard({ track }: { track: Track }) {
  const {
    title,
    album,
    genre,
    coverUrl,
    duration,
    artists
  } = track;
  
  return (
    <div className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition duration-200 shadow-md">
      <img
        src={coverUrl}
        alt={title}
        className="w-full h-48 object-cover rounded mb-4"
      />

      <h3 className="text-white font-semibold text-lg truncate mb-1">
        {title}
      </h3>

      <p className="text-sm text-gray-400 truncate">
        {artists.join(", ")}
      </p>

      {album && (
        <p className="text-xs text-gray-500 italic truncate">{album}</p>
      )}

      <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
        {genre && (
          <span className="px-2 py-0.5 bg-purple-600 text-white rounded-full">
            {genre}
          </span>
        )}
        <span>
          ⏱ {Math.floor(duration / 60)}:
          {(duration % 60).toString().padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}
