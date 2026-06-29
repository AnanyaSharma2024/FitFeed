import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePhoto: { type: String, default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200' },
  weight: { type: Number, default: 70 },
  height: { type: Number, default: 170 },
  goal: { type: String, enum: ['Loss', 'Gain', 'Maintain'], default: 'Maintain' },
  waterLogs: { type: Number, default: 0 }, // Daily target tracking
  streakCount: { type: Number, default: 1 },
  lastActive: { type: Date, default: Date.now },
  healthyScore: { type: Number, default: 50 } // Consistency rating
}, { timestamps: true });

export default mongoose.model('User', UserSchema);