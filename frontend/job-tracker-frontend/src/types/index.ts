export type Tag = {
    id: string;
    name: string;
  };
  
  export type Application = {
    id: string;
    company: string;
    position: string;
    location: string | null;
    status: string;
    url: string | null;
    notes: string;
    created_at: string;
    updated_at: string;
    is_deleted?: boolean;
    tags: {
      [field: string]: Tag[]; // e.g., { company: [...], location: [...] }
    };
  };