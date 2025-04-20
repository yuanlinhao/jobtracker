import { useDroppable } from "@dnd-kit/core";
import { Trash2 } from "lucide-react";
import clsx from "clsx";

type Props = {
  isVisible: boolean;
};

const TrashDropZone = ({ isVisible }: Props) => {
  const { setNodeRef, isOver } = useDroppable({
    id: "trash",
  });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "fixed bottom-6 right-6 z-50 transition-all duration-300 ease-in-out",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
      )}
    >
      <div
        className={clsx(
          "w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-xl",
          isOver && "ring-4 ring-red-300 animate-pulse"
        )}
      >
        <Trash2 className="text-white w-6 h-6" />
      </div>
    </div>
  );
};

export default TrashDropZone;
