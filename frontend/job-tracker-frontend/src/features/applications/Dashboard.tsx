import { useEffect, useState } from "react";
import { DndContext, DragEndEvent, DragOverlay } from "@dnd-kit/core";
import KanbanColumn from "./KanbanColumn";
import { useTagStore } from "../../store/useTagStore";
import { useSelectionStore } from "../../store/useSelectionStore";
import { api } from "../../api/client";
import { XCircle } from "lucide-react";
import clsx from "clsx";
import TrashDropZone from "../../components/TrashDropZone";
import KanbanCard from "./KanbanCard";

type Application = {
  id: string;
  company: string;
  position: string;
  status: string;
  created_at: string;
  updated_at: string;
  tag_ids: string[];
  is_deleted?: boolean;
};

const STATUSES = ["wishlist", "applied", "interviewed", "offer", "declined"] as const;

const Dashboard = () => {
  const [apps, setApps] = useState<Application[]>([]);
  const [filteredApps, setFilteredApps] = useState<Application[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterLogic, setFilterLogic] = useState<"OR" | "AND">("OR");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedApp, setDraggedApp] = useState<Application | null>(null);
  const { tags, fetchTags } = useTagStore();
  const { selectedIds, clearSelection } = useSelectionStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchTags();
        const res = await api.get("/applications/");
        setApps(res.data.applications ?? []);
      } catch (err) {
        console.error("Failed to load applications", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedTags.length === 0) {
      setFilteredApps(apps);
    } else {
      const filtered = apps.filter((app) => {
        return filterLogic === "AND"
          ? selectedTags.every((id) => app.tag_ids.includes(id))
          : selectedTags.some((id) => app.tag_ids.includes(id));
      });
      setFilteredApps(filtered);
    }
  }, [apps, selectedTags, filterLogic]);

  const handleTagClick = (id: string) => {
    if (selectedTags.length === 0) {
      setSelectedTags([id]);
      setFilterLogic("OR");
    } else if (selectedTags.length === 1 && selectedTags[0] === id) {
      setFilterLogic((prev) => (prev === "OR" ? "AND" : "OR"));
    } else if (selectedTags.includes(id)) {
      setSelectedTags((prev) => prev.filter((t) => t !== id));
    } else {
      setSelectedTags((prev) => [...prev, id]);
    }
  };

  const clearFilter = () => {
    setSelectedTags([]);
    setFilterLogic("OR");
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const draggedId = active.id.toString();
    const dropTarget = over.id.toString();

    const group = selectedIds.includes(draggedId)
      ? selectedIds
      : [draggedId];

    if (dropTarget === "trash") {
      setApps((prev) => prev.filter((app) => !group.includes(app.id)));
      try {
        const trashSound = new Audio("/sounds/trash.mp3");
        await trashSound.play();
      } catch {}
      try {
        await Promise.all(group.map((id) => api.delete(`/applications/${id}`)));
      } catch (err) {
        console.error("Failed to delete group", err);
        alert("Some deletions failed. Please refresh.");
      }
      clearSelection();
      return;
    }

    const newStatus = dropTarget;
    const updatedAt = new Date().toISOString();

    const updatedApps = apps.map((app) =>
      group.includes(app.id)
        ? { ...app, status: newStatus, updated_at: updatedAt }
        : app
    );
    setApps(updatedApps);

    try {
      await Promise.all(
        group.map((id) => api.patch(`/applications/${id}`, { status: newStatus }))
      );
    } catch (err) {
      console.error("Failed to update multiple cards", err);
      alert("One or more updates failed. Reloading...");
      location.reload();
    }

    clearSelection();
  };

  return (
    <DndContext
      onDragStart={({ active }) => {
        setActiveId(active.id.toString());
        setIsDragging(true);
        const found = apps.find((app) => app.id === active.id.toString());
        setDraggedApp(found ?? null);
      }}
      onDragEnd={(event) => {
        handleDragEnd(event);
        setActiveId(null);
        setIsDragging(false);
        setDraggedApp(null);
      }}
    >
      <div
        className="p-4 space-y-4"
        onClick={() => clearSelection()}
      >
        {/* Tag filter bar */}
        <div className="flex items-center flex-wrap gap-2">
          {tags.map((tag) => {
            const isSelected = selectedTags.includes(tag.id);
            const isFirstSelected = selectedTags[0] === tag.id;
            const logicClass =
              filterLogic === "AND"
                ? "ring-red-400 animate-pulse"
                : "ring-blue-400 animate-[pulse_1.5s_ease-in-out_infinite]";
            return (
              <button
                key={tag.id}
                onClick={() => handleTagClick(tag.id)}
                className={clsx(
                  "px-2 py-1 text-xs rounded-full border font-medium transition-all duration-150 hover:scale-[1.02]",
                  isSelected
                    ? `bg-white text-gray-800 border-gray-400 ring-2 ${
                        isFirstSelected ? logicClass : "ring-inset"
                      }`
                    : "bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-200"
                )}
              >
                {tag.name}
              </button>
            );
          })}
          {selectedTags.length > 0 && (
            <div className="relative group">
              <button
                onClick={clearFilter}
                className="ml-2 p-1 text-gray-500 hover:text-red-500 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
              <span className="absolute -top-8 left-0 text-xs text-gray-700 bg-white px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity">
                Clear filter
              </span>
            </div>
          )}
        </div>

        {/* Kanban columns */}
        <div className="overflow-x-auto max-w-full snap-x snap-mandatory">
          <div className="flex space-x-4 min-w-max px-2 pb-6">
            {STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                apps={filteredApps.filter((app) => app.status === status)}
                activeId={activeId}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Trash bin */}
      <TrashDropZone isVisible={isDragging} />

      {/* Drag overlay */}
      <DragOverlay>
        {draggedApp && (
          <KanbanCard app={draggedApp} activeId={activeId} />
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default Dashboard;
