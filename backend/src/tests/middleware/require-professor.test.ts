import { requireProfessor, assertProfessorOwnsStudent } from '../../middleware/require-professor';
import { prismaMock } from '../mocks/prisma.mock';
import { AppError } from '../../middleware/error-handler';

describe('require-professor middleware', () => {
  const next = jest.fn();

  beforeEach(() => {
    next.mockReset();
  });

  it('loads supervised students for professor', async () => {
    prismaMock.professorStudentLink.findMany.mockResolvedValue([
      { studentId: 'student-1' },
      { studentId: 'student-2' },
    ] as any);

    const req = { userRole: 'PROFESSOR', userId: 'prof-1' } as any;

    await requireProfessor(req, {} as any, next);

    expect(req.supervisedStudentIds).toEqual(['student-1', 'student-2']);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects professor with no links', async () => {
    prismaMock.professorStudentLink.findMany.mockResolvedValue([] as any);

    const req = { userRole: 'PROFESSOR', userId: 'prof-1' } as any;
    await requireProfessor(req, {} as any, next);

    const err = next.mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe('No active supervision links');
  });

  it('rejects non-professor role', async () => {
    const req = { userRole: 'STUDENT', userId: 'student-1' } as any;
    await requireProfessor(req, {} as any, next);

    const err = next.mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe('Professor access required');
  });

  it('rejects unauthorized student access', () => {
    const req = { supervisedStudentIds: ['student-1'] } as any;

    expect(() => assertProfessorOwnsStudent(req, 'student-2')).toThrow('You do not have access to this student');
  });

  it('allows authorized student access', () => {
    const req = { supervisedStudentIds: ['student-1'] } as any;
    expect(() => assertProfessorOwnsStudent(req, 'student-1')).not.toThrow();
  });

  it('forwards database errors', async () => {
    const req = { userRole: 'PROFESSOR', userId: 'prof-1' } as any;
    const err = new Error('db failed');
    prismaMock.professorStudentLink.findMany.mockRejectedValue(err);

    await requireProfessor(req, {} as any, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});
