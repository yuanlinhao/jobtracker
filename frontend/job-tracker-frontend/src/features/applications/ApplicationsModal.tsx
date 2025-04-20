import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getApplicationById } from "../../api/applications"; // make sure this file exists!

type Application = {
  id: string;
  company: string;
  position: string;
  status: string;
  location: string;
  url: string;
  notes: string;
  created_at: string;
};

const ApplicationsModal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await getApplicationById(id);
        setApp(data);
      } catch (err) {
        console.error("Failed to fetch application", err);
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded">Loading...</div>
      </div>
    );
  }

  if (!app) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      onClick={() => navigate(-1)}
    >
      <div
        className="bg-white p-6 rounded shadow-lg max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-2">{app.position}</h2>
        <p className="text-gray-600 mb-4">{app.company}</p>

        <div className="space-y-2 text-sm">
          <p><strong>Status:</strong> {app.status}</p>
          <p><strong>Location:</strong> {app.location}</p>
          <p>
            <strong>URL:</strong>{" "}
            <a href={app.url} className="text-blue-500 underline">
              {app.url}
            </a>
          </p>
          <p><strong>Notes:</strong> {app.notes}</p>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="mt-6 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ApplicationsModal;
