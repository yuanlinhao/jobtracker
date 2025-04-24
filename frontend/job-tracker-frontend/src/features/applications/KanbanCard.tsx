import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate, useLocation } from "react-router-dom";
import { useTagStore } from "../../store/useTagStore";
import { useSelectionStore } from "../../store/useSelectionStore";
import { formatDistance, isValid, parseISO } from "date-fns";

type Props = {
  app: {
    id: string;
    position: string;
    company: string;
    status: string;
    created_at: string;
    updated_at: string;
    tag_ids: string[];
    is_deleted?: boolean;
  };
  activeId: string | null;
};

const getStalenessColor = (updatedAt: Date, isDeleted = false): string => {
  if (isDeleted) return "border-black";
  const hours = Math.floor((Date.now() - updatedAt.getTime()) / (1000 * 60 * 60));
  if (hours < 6) return "border-emerald-500";
  if (hours < 12) return "border-lime-500";
  if (hours < 24) return "border-yellow-400";
  if (hours < 48) return "border-amber-500";
  if (hours < 72) return "border-orange-500";
  if (hours < 96) return "border-red-500";
  return "border-rose-600";
};

const getStalenessLabel = (updatedAt: Date, isDeleted = false): string => {
  if (isDeleted) return "Deleted";
  const hours = Math.floor((Date.now() - updatedAt.getTime()) / (1000 * 60 * 60));
  if (hours < 6) return "Updated < 6h ago";
  if (hours < 12) return "Updated < 12h ago";
  if (hours < 24) return "Updated today";
  if (hours < 48) return "Updated yesterday";
  if (hours < 72) return "Updated 2 days ago";
  if (hours < 96) return "Updated 3–4 days ago";
  return "Updated over 4 days ago";
};

const KanbanCard = ({ app, activeId }: Props) => {
  const { tags } = useTagStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: app.id });

  const { selectedIds, toggleSelection } = useSelectionStore();
  const isSelected = selectedIds.includes(app.id);
  const isGroupDrag = selectedIds.includes(app.id) && activeId !== null;
  const shouldApplyTransform = app.id === activeId || isGroupDrag;

  const style = {
    transform: shouldApplyTransform && transform ? CSS.Translate.toString(transform) : undefined,
    opacity: isDragging || isGroupDrag ? 0.5 : 1,
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  };

  const localUpdatedAt = parseISO(app.updated_at);
  const colorClass = getStalenessColor(localUpdatedAt, app.is_deleted);
  const stalenessLabel = getStalenessLabel(localUpdatedAt, app.is_deleted);
  const updatedAgo = isValid(localUpdatedAt)
    ? formatDistance(localUpdatedAt, new Date(), { addSuffix: true })
    : "unknown";

    const tagNames =
    tags.length > 0 && Array.isArray(app.tag_ids)
      ? app.tag_ids
          .map((id) => tags.find((t) => t.id === id)?.name)
          .filter(Boolean) as string[]
      : [];

      const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
      
        if (app.is_deleted) return;
      
        const isMulti = e.ctrlKey || e.metaKey;
      
        if (isMulti) {
          toggleSelection(app.id, isMulti);
        } else {
          navigate(`/dashboard/app/${app.id}`, {
            state: { backgroundLocation: location },
          });
        }
      };
      

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      className={`border-l-4 ${colorClass} bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 min-h-[120px] cursor-pointer ${
        isSelected ? "ring-2 ring-blue-500" : ""
      }`}
    >
      {/* Drag handle */}
      <div
        {...listeners}
        {...attributes}
        className="cursor-grab mb-2"
        title="Drag to move"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 10h16M4 14h16"
          />
        </svg>
      </div>

      {/* Text content */}
      <div className="flex flex-col items-start text-left select-none">
        <div className="mb-1 text-sm font-semibold text-gray-800">{app.position}</div>
        <div className="text-xs text-gray-500">{app.company}</div>

        {tagNames.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tagNames.map((name) => (
              <span
                key={name}
                className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full cursor-default"
              >
                {name}
              </span>
            ))}
          </div>
        )}

        <div className="text-[10px] text-gray-400 mt-2 ml-auto" title={stalenessLabel}>
          {updatedAgo !== "unknown" && <span>{updatedAgo}</span>}
        </div>
      </div>
    </div>
  );
};

export default KanbanCard;
