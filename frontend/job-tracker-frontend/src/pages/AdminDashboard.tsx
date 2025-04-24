import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Trash2, ShieldCheck, ShieldOff } from "lucide-react";
import clsx from "clsx";

type User = {
  id: string;
  email: string;
  is_admin: boolean;
};

const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
      setError("Could not load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    setConfirmingId(null);
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error("Failed to delete user", err);
      alert("Error deleting user.");
    }
  };

  const toggleAdmin = async (user: User) => {
    const endpoint = user.is_admin ? "demote" : "promote";
    const secret = prompt("Enter secret admin code:");
    if (!secret) return;

    try {
      await api.post(`/admin-tools/${endpoint}/${user.id}`, {
        secret,
      });
      fetchUsers();
    } catch (err) {
      console.error(`Failed to ${endpoint} user`, err);
      alert("Invalid secret or action failed.");
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <table className="w-full text-sm table-auto border-collapse">
        <thead>
          <tr className="text-left border-b border-gray-300">
            <th className="py-2">User</th>
            <th className="py-2">Admin</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-2">{u.email || "—"}</td>
              <td className="py-2">{u.is_admin ? "Yes" : "No"}</td>
              <td className="py-2 flex items-center gap-2">
                <button
                  onClick={() => setConfirmingId(u.id)}
                  className="text-red-600 hover:text-red-800"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => toggleAdmin(u)}
                  className={clsx(
                    "hover:text-blue-800",
                    u.is_admin ? "text-yellow-600" : "text-blue-600"
                  )}
                  title={u.is_admin ? "Demote to User" : "Promote to Admin"}
                >
                  {u.is_admin ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}
                </button>

                {/* Confirmation modal */}
                {confirmingId === u.id && (
                  <div className="absolute bg-white shadow-lg border border-gray-300 rounded-md p-4 z-50 mt-8">
                    <p className="text-sm text-gray-800 mb-3">
                      Are you sure you want to delete this user?
                    </p>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setConfirmingId(null)}
                        className="text-sm text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
