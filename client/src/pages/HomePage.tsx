import Sidebar from "@/components/layout/SideBar";
import Header from "@/components/layout/Header";
import PlayerBar from "@/components/layout/PlayerBar";
import TrackCard from "@/components/track/TrackCard";
import CreateTrackModal from "@/components/track/CreateTrackModal"; // nhớ import modal này
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
  const { accessToken, user } = useAuth();
  const { sharedSecret, setKeyData } = useKey();
  const [showCreateTrack, setShowCreateTrack] = useState(false);

  useEffect(() => {
    if (!sharedSecret && accessToken) {
      keyExchange(accessToken).then(({ publicKey, privateKey, sharedSecret }) => {
        setKeyData({ publicKey, privateKey, sharedSecret });
        console.log("Key exchange complete:", { publicKey, privateKey, sharedSecret });
      });
    }
  }, [accessToken, sharedSecret, setKeyData]);

  useEffect(() => {
    if (sharedSecret) {
      getTracks().then(setTracks);
    }
  }, [sharedSecret]);

  const canCreateTrack = user && (user.role === "admin" || user.role === "artist");

  return (
    <div className="flex h-screen bg-black text-white">
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">🔥 Recommended Tracks</h2>
            {canCreateTrack && (
              <button
                onClick={() => setShowCreateTrack(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-2xl font-semibold shadow"
              >
                + Tạo bài hát mới
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tracks.map((track) => (
              <TrackCard key={track.id} track={track} onClick={() => setCurrentTrack(track)} />
            ))}
          </div>
        </main>

        <PlayerBar track={currentTrack} />
      </div>

      {/* Modal tạo bài hát */}
      {showCreateTrack && (
        <CreateTrackModal
          onClose={() => setShowCreateTrack(false)}
          onCreated={(track: Track) => {
            setTracks([track, ...tracks]);
            setShowCreateTrack(false);
          }}
          artistId={user?.artistId} // Nếu cần truyền artistId
        />
      )}
    </div>
  );
}
