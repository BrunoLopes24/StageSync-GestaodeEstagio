import type { WorkLogType } from '@prisma/client';

export function createMockStudent(overrides: Partial<any> = {}) {
  return {
    id: 'student-1',
    email: 'student@school.pt',
    role: 'STUDENT',
    passwordHash: 'hashed-password',
    studentIdentityId: 'identity-1',
    studentIdentity: {
      id: 'identity-1',
      studentNumber: '20201234',
      institutionalEmail: 'student@school.pt',
      isActive: true,
      needsPasswordSetup: false,
      institution: {
        id: 'inst-1',
        domain: 'school.pt',
        isActive: true,
      },
    },
    ...overrides,
  };
}

export function createMockProfessor(overrides: Partial<any> = {}) {
  return {
    id: 'prof-1',
    email: 'professor@school.pt',
    role: 'PROFESSOR',
    passwordHash: 'hashed-professor-password',
    studentIdentityId: null,
    ...overrides,
  };
}

export function createMockWorkLog(overrides: Partial<any> = {}) {
  const type: WorkLogType = overrides.type ?? 'NORMAL';

  return {
    id: 'log-1',
    date: new Date('2026-03-01T00:00:00.000Z'),
    type,
    startTime: type === 'NORMAL' ? '09:00' : null,
    endTime: type === 'NORMAL' ? '17:00' : null,
    lunchStart: type === 'NORMAL' ? '12:30' : null,
    lunchEnd: type === 'NORMAL' ? '13:30' : null,
    calculatedHours: type === 'NORMAL' ? 7 : 0,
    company: 'StageSync',
    taskDescription: 'Implemented API endpoints',
    justification: type === 'JUSTIFIED_ABSENCE' ? 'Medical appointment' : null,
    userId: 'student-1',
    createdAt: new Date('2026-03-01T00:00:00.000Z'),
    updatedAt: new Date('2026-03-01T00:00:00.000Z'),
    ...overrides,
  };
}
