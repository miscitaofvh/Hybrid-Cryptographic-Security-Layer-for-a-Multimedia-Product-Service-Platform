export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 p-4 flex flex-col text-sm space-y-4">
      <h2 className="text-xl font-bold mb-2">🎵 Library</h2>
      <nav className="space-y-2">
        <button className="hover:text-green-400">My Playlist</button>
        <button className="hover:text-green-400">Top Tracks</button>
        <button className="hover:text-green-400">Liked Songs</button>
      </nav>
    </aside>
  );
}
