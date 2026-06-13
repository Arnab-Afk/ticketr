export type TicketStatus =
  | "open"
  | "in_progress"
  | "waiting_on_user"
  | "resolved"
  | "closed";

export type TicketPriority = "low" | "normal" | "high" | "urgent";

export interface TicketCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface TicketUser {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  role?: string;
}

export interface TicketAttachment {
  id: string;
  ticketId?: string | null;
  messageId?: string | null;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  author: TicketUser;
  attachments?: TicketAttachment[];
}

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  categoryId: string;
  createdById: string;
  assigneeId?: string | null;
  publicToken?: string | null;
  guestEmail?: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
  category: TicketCategory;
  creator: TicketUser;
  assignee?: TicketUser | null;
  messages?: TicketMessage[];
  attachments?: TicketAttachment[];
  _count?: { messages: number };
}

export interface CannedResponse {
  id: string;
  title: string;
  body: string;
  shortcut?: string | null;
  isGlobal: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export interface CreateTicketInput {
  subject: string;
  description: string;
  categoryId: string;
  priority?: TicketPriority;
  attachmentIds?: string[];
}

export interface PublicCreateTicketInput extends CreateTicketInput {
  email: string;
  fullName: string;
}

export interface UpdateTicketInput {
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string | null;
}

export interface CreateMessageInput {
  body: string;
  isInternal?: boolean;
  attachmentIds?: string[];
}
