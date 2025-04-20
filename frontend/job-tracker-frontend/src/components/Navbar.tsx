import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <nav className="flex justify-between items-center p-4 bg-gray-900 text-white">
      <div className="space-x-4">
        <Link to="/dashboard" className="hover:underline font-medium">Dashboard</Link>
        {user.is_admin && (
          <Link to="/admin" className="hover:underline font-medium">Admin</Link>
        )}
      </div>
      <div className="space-x-4 flex items-center">
        <span className="text-sm opacity-80">{user.email}</span>
        <button
          onClick={handleLogout}
          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm cursor-pointer transition-colors duration-150"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
