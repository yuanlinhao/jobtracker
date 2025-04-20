import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { useTagStore } from "../../store/useTagStore";

type ApplicationDetail = {
  id: string;
  company: string;
  position: string;
  status: string;
  location?: string;
  url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  tags: Record<string, { id: string; name: string }[]>;
};

const AppDetailsModal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchTags } = useTagStore();
  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchTags();
        const res = await api.get(`/applications/${id}`);
        setApp(res.data);
      } catch (err: any) {
        console.error("Failed to fetch application", err);
        setError("Unable to load application.");
      }
    };
    fetchData();
  }, [id]);

  const closeModal = () => navigate(-1);

  if (error) {
    return (
      <div
        className="fixed inset-0 z-50 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center"
        onClick={closeModal}
      >
        <div
          className="bg-white rounded-md shadow-xl p-6 w-full max-w-md text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-red-600 text-sm font-medium mb-4">{error}</p>
          <button
            onClick={closeModal}
            className="text-sm text-blue-600 underline hover:text-blue-800"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!app) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center"
      onClick={closeModal}
    >
      <div
        className="bg-white rounded-md shadow-xl p-6 w-full max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {app.position} @ {app.company}
          </h2>
          <button onClick={closeModal} className="text-gray-500 hover:text-red-500">✕</button>
        </div>

        <div className="space-y-3 text-sm">
          <p><strong>Status:</strong> {app.status}</p>
          <p><strong>Location:</strong> {app.location || "—"}</p>
          <p><strong>URL:</strong>{" "}
            {app.url ? (
              <a href={app.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                {app.url}
              </a>
            ) : "—"}
          </p>
          <p><strong>Notes:</strong> {app.notes || "—"}</p>

          <div>
            <strong>Tags:</strong>
            <div className="flex flex-wrap gap-2 mt-1">
              {Object.entries(app.tags).map(([field, tagList]) =>
                tagList.map((tag) => (
                  <span
                    key={tag.id}
                    className="text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded-full"
                  >
                    {tag.name} <span className="opacity-60">({field})</span>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppDetailsModal;
