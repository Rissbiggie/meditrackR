import { Router } from 'express';
import { isAuthenticated, loginRateLimiter } from '../middleware/authMiddleware';
import { 
  register,
  getCurrentUser,
  updateUserProfile,
  logout,
  getAdminUsers,
  setUserAsAdmin
} from '../controllers/userController';
import passport from 'passport';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', loginRateLimiter, passport.authenticate('local'), getCurrentUser);
router.post('/logout', logout);

// Protected routes
router.get('/', isAuthenticated, getCurrentUser);
router.patch('/profile', isAuthenticated, updateUserProfile);

// Admin related routes
router.get('/admins', isAuthenticated, getAdminUsers);
router.post('/make-admin', isAuthenticated, setUserAsAdmin);

export default router;