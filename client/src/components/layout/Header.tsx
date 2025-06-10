import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="flex justify-between items-center p-4 bg-gray-800 shadow">
      <input
        type="text"
        placeholder="Search..."
        className="px-4 py-2 rounded bg-gray-700 text-white focus:outline-none w-1/2"
      />
      <button
        onClick={async () => {
          await logout();
          navigate("/login");
        }}
        className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
      >
        Logout
      </button>
    </header>
  );
}
