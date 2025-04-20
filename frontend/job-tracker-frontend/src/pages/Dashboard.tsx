import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../api/client";

type Application = {
  id: string;
  company: string;
  position: string;
  status: string;
  created_at: string;
  updated_at: string;
  tag_ids: string[];
};

const STATUSES = ["wishlist", "applied", "interviewed", "offer", "declined"] as const;

const Dashboard = () => {
  const location = useLocation();
  const [apps, setApps] = useState<Application[]>([]);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await api.get("/applications/");
        console.log("Fetched apps:", res.data.applications);
        setApps(res.data.applications);
      } catch (err) {
        console.error("Failed to load applications", err);
      }
    };
    fetchApps();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
      {STATUSES.map((status) => (
        <div key={status} className="bg-gray-100 rounded p-4 shadow">
          <h2 className="text-lg font-semibold mb-4">{status}</h2>
          <div className="space-y-2">
            {apps
              .filter((app) => app.status === status)
              .map((app) => (
                <Link
                  key={app.id}
                  to={`/dashboard/app/${app.id}`}
                  state={{ backgroundLocation: location }}
                  className="block bg-white p-3 rounded shadow hover:bg-gray-50"
                >
                  <h3 className="font-medium">{app.position}</h3>
                  <p className="text-sm text-gray-600">{app.company}</p>
                </Link>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
