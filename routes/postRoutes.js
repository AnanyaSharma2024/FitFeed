import express from 'express';
import { createPost, getFeed, likePost, addComment, logWater, getLeaderboard, handleAIChat } from '../controllers/postController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
// Add this line under your postRoutes.js:
import { getComparisonData } from '../controllers/postController.js';

const router = express.Router();

router.post('/', protect, upload.single('image'), createPost);
router.get('/', protect, getFeed);
router.post('/:id/like', protect, likePost);
router.post('/:id/comment', protect, addComment);
router.post('/water', protect, logWater);
router.get('/leaderboard', protect, getLeaderboard);
router.post('/chat', protect, handleAIChat);
router.get('/compare/:friendId', protect, getComparisonData);

export default router;