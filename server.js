// TOP OF THE FILE BEFORE ANY OTHER IMPORT
import dns from 'dns';
dns.setServers(['1.1.1.1', '8.8.8.8']); // Overrides system DNS with Cloudflare & Google DNS
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

io.on('connection', (socket) => {
  console.log('User connected connected to sockets:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected from sockets');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));