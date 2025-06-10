import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import PlayerBar from "@/components/layout/PlayerBar";
import TrackCard from "@/components/track/TrackCard";
import { useTrackService } from "@/services/TrackService";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { Track } from "@/types/track";

export default function HomePage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const { accessToken } = useAuth();
  const { getTracks } = useTrackService();

  useEffect(() => {
    if (accessToken) {
      getTracks().then(setTracks);
    }
  }, [accessToken]);

  return (
    <div className="flex h-screen bg-black text-white">
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />

        <main className="p-6 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-4">🔥 Recommended Tracks</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tracks.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        </main>

        <PlayerBar />
      </div>
    </div>
  );
}
