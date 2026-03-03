import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error-handler';

type Feature =
  | 'view_students'
  | 'view_logs'
  | 'approve_logs'
  | 'export_reports'
  | 'session_management'
  | 'multi_admin'
  | 'advanced_analytics'
  | 'bulk_export'
  | 'api_access';

const PLAN_FEATURES: Record<string, Feature[]> = {
  FREE: ['view_students', 'view_logs'],
  PRO: [
    'view_students',
    'view_logs',
    'approve_logs',
    'export_reports',
    'session_management',
  ],
  ENTERPRISE: [
    'view_students',
    'view_logs',
    'approve_logs',
    'export_reports',
    'session_management',
    'multi_admin',
    'advanced_analytics',
    'bulk_export',
    'api_access',
  ],
};

export async function hasFeature(userId: string, feature: Feature): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      studentIdentity: {
        include: {
          institution: {
            include: { subscription: true },
          },
        },
      },
    },
  });

  if (!user) return false;

  const subscription = user.studentIdentity.institution.subscription;
  const plan = subscription?.status === 'ACTIVE' ? subscription.plan : 'FREE';
  const features = PLAN_FEATURES[plan] || PLAN_FEATURES.FREE;

  return features.includes(feature);
}

export function requireFeature(feature: Feature) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        throw new AppError(401, 'Authentication required');
      }

      const allowed = await hasFeature(req.userId, feature);
      if (!allowed) {
        throw new AppError(403, `Feature '${feature}' requires a higher subscription plan`);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
