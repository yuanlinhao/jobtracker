import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import clsx from "clsx";
import { Application, Tag } from "../../types";
import { useTagStore } from "../../store/useTagStore";
import { api } from "../../api/client";

type Props = {
  mode: "create";
  onClose: () => void;
  onCreate?: (newApp: Application) => void;
};

type FormState = {
  company: string;
  position: string;
  location: string;
  notes: string;
  url: string;
  tags: Record<string, Tag[]>; // field => [tag]
};

const defaultState: FormState = {
  company: "",
  position: "",
  location: "",
  notes: "",
  url: "",
  tags: {
    company: [],
    location: [],
    position: [],
  },
};

const ApplicationFormModal = ({ mode, onClose, onCreate }: Props) => {
  const { tags, fetchTags } = useTagStore();

  const [form, setForm] = useState<FormState>(defaultState);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleTextChange = (field: keyof FormState["tags"]) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setForm((prev) => ({
      ...prev,
      [field]: val,
      tags: {
        ...prev.tags,
        [field]: val.trim() === "" ? prev.tags[field] : [], // clear tag if typing
      },
    }));
  };

  const renderTagField = (field: "company" | "location" | "position") => {
    const fieldText = form[field];
    const selectedTag = form.tags[field]?.[0];
    const isInputDisabled = !!selectedTag;
    const isTagSelectionDisabled = fieldText.trim() !== "";
  
    return (
      <div className="space-y-1">
        <label className="text-xs font-semibold capitalize text-gray-600">{field}</label>
  
        {/* Selected tag + text input */}
        <div className="flex flex-wrap items-center gap-1 p-2 border rounded bg-gray-50 min-h-[40px]">
          {selectedTag && (
            <span
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  tags: { ...prev.tags, [field]: [] },
                  [field]: "",
                }))
              }
              className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full cursor-pointer hover:bg-blue-200"
            >
              {selectedTag.name} ✕
            </span>
          )}
          <input
            type="text"
            disabled={isInputDisabled}
            value={isInputDisabled ? "" : fieldText}
            onChange={handleTextChange(field)}
            placeholder={`Type or select a ${field}...`}
            className={clsx(
              "text-xs px-1 py-0.5 bg-transparent outline-none flex-grow",
              isInputDisabled && "text-gray-400 cursor-not-allowed"
            )}
          />
        </div>
  
        {/* Tag selection row */}
        <div className="flex gap-2 overflow-x-auto max-w-full py-1">
          {tags.map((tag) => {
            const isSelected = selectedTag?.id === tag.id;
            const isTakenInOtherField = Object.entries(form.tags).some(
              ([otherField, tagsInOther]) =>
                otherField !== field && tagsInOther.some((t) => t.id === tag.id)
            );
            const isDisabled = isTagSelectionDisabled || (isTakenInOtherField && !isSelected);
  
            return (
              <button
                key={tag.id}
                disabled={isDisabled}
                onClick={() => {
                  if (!isDisabled) {
                    setForm((prev) => ({
                      ...prev,
                      tags: {
                        ...prev.tags,
                        [field]: [tag],
                      },
                      [field]: tag.name,
                    }));
                  }
                }}
                className={clsx(
                  "px-2 py-1 text-xs rounded-full font-medium transition-all duration-150 whitespace-nowrap",
                  isSelected
                    ? "bg-white text-gray-800 border border-gray-400 ring-2 ring-blue-500"
                    : "bg-gray-100 text-gray-500 border border-gray-300 hover:bg-gray-200",
                  isDisabled && !isSelected && "opacity-50 cursor-not-allowed"
                )}
              >
                {tag.name}
              </button>
            );
          })}
        </div>
      </div>
    );
  };
  
  

  const handleSubmit = async () => {
    const getFieldValue = (field: "company" | "position" | "location") => {
      const manualText = form[field]?.trim();
      const selectedTag = form.tags[field]?.[0]?.name ?? "";
      return manualText || selectedTag || undefined;
    };
  
    const tagEntries = Object.entries(form.tags).flatMap(([field, tags]) =>
      tags.map((tag) => ({
        tag_id: tag.id,
        field,
      }))
    );
  
    const payload: Record<string, any> = {
      company: getFieldValue("company"),
      position: getFieldValue("position"),
      location: getFieldValue("location"),
      status: "wishlist",
    };
  
    if (form.url?.trim()) payload.url = form.url.trim();
    if (form.notes?.trim()) payload.notes = form.notes.trim();
    if (tagEntries.length > 0) payload.tags = tagEntries;
  
    console.log("📦 Final Payload:", payload);
  
    try {
      const res = await api.post("/applications/", payload);
      const newApp: Application = res.data;
  
      if (onCreate) onCreate(newApp);
      onClose();
    } catch (err) {
      console.error("❌ Failed to create application", err);
      alert("Error submitting application.");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white max-w-lg w-full p-6 rounded shadow-xl relative space-y-4"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-lg font-semibold">Create New Application</h2>

        <div className="space-y-4">
          {renderTagField("company")}
          {renderTagField("location")}
          {renderTagField("position")}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">URL</label>
            <input
              type="text"
              value={form.url}
              onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
              className="text-sm px-2 py-1 border rounded w-full"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              rows={4}
              className="text-sm px-2 py-1 border rounded w-full resize-none"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition cursor-pointer"
        >
          Create Application
        </button>
      </div>
    </div>,
    document.body
  );
};

export default ApplicationFormModal;
