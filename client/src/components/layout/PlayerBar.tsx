import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { Track } from "@/types/track";
import { useTrackService } from "@/services/TrackService";

type PlayerBarProps = {
  track: Track | null;
};

export default function PlayerBar({ track }: PlayerBarProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { fetchAndDecryptTrackStream } = useTrackService(); // lấy hàm giải mã stream

  useEffect(() => {
    if (track && audioRef.current) {
      // Gọi hàm giải mã toàn bộ stream
      fetchAndDecryptTrackStream(track.id)
        .then((decryptedBuffer) => {
          // Tạo blob từ nhạc đã giải mã (giả sử là MP3)
          const audioBlob = new Blob([decryptedBuffer], { type: "audio/mpeg" });
          const url = URL.createObjectURL(audioBlob);
          audioRef.current!.src = url;
          audioRef.current!.play();
        })
        .catch((err) => {
          console.error("Stream error:", err);
        });
    }
    // Cleanup: xóa object URL khi track đổi
    return () => {
      if (audioRef.current) {
        audioRef.current.src = "";
      }
    };
  }, [track?.id]);

  if (!track) return null;

  return (
    <motion.div
      className="bg-gray-900/95 w-full p-3 flex items-center gap-4 shadow-2xl border-t border-gray-700"
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{ position: "fixed", left: 0, bottom: 0, zIndex: 50 }}
    >
      <motion.img
        src={track.coverUrl}
        alt={track.title}
        className="w-14 h-14 rounded shadow-lg object-cover"
        animate={{ rotate: [0, 360] }}
        transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
      />

      <div className="flex-1 min-w-0">
        <div className="text-white font-semibold truncate text-base">{track.title}</div>
        <div className="text-xs text-gray-400 truncate">{track.artists?.join(", ")}</div>
        {track.album && <div className="text-xs text-gray-500 italic truncate">{track.album}</div>}
      </div>

      <audio ref={audioRef} controls className="w-60" />

      {track.duration && (
        <span className="text-xs text-gray-400 ml-4 min-w-fit">
          ⏱ {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, "0")}
        </span>
      )}
    </motion.div>
  );
}
