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
