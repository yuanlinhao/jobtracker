import { useEffect, useState, useRef } from "react";
import { DndContext, DragEndEvent, DragOverlay } from "@dnd-kit/core";
import { XCircle, Plus, X as LucideX } from "lucide-react";
import clsx from "clsx";
import KanbanColumn from "./KanbanColumn";
import KanbanCard from "./KanbanCard";
import TrashDropZone from "../../components/TrashDropZone";
import ApplicationFormModal from "./ApplicationFormModal";
import { useTagStore } from "../../store/useTagStore";
import { useSelectionStore } from "../../store/useSelectionStore";
import { api } from "../../api/client";
import { Trash2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";


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
  //const [filteredApps, setFilteredApps] = useState<Application[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterLogic, setFilterLogic] = useState<"OR" | "AND">("OR");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedApp, setDraggedApp] = useState<Application | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [deleteMode, setDeleteMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const refreshKey = query.get("refresh");



  const longPressTimer = useRef<number | null>(null);

  const { tags, fetchTags } = useTagStore();
  const { selectedIds, clearSelection } = useSelectionStore();

  const exitDeleteMode = () => {
    if (deleteMode) setDeleteMode(false);
  };

  const clearFilter = () => {
    setSelectedTags([]);
    setFilterLogic("OR");
  };

  const lastClickRef = useRef<number | null>(null);

  const handleTagClick = (id: string) => {
    const now = Date.now();
    const isOnlySelected = selectedTags.length === 1 && selectedTags[0] === id;
  
    if (
      isOnlySelected &&
      lastClickRef.current &&
      now - lastClickRef.current < 300
    ) {
      setFilterLogic((prev) => (prev === "AND" ? "OR" : "AND"));
      lastClickRef.current = null;
      return;
    }
  
    lastClickRef.current = now;
  
    setSelectedTags((prev) => {
      if (prev.includes(id)) {
        return isOnlySelected ? prev : prev.filter((t) => t !== id);
      } else {
        return [...prev, id];
      }
    });
  };
  
  
  
  

  const handleTagDelete = async (tagId: string) => {
    try {
      await api.delete(`/tags/${tagId}`);
      await fetchTags();
      const sound = new Audio("/sounds/trash.mp3");
      await sound.play();
    } catch (err) {
      console.error("Failed to delete tag", err);
      alert("Failed to delete tag. Please try again.");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const draggedId = active.id.toString();
    const dropTarget = over.id.toString();
    const group = selectedIds.includes(draggedId) ? selectedIds : [draggedId];

    if (dropTarget === "trash") {
      setApps((prev) => prev.filter((app) => !group.includes(app.id)));
      try {
        await Promise.all(group.map((id) => api.delete(`/applications/${id}`)));
        const trashSound = new Audio("/sounds/trash.mp3");
        await trashSound.play();
      } catch (err) {
        console.error("Failed to delete applications", err);
        alert("Some deletions failed. Please refresh.");
      }
      clearSelection();
      return;
    }

    const updatedAt = new Date().toISOString();
    const updatedApps = apps.map((app) =>
      group.includes(app.id) ? { ...app, status: dropTarget, updated_at: updatedAt } : app
    );
    setApps(updatedApps);

    try {
      await Promise.all(
        group.map((id) => api.patch(`/applications/${id}`, { status: dropTarget }))
      );
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update. Reloading...");
      window.location.reload();
    }

    clearSelection();
  };

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
  }, [refreshKey]);

  // useEffect(() => {
  //   if (selectedTags.length === 0) {
  //     setFilteredApps(apps);
  //   } else {
  //     const filtered = apps.filter((app) =>
  //       filterLogic === "AND"
  //         ? selectedTags.every((id) => app.tag_ids.includes(id))
  //         : selectedTags.some((id) => app.tag_ids.includes(id))
  //     );
  //     setFilteredApps(filtered);
  //   }
  // }, [apps, selectedTags, filterLogic]);

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
        onClick={() => {
          clearSelection();
          exitDeleteMode();
        }}
      >

