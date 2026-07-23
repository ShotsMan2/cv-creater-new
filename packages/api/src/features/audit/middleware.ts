import { auditService } from "./service";

// Automatically log resume CRUD operations
export async function auditResumeOperation(params: {
  userId: string;
  action: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  return auditService.create({
    userId: params.userId,
    action: params.action,
    entityType: "resume",
    entityId: params.entityId,
    details: params.details,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}

// Automatically log auth events
export async function auditAuthEvent(params: {
  userId: string;
  action: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  return auditService.create({
    userId: params.userId,
    action: params.action,
    entityType: "auth",
    details: params.details,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}

// Automatically log workspace operations
export async function auditWorkspaceOperation(params: {
  workspaceId: string;
  userId: string;
  action: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  return auditService.create({
    workspaceId: params.workspaceId,
    userId: params.userId,
    action: params.action,
    entityType: "workspace",
    entityId: params.entityId,
    details: params.details,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}
