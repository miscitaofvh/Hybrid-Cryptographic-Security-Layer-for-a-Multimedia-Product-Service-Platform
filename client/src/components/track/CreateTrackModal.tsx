import { useState } from "react";

type Props = {
  onClose: () => void;
  onCreated: (track: any) => void;
  artistId?: string;
};

export default function CreateTrackModal({ onClose, onCreated, artistId }: Props) {
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [album, setAlbum] = useState("");
  const [duration, setDuration] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Xử lý submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Giả sử bạn đã có API tạo track (POST /tracks)
      const res = await fetch("/api/tracks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title, genre, album, duration, artistId
        })
      });

      if (!res.ok) throw new Error("Lỗi tạo bài hát!");

      const track = await res.json();
      onCreated(track); // callback cho HomePage
    } catch (err: any) {
      setError(err.message || "Đã có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-lg w-full max-w-md text-black relative">
        <button
          type="button"
          className="absolute top-3 right-4 text-gray-400 hover:text-red-500 text-2xl"
          onClick={onClose}
        >
          &times;
        </button>
        <h3 className="text-xl font-bold mb-4">Tạo bài hát mới</h3>
        <div className="mb-3">
          <label className="block font-semibold mb-1">Tên bài hát</label>
          <input className="w-full border p-2 rounded" value={title} onChange={e => setTitle(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className="block font-semibold mb-1">Thể loại</label>
          <input className="w-full border p-2 rounded" value={genre} onChange={e => setGenre(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="block font-semibold mb-1">Album</label>
          <input className="w-full border p-2 rounded" value={album} onChange={e => setAlbum(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="block font-semibold mb-1">Thời lượng</label>
          <input className="w-full border p-2 rounded" value={duration} onChange={e => setDuration(e.target.value)} />
        </div>
        {/* Có thể thêm upload audio, ảnh bìa ở đây */}
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <button
          type="submit"
          className="bg-green-600 text-white rounded-xl px-4 py-2 font-bold mt-2"
          disabled={loading}
        >
          {loading ? "Đang tạo..." : "Tạo bài hát"}
        </button>
      </form>
    </div>
  );
}
