import { useDroppable } from "@dnd-kit/core";
import KanbanCard from "./KanbanCard";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

type App = {
  id: string;
  company: string;
  position: string;
  status: string;
  created_at: string;
  updated_at: string;
  tag_ids: string[];
  is_deleted?: boolean;
};

type Props = {
  status: string;
  apps: App[];
  activeId: string | null;
};

const KanbanColumn = ({ status, apps, activeId }: Props) => {
  const { setNodeRef } = useDroppable({ id: status });
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const location = useLocation();

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"));
  };

  const sortedApps = [...apps].sort((a, b) => {
    const dateA = new Date(a.updated_at).getTime();
    const dateB = new Date(b.updated_at).getTime();
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  return (
    <div
      ref={setNodeRef}
      className="bg-white min-w-[250px] max-w-[280px] rounded-md p-3 snap-start"
    >
      <div
        className="flex justify-between items-center mb-2 cursor-pointer select-none"
        onClick={toggleSort}
      >
        <h2 className="text-base font-semibold capitalize tracking-wide text-gray-700">
          {status}
        </h2>
        {sortOrder === "newest" ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        )}
      </div>

      <div className="space-y-3">
        {sortedApps.map((app) => (
          <KanbanCard key={app.id} app={app} activeId={activeId} />
        ))}
      </div>
    </div>
  );
};

export default KanbanColumn;
