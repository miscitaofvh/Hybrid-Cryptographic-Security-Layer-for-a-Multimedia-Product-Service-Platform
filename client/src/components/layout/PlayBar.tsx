export default function PlayerBar() {
  return (
    <footer className="h-16 bg-gray-800 flex items-center justify-between px-4">
      <div className="text-sm text-gray-300">🎵 Now Playing: Style - Taylor Swift</div>
      <div className="flex space-x-4">
        <button>⏮</button>
        <button>▶️</button>
        <button>⏭</button>
      </div>
    </footer>
  );
}
