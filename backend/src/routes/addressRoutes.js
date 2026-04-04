import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import addressController from '../controllers/addressController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Address routes
router.get('/', (req, res, next) => addressController.getAddresses(req, res, next)); // Get all addresses 
router.post('/', (req, res, next) => addressController.addAddress(req, res, next)); // Add new address
router.put('/:addressId', (req, res, next) => addressController.updateAddress(req, res, next)); // Update existing address
router.delete('/:addressId', (req, res, next) => addressController.deleteAddress(req, res, next)); // Delete address
router.patch('/:addressId/default', (req, res, next) => addressController.setDefaultAddress(req, res, next)); // Set default address

export default router;
