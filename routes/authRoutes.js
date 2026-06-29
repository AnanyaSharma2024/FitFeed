import express from 'express';
import { registerUser, loginUser, getProfile, updateProfile, uploadProfilePhoto } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
// Add this line under your authRoutes.js:
import { getFriendsList } from '../controllers/authController.js';
const router = express.Router();

router.post('/signup', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/profile/upload', protect, upload.single('profilePhoto'), uploadProfilePhoto);
router.get('/friends', protect, getFriendsList);

export default router;