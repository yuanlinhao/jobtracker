import { useDroppable } from "@dnd-kit/core";
import { Trash2 } from "lucide-react";
import clsx from "clsx";

const TrashDropZone = () => {
  const { setNodeRef, isOver } = useDroppable({ id: "trash" });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50",
        "w-16 h-16 rounded-full bg-red-600 text-white shadow-xl flex items-center justify-center",
        isOver && "ring-4 ring-red-300 animate-pulse"
      )}
    >
      <Trash2 className="w-6 h-6" />
    </div>
  );
};

export default TrashDropZone;
