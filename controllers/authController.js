import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cloudinary from '../config/cloudinary.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};
// Add this export function inside controllers/authController.js
export const getFriendsList = async (req, res) => {
  try {
    // Fetches all users from DB except the logged-in user
    const users = await User.find({ _id: { $ne: req.user.id } })
      .select('name profilePhoto healthyScore streakCount goal weight height lastActive waterLogs');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving active peer records.' });
  }
};
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User registration failed. Email already registered.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePhoto: user.profilePhoto,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      // Calculate Active Streak Progression
      const today = new Date().setHours(0, 0, 0, 0);
      const lastActiveDate = new Date(user.lastActive).setHours(0, 0, 0, 0);
      const diffTime = Math.abs(today - lastActiveDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        user.streakCount += 1;
      } else if (diffDays > 1) {
        user.streakCount = 1;
      }
      user.lastActive = Date.now();
      await user.save();

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePhoto: user.profilePhoto,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Authentication failed. Invalid email or password.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error during login.' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Unable to retrieve user details.' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.name = req.body.name || user.name;
      user.weight = req.body.weight || user.weight;
      user.height = req.body.height || user.height;
      user.goal = req.body.goal || user.goal;

      const updatedUser = await user.save();
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User context not found.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating user details.' });
  }
};

export const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please select a valid image file.' });
    }

    const uploadFromBuffer = () => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'profiles' },
          (error, result) => {
            if (result) resolve(result.secure_url);
            else reject(error);
          }
        );
        stream.end(req.file.buffer);
      });
    };

    const imageUrl = await uploadFromBuffer();
    const user = await User.findById(req.user.id);
    user.profilePhoto = imageUrl;
    await user.save();

    res.json({ profilePhoto: imageUrl });
  } catch (error) {
    res.status(500).json({ message: 'Profile photo upload failed.', error: error.message });
  }
};