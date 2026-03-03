type AuditEvent =
  | 'LOGIN_FAILED'
  | 'LOGIN_SUCCESS'
  | 'TOKEN_REFRESH'
  | 'TOKEN_REFRESH_FAILED'
  | 'LOGOUT'
  | 'ADMIN_LIST_STUDENTS'
  | 'ADMIN_VIEW_LOGS'
  | 'ADMIN_APPROVE_LOG'
  | 'ADMIN_REJECT_LOG'
  | 'ADMIN_VIEW_SESSIONS'
  | 'ADMIN_REVOKE_SESSION'
  | 'ADMIN_ADD_HOLIDAY'
  | 'ADMIN_REMOVE_HOLIDAY'
  | 'ADMIN_VIEW_DASHBOARD';

interface AuditData {
  userId?: string;
  identifier?: string;
  ip?: string;
  userAgent?: string;
  reason?: string;
  isNewAccount?: boolean;
  targetId?: string;
  details?: string;
}

export function auditLog(event: AuditEvent, data: AuditData): void {
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    ...data,
  };
  console.log(JSON.stringify(entry));
}
