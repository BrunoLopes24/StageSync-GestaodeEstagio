type AuditEvent =
  | 'LOGIN_FAILED'
  | 'LOGIN_SUCCESS'
  | 'TOKEN_REFRESH'
  | 'TOKEN_REFRESH_FAILED'
  | 'LOGOUT';

interface AuditData {
  userId?: string;
  identifier?: string;
  ip?: string;
  userAgent?: string;
  reason?: string;
  isNewAccount?: boolean;
}

export function auditLog(event: AuditEvent, data: AuditData): void {
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    ...data,
  };
  console.log(JSON.stringify(entry));
}
