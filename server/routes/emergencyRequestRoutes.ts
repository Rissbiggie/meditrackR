import { Router } from 'express';
import { isAuthenticated } from '../middleware/authMiddleware';
import { 
  getAllEmergencyRequests,
  getUserEmergencyRequests,
  getEmergencyRequestById,
  createEmergencyRequest,
  updateEmergencyRequest,
  deleteEmergencyRequest
} from '../controllers/emergencyRequestController';

const router = Router();

// Get all emergency requests (admin only)
router.get('/', isAuthenticated, getAllEmergencyRequests);

// Get user's emergency requests
router.get('/user', isAuthenticated, getUserEmergencyRequests);

// Get specific emergency request
router.get('/:id', isAuthenticated, getEmergencyRequestById);

// Create new emergency request
router.post('/', isAuthenticated, createEmergencyRequest);

// Update emergency request
router.patch('/:id', isAuthenticated, updateEmergencyRequest);

// Delete emergency request
router.delete('/:id', isAuthenticated, deleteEmergencyRequest);

export default router;