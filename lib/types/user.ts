export type UserRole = "user" | "agent" | "admin";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  image?: string | null;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
}

export interface ManagedUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    ticketsCreated: number;
    messages: number;
  };
}
