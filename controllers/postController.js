import Post from '../models/Post.js';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';

export const createPost = async (req, res) => {
  try {
    const { mealType, caption } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a meal image.' });
    }

    // Generate SHA-256 checksum hash to guarantee 100% duplicate upload consistency
    const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

    let nutrition;
    let imageUrl;

    // Check if duplicate image exists in records
    const existingPost = await Post.findOne({ fileHash });

    if (existingPost) {
      imageUrl = existingPost.image;
      nutrition = {
        foodName: existingPost.foodName,
        calories: existingPost.calories,
        protein: existingPost.protein,
        carbs: existingPost.carbs,
        fat: existingPost.fat,
        fiber: existingPost.fiber,
        sugar: existingPost.sugar,
        vitamins: existingPost.vitamins,
        minerals: existingPost.minerals,
      };
    } else {
      // Clean analysis for fresh uploads
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ message: 'Gemini Configuration Error.' });
      }
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

      const uploadFromBuffer = () => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'meals' },
            (error, result) => {
              if (result) resolve(result.secure_url);
              else reject(error);
            }
          );
          stream.end(req.file.buffer);
        });
      };
      imageUrl = await uploadFromBuffer();

      const imageBase64 = req.file.buffer.toString('base64');
      const imagePart = {
        inlineData: {
          data: imageBase64,
          mimeType: req.file.mimetype,
        },
      };

      const prompt = `Analyze this food image. Provide details in strict valid JSON format with these exact keys. Ensure vitamins and minerals are short, professional descriptions, and macronutrients are numbers:
      {
        "foodName": "name of food item",
        "calories": 250, 
        "protein": 10,
        "carbs": 30,
        "fat": 8,
        "fiber": 3,
        "sugar": 5,
        "vitamins": "Vitamin A, C, B-complex",
        "minerals": "Iron, Calcium, Zinc"
      }
      Do not add extra characters. Returns JSON format only.`;

      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent([prompt, imagePart]);
      const responseText = result.response.text();

      const cleanJSONText = responseText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      nutrition = JSON.parse(cleanJSONText);
    }

    const newPost = await Post.create({
      user: req.user.id,
      image: imageUrl,
      fileHash,
      mealType,
      caption,
      foodName: nutrition.foodName,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      fiber: nutrition.fiber,
      sugar: nutrition.sugar || 0,
      vitamins: nutrition.vitamins || 'Standard vitamins',
      minerals: nutrition.minerals || 'Standard minerals',
    });

    const ratingIncrement = nutrition.protein > 15 ? 5 : 2;
    await User.findByIdAndUpdate(req.user.id, { $inc: { healthyScore: ratingIncrement } });

    const populatedPost = await newPost.populate('user', 'name profilePhoto');
    req.io.emit('newPost', populatedPost);

    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: 'Analysis module failed.', error: error.message });
  }
};

export const getFeed = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'name profilePhoto')
      .populate('comments.user', 'name profilePhoto')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch feeds.' });
  }
};

export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post record not found.' });

    if (post.likes.includes(req.user.id)) {
      post.likes = post.likes.filter((id) => id.toString() !== req.user.id.toString());
    } else {
      post.likes.push(req.user.id);
    }
    await post.save();

    const updatedPost = await Post.findById(req.params.id)
      .populate('user', 'name profilePhoto')
      .populate('comments.user', 'name profilePhoto');

    req.io.emit('postUpdated', updatedPost);
    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: 'Action failed.' });
  }
};

export const addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post record not found.' });

    const comment = {
      user: req.user.id,
      text: req.body.text,
    };
    post.comments.push(comment);
    await post.save();

    const updatedPost = await Post.findById(req.params.id)
      .populate('user', 'name profilePhoto')
      .populate('comments.user', 'name profilePhoto');

    req.io.emit('postUpdated', updatedPost);
    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: 'Unable to publish comment.' });
  }
};

export const logWater = async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.user.id);
    user.waterLogs = amount ? user.waterLogs + amount : user.waterLogs + 250;
    await user.save();
    res.json({ waterLogs: user.waterLogs });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update fluid records.' });
  }
};

// Add this export function inside controllers/postController.js
export const getComparisonData = async (req, res) => {
  try {
    const friendId = req.params.friendId;
    const friend = await User.findById(friendId).select('-password');
    if (!friend) return res.status(404).json({ message: 'Target peer profile not found.' });

    const friendPosts = await Post.find({ user: friendId }).sort({ createdAt: -1 });
    const userPosts = await Post.find({ user: req.user.id }).sort({ createdAt: -1 });

    res.json({
      friend: {
        profile: friend,
        posts: friendPosts
      },
      user: {
        posts: userPosts
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error compiling comparative metrics.' });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const rankings = await User.find({})
      .select('name profilePhoto healthyScore streakCount')
      .sort({ healthyScore: -1 })
      .limit(10);
    res.json(rankings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to extract system rankings.' });
  }
};

export const handleAIChat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'Gemini service offline.' });
    }

    const user = await User.findById(req.user.id);
    const userGoal = user ? user.goal : 'Maintain';

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // AI recommendations strictly adjusted according to selected Goal
    const contextPrompt = `You are the MacroMate Advisor, a professional sports nutritionist. 
    The client's active goal is strictly: ${userGoal}.
    Formulate your advice contextually optimized for this target. Keep your responses compact, completely professional, and do not use emojis. 
    Question: ${message}`;
    
    const responseResult = await model.generateContent(contextPrompt);
    res.json({ reply: responseResult.response.text() });
  } catch (error) {
    res.status(500).json({ message: 'AI chat service failed.' });
  }
};