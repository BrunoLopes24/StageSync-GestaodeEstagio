import { Router } from 'express';
import { loginHandler, refreshHandler, logoutHandler } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { loginSchema, refreshSchema, logoutSchema } from '../schemas/auth.schema';
import { loginRateLimiter } from '../middleware/rate-limiter';

const router = Router();

router.post('/login', loginRateLimiter, validate(loginSchema), loginHandler);
router.post('/refresh', validate(refreshSchema), refreshHandler);
router.post('/logout', validate(logoutSchema), logoutHandler);

export default router;
