// User roles
export type UserRole = 'admin' | 'social_media' | 'collaborator' | 'user';

// User type
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
}

// Collaborator profile
export interface CollaboratorProfile {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  church: string;
  position: string;
  bio: string;
  region: string;
  city: string;
  neighborhood: string;
}

// Post type
export interface Post {
  id: string;
  title: string;
  content: string;
  image?: string;
  authorId: string;
  authorName: string;
  likes: number;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

// Comment type
export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

// Testimonial type
export interface Testimonial {
  id: string;
  title: string;
  content: string;
  authorName: string;
  image?: string;
  video?: string;
  status: 'draft' | 'published';
  createdAt: string;
  publishedAt?: string;
}

// Contact message type
export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email?: string;
  message: string;
  status: 'new' | 'in_progress' | 'answered';
  notes?: string;
  createdAt: string;
  answeredAt?: string;
}

// Gallery folder type
export interface GalleryFolder {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  date: string;
  createdAt: string;
}

// Gallery media type
export interface GalleryMedia {
  id: string;
  folderId: string;
  type: 'photo' | 'video';
  url: string;
  thumbnail?: string;
  caption?: string;
  createdAt: string;
}

// Discipleship contact type
export interface DiscipleshipContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  age: number;
  city: string;
  neighborhood: string;
  assignedCollaboratorId?: string;
  assignedCollaboratorName?: string;
  status: DiscipleshipStatus;
  notes?: string;
  registeredBy: string;
  createdAt: string;
  updatedAt: string;
}

// Discipleship status type
export type DiscipleshipStatus = 
  | 'not_contacted'
  | 'first_contact'
  | 'praying_together'
  | 'attending_church'
  | 'needs_visit'
  | 'needs_prayer'
  | 'referred_to_leadership';

// Verse of the day type
export interface VerseOfTheDay {
  reference: string;
  text: string;
  date: string;
}
