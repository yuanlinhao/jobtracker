import { useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useAuthStore } from "./store/authStore";

import AuthForm from "./features/auth/AuthForm";
import Dashboard from "./features/applications/Dashboard";
import AdminPage from "./pages/AdminDashboard";
import AppDetailsModal from "./features/applications/AppDetailsModal";
import Navbar from "./components/Navbar";
import ApplicationFormModal from "./features/applications/ApplicationFormModal";
import TrashPage from "./pages/trash/TrashPage";

function App() {
  const { user, fetchUser, loading } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const backgroundLocation = location.state?.backgroundLocation ?? location;

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Loading...</div>;
  }

  return (
    <>
      <Navbar />

      <Routes location={backgroundLocation}>
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" /> : <AuthForm />}
        />
        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin"
          element={user?.is_admin ? <AdminPage /> : <Navigate to="/dashboard" />}
        />
        <Route path="*" element={<Navigate to="/dashboard" />} />

        <Route
          path="/trash"
          element={user ? <TrashPage /> : <Navigate to="/login" />}
        />

      </Routes>

      {/* 🧩 Modal Routes */}
      {location.state?.backgroundLocation && (
        <Routes>
          <Route path="/dashboard/app/:id" element={<AppDetailsModal />} />
        </Routes>


      )}
    </>
  );
}

export default App;
