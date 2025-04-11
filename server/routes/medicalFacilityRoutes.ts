import { Router } from 'express';
import { 
  getAllMedicalFacilities,
  getMedicalFacilityById,
  getNearbyMedicalFacilities
} from '../controllers/medicalFacilityController';

const router = Router();

// Get all medical facilities
router.get('/', getAllMedicalFacilities);

// Get nearby medical facilities
router.get('/nearby', getNearbyMedicalFacilities);

// Get specific medical facility by ID
router.get('/:id', getMedicalFacilityById);

export default router;