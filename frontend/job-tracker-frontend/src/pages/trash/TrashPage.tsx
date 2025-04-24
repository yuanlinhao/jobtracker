import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { Application } from "../../types";
import KanbanCard from "../../features/applications/KanbanCard";
import { RotateCcw, Trash2 } from "lucide-react";

const TrashPage = () => {
  const [deletedApps, setDeletedApps] = useState<Application[]>([]);

  const fetchDeletedApps = async () => {
    try {
      const res = await api.get("/applications/deleted");
      setDeletedApps(res.data.applications);
    } catch (err) {
      console.error("Failed to fetch deleted applications", err);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await api.patch(`/applications/${id}/restore`);
      fetchDeletedApps(); // refresh
    } catch (err) {
      alert("Failed to restore application.");
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm("Are you sure? This will permanently delete this application.")) return;
    try {
      await api.delete(`/applications/${id}/permanent`);
      fetchDeletedApps(); // refresh
    } catch (err) {
      alert("Failed to permanently delete application.");
    }
  };

  useEffect(() => {
    fetchDeletedApps();
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4 flex items-center gap-2">
        <Trash2 className="w-6 h-6 text-red-500" />
        Trash Bin
      </h1>
  
      {deletedApps.length === 0 ? (
        <p className="text-gray-500">No deleted applications.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {deletedApps.map((app) => (
            <div key={app.id} className="relative group">
              <KanbanCard app={{ ...app, is_deleted: true, tag_ids: Object.values(app.tags).flat().map(tag => tag.id) }} activeId={null} />
  
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => handleRestore(app.id)}
                  title="Restore"
                  className="bg-white rounded-full p-1 shadow hover:bg-green-50"
                >
                  <RotateCcw className="w-4 h-4 text-green-600" />
                </button>
                <button
                  onClick={() => handlePermanentDelete(app.id)}
                  title="Delete Permanently"
                  className="bg-white rounded-full p-1 shadow hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrashPage;
