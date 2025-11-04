export interface CollaboratorProfile {
  id: string;
  user_id: string;
  church: string | null;
  position: string | null;
  bio: string | null;
  city: string | null;
  region: string | null;
  neighborhood: string | null;
  street: string | null;
  street_number: string | null;
  state: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  accepting_new: boolean;
  age: number | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
  // Joined data
  name?: string;
  avatar_url?: string;
}

export interface CollaboratorProfileForm {
  church: string;
  position: string;
  bio: string;
  street: string;
  street_number: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  accepting_new: boolean;
  age: string;
}