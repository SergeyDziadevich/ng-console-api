export const TICKETS_PATTERNS = {
  FIND_ALL: 'tickets.findAll',
  FIND_BY_ID: 'tickets.findById',
  CREATE: 'tickets.create',
  UPDATE: 'tickets.update',
  DELETE: 'tickets.delete',
  ADD_COMMENT: 'tickets.addComment',
  FIND_EPICS: 'tickets.findEpics',
  BULK_UPDATE: 'tickets.bulkUpdate',
} as const;

export interface CreateTicketCommand {
  title: string;
  description: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  createdBy: string;
  epicTagId?: string;
}

export interface UpdateTicketCommand {
  id: string;
  data: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    assignedTo?: string;
    epicTagId?: string;
  };
  updatedBy?: string;
}

export interface AddCommentCommand {
  ticketId: string;
  authorId: string;
  content: string;
}

export interface BulkUpdateTicketsCommand {
  ticketIds: string[];
  status: string;
  updatedBy?: string;
}

export interface TicketDto {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedTo?: string;
  createdBy: string;
  epicTag?: EpicTagDto;
  comments?: CommentDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CommentDto {
  id: string;
  ticketId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface EpicTagDto {
  id: string;
  name: string;
  color?: string;
}
