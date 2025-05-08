import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { X, Wrench, Check } from "lucide-react";
import clsx from "clsx";
import { useTagStore } from "../../store/useTagStore";


type Tag = { id: string; name: string };
type TagsByField = Record<string, Tag[]>;

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
  tags: TagsByField;
};

const tagFieldKeys = ["company", "position", "location"] as const;

const AppDetailsModal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tags, fetchTags } = useTagStore();

  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [formData, setFormData] = useState<ApplicationDetail | null>(null);
  const [editMode, setEditMode] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchTags();
        const res = await api.get(`/applications/${id}`);
        setApp(res.data);
        setFormData(res.data);
      } catch (err: any) {
        console.error("Failed to fetch application", err);
        setError("Unable to load application.");
      }
    };
    fetchData();
  }, [id]);

  const closeModal = () => navigate(-1);

  const handleTagSelect = (field: string, selected: Tag) => {
    if (!formData) return;

    setFormData((prev) => ({
      ...prev!,
      [field]: selected.name,
      tags: {
        ...prev!.tags,
        [field]: [selected],
      },
    }));
  };

  const getSelectedTagId = (field: string): string | null => {
    return formData?.tags[field]?.[0]?.id || null;
  };

  const isTagDisabled = (tagId: string, currentField: string) => {
    return tagFieldKeys.some(
      (field) =>
        field !== currentField && getSelectedTagId(field) === tagId
    );
  };

  const handleSave = async () => {
    if (!formData || !id) return;
  
    // Construct the payload
    const tagEntries = Object.entries(formData.tags).flatMap(([field, tags]) =>
      tags.map((tag) => ({ tag_id: tag.id, field }))
    );
  
    const payload: Record<string, any> = {
      company: formData.company,
      position: formData.position,
      location: formData.location?.trim() || undefined,
      url: formData.url?.trim() || undefined,
      notes: formData.notes?.trim() || undefined,
      tags: tagEntries.length > 0 ? tagEntries : undefined,
    };
  
    try {
      const res = await api.patch(`/applications/${id}`, payload);
      setApp(res.data);
      setFormData(res.data);
      setEditMode(false);
      navigate(`/?refresh=${Date.now()}`);
    } catch (err) {
      console.error("❌ Failed to save application", err);
      alert("Error saving application.");
    }
  };
  

  if (error) {
    return (
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center"
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

  if (!formData) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center"
      onClick={closeModal}
    >
      <div
        className="bg-white rounded-md shadow-xl p-6 w-full max-w-2xl min-h-[500px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="flex justify-between items-start">
          <h2 className="text-2xl font-bold mb-4">
            {formData.position} @ {formData.company}
          </h2>
          <div className="flex items-center gap-3">
            <button onClick={closeModal}>
              <X className="text-gray-500 hover:text-red-500" />
            </button>
            <button onClick={editMode ? handleSave : () => setEditMode(true)}>
              {editMode ? (
                <Check className="text-green-600 hover:text-green-800" />
              ) : (
                <Wrench className="text-gray-600 hover:text-blue-600" />
              )}
            </button>
          </div>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {(["company", "position", "location"] as const).map((fieldKey) => {
            const tag = formData.tags[fieldKey]?.[0];
            const value = formData[fieldKey];

            return (
              <div key={fieldKey}>
                <p className="text-gray-600 font-semibold capitalize mb-1">
                  {fieldKey}
                </p>
                {editMode ? (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={value || ""}
                      onChange={(e) =>
                        setFormData((prev) =>
                          prev
                            ? {
                                ...prev,
                                [fieldKey]: e.target.value,
                                tags: {
                                  ...prev.tags,
                                  [fieldKey]: [], // Clear tag if typing
                                },
                              }
                            : prev
                        )
                      }
                      className={clsx(
                        "text-sm px-2 py-1 border rounded w-full",
                        tag && "bg-gray-100 text-gray-400 cursor-not-allowed"
                      )}
                      disabled={!!tag}
                    />

                    <div className="flex flex-wrap gap-1 max-w-md">
                      {tags.map((tagOption) => {
                        const selected = getSelectedTagId(fieldKey) === tagOption.id;
                        const disabled = isTagDisabled(tagOption.id, fieldKey) && !selected;
                        return (
                          <button
                            key={tagOption.id}
                            disabled={disabled}
                            onClick={() => {
                              const selected = getSelectedTagId(fieldKey) === tagOption.id;
                              if (selected) {
                                // Unselect tag
                                setFormData((prev) =>
                                  prev ? {
                                    ...prev,
                                    [fieldKey]: "",
                                    tags: {
                                      ...prev.tags,
                                      [fieldKey]: [],
                                    }
                                  } : prev
                                );
                              } else {
                                handleTagSelect(fieldKey, tagOption);
                              }
                            }}
                                                        className={clsx(
                              "px-2 py-0.5 text-xs rounded-full transition border",
                              selected
                                ? "bg-blue-100 text-blue-800 border-blue-400 ring-2 ring-blue-400"
                                : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200",
                              disabled && "opacity-40 cursor-not-allowed"
                            )}
                          >
                            {tagOption.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : tag ? (
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                    {tag.name}
                  </span>
                ) : (
                  <span className="text-gray-700">{value || "—"}</span>
                )}
              </div>
            );
          })}

          {/* URL */}
          <div className="col-span-2">
            <p className="text-gray-600 font-semibold mb-1">Url</p>
            {editMode ? (
              <input
                type="text"
                value={formData.url || ""}
                onChange={(e) =>
                  setFormData((prev) =>
                    prev ? { ...prev, url: e.target.value } : prev
                  )
                }
                className="text-sm px-2 py-1 border rounded w-full"
              />
            ) : formData.url ? (
              <a
                href={formData.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline break-all text-sm"
              >
                {formData.url}
              </a>
            ) : (
              <span className="text-sm text-gray-700">—</span>
            )}
          </div>

          {/* Notes */}
          <div className="col-span-2">
            <p className="text-gray-600 font-semibold mb-1">Notes</p>
            {editMode ? (
              <textarea
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData((prev) =>
                    prev ? { ...prev, notes: e.target.value } : prev
                  )
                }
                rows={4}
                className="text-sm px-2 py-1 border rounded w-full"
              />
            ) : (
              <span className="text-sm text-gray-700">{formData.notes || "—"}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppDetailsModal;
