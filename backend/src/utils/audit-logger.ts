type AuditEvent =
  | 'LOGIN_FAILED'
  | 'LOGIN_SUCCESS'
  | 'TOKEN_REFRESH'
  | 'TOKEN_REFRESH_FAILED'
  | 'LOGOUT'
  | 'PROFESSOR_CODE_GENERATED'
  | 'PROFESSOR_CODE_REDEEMED'
  | 'PROFESSOR_CODE_REDEMPTION_FAILED'
  | 'PROFESSOR_CODE_REVOKED'
  | 'PROFESSOR_LINK_CREATED'
  | 'PROFESSOR_LINK_REVOKED'
  | 'PROFESSOR_LOGIN'
  | 'PROFESSOR_VIEW_DASHBOARD'
  | 'PROFESSOR_VIEW_LOGS';

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