<div className="flex justify-between items-center mb-4">
        {/* Tag filter bar */}
        <div className="flex items-center flex-wrap gap-2">
          {isAddingTag ? (
            <input
              autoFocus
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && newTagName.trim()) {
                  try {
                    await api.post("/tags/", { name: newTagName.trim() });
                    setNewTagName("");
                    setIsAddingTag(false);
                    await fetchTags();
                  } catch (err) {
                    console.error("Failed to create tag", err);
                  }
                } else if (e.key === "Escape") {
                  setIsAddingTag(false);
                  setNewTagName("");
                }
              }}
              onBlur={() => {
                setIsAddingTag(false);
                setNewTagName("");
              }}
              placeholder="New tag..."
              className="text-xs px-2 py-1 rounded-full border border-gray-300 bg-white shadow-sm focus:outline-none"
            />
          ) : (
            <button
              onClick={() => setIsAddingTag(true)}
              className="px-2 py-1 text-xs rounded-full border border-dashed text-gray-500 hover:text-blue-600 hover:border-blue-400"
            >
              + Tag
            </button>
          )}

          {tags.map((tag) => {
            const isSelected = selectedTags.includes(tag.id);

            const logicClass =
              filterLogic === "AND"
                ? "ring-red-400 animate-pulse"
                : "ring-blue-400 animate-[pulse_1.5s_ease-in-out_infinite]";

            const startLongPress = () => {
              longPressTimer.current = window.setTimeout(() => {
                setDeleteMode(true);
              }, 2000);
            };

            const cancelLongPress = () => {
              if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
              }
            };

            return (
              <div
                key={tag.id}
                onPointerDown={startLongPress}
                onPointerUp={cancelLongPress}
                onPointerLeave={cancelLongPress}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!deleteMode) handleTagClick(tag.id);
                }}
                className={clsx(
                "relative flex items-center px-2 py-1 text-xs rounded-full font-medium transition-all duration-150 select-none cursor-default",
                deleteMode && "animate-wiggle",
                isSelected
                  ? filterLogic === "AND"
                    ? "bg-red-50 text-red-800 border-red-400 ring-2 ring-red-500"
                    : "bg-blue-50 text-blue-800 border-blue-400 ring-2 ring-blue-500"
                  : "bg-gray-100 border border-gray-300 text-gray-500 hover:bg-gray-200"
              )}
              >
                <span className="select-none cursor-default">{tag.name}</span>

                {deleteMode && (
                <button
                    onClick={(e) => {
                    e.stopPropagation();
                    handleTagDelete(tag.id);
                    }}
                    className="absolute top-[-6px] right-[-6px] w-4 h-4 flex items-center justify-center 
                            bg-red-100 text-red-600 rounded-full shadow-sm hover:bg-red-200 transition 
                            transform hover:scale-110 animate-pop focus:outline-none"
                >
                    <LucideX className="w-3 h-3" strokeWidth={2} />
                </button>
                    )}
              </div>
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

          {/* Trash bin icon on the right */}
          <button
            onClick={() => navigate("/trash")}
            className="text-gray-500 hover:text-red-600 transition"
            title="View Trash Bin"
        >
            <Trash2 className="w-5 h-5" />
        </button>
        </div>


        {/* Kanban board */}
        <div className="overflow-x-auto max-w-full snap-x snap-mandatory">
          <div className="flex space-x-4 min-w-max px-2 pb-6">
            //changes
            {STATUSES.map((status) => {
  const visibleApps = apps.filter((app) => {
    const tagMatch =
      selectedTags.length === 0
        ? true
        : filterLogic === "AND"
        ? selectedTags.every((id) => app.tag_ids.includes(id))
        : selectedTags.some((id) => app.tag_ids.includes(id));
    return app.status === status && tagMatch;
  });

  return (
    <KanbanColumn
      key={status}
      status={status}
      apps={visibleApps}
      activeId={activeId}
    />
  );
            })}
          </div>
        </div>
      </div>

      {/* Trash drop zone */}
      {isDragging && <TrashDropZone />}

      {/* Add application button */}
      <button
        onClick={() => !isDragging && setShowCreateModal(true)}
        className={clsx(
          "fixed bottom-6 right-6 z-50 w-14 h-14 flex items-center justify-center rounded-full shadow-xl transition",
          isDragging
            ? "bg-gray-400 text-white cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        )}
      >
        <Plus className="w-6 h-6" />
      </button>

      <DragOverlay>
        {draggedApp && <KanbanCard app={draggedApp} activeId={activeId} />}
      </DragOverlay>

      {showCreateModal && (
        <ApplicationFormModal
          mode="create"
          onClose={() => setShowCreateModal(false)}
          onCreate={(newApp) => {
              const enrichedApp = {
                ...newApp,
                tag_ids: [],
              };
              setApps((prev) => [enrichedApp, ...prev]);
              //changes
            }}
      />      
      )}
    </DndContext>
  );
};

export default Dashboard;
