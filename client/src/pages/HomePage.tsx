import Sidebar from "@/components/layout/SideBar";
import Header from "@/components/layout/Header";
import PlayerBar from "@/components/layout/PlayerBar";
import TrackCard from "@/components/track/TrackCard";
import { useAuth } from "@/context/AuthContext"; 
import { useKey } from "@/context/KeyContext"; 
import { keyExchange } from "@/services/keyExchangeService";
import { useTrackService } from "@/services/TrackService";
import type { Track } from "@/types/track";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const { getTracks } = useTrackService();
  const { accessToken } = useAuth();
  const { sharedSecret, setKeyData } = useKey();

useEffect(() => {
  if (!sharedSecret && accessToken) {
    keyExchange(accessToken).then(({ publicKey, privateKey, sharedSecret }) => {
      setKeyData({ publicKey, privateKey, sharedSecret });
      console.log("Key exchange complete:", { publicKey, privateKey, sharedSecret });
    });
  }}, [accessToken, sharedSecret, setKeyData]);

  useEffect(() => {
    if (sharedSecret) {
      getTracks().then(setTracks);
    }
  }, [sharedSecret]);

  return (
    <div className="flex h-screen bg-black text-white">
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="p-6 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-4">🔥 Recommended Tracks</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tracks.map((track) => (
              <TrackCard key={track.id} track={track} onClick={() => setCurrentTrack(track)} />
            ))}
          </div>
        </main>

        <PlayerBar track={currentTrack} />
      </div>
    </div>
  );
}
