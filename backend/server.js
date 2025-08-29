const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import models
const User = require('./models/user');
const Post = require('./models/post');
const Task = require('./models/tasks');

const app = express();

// ===== BASIC SETUP =====
app.use(cors());
app.use(express.json());

// ===== DATABASE CONNECTION =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ===== HELPER FUNCTIONS =====
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// ===== ROUTES =====

// Home page
app.get("/", (req, res) => {
  res.send("SquadBoard Backend Running ✅");
});

// ===== AUTH ROUTES =====

// Register
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user exists
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create user
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, passwordHash });
    await user.save();

    // Send token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, message: "User registered successfully" });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Send token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, message: "Login successful" });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== POST ROUTES =====

// Get all posts
app.get("/api/posts", authenticateToken, async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create post
app.post("/api/posts", authenticateToken, async (req, res) => {
  try {
    const { content, imageURL } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) return res.status(404).json({ message: "User not found" });

    const post = new Post({
      content: content || '',
      imageURL: imageURL || '',
      author: user.name,
      userId: req.user.id
    });

    await post.save();
    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== TASK ROUTES =====

// Get user's tasks
app.get("/api/tasks", authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create task
app.post("/api/tasks", authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name?.trim()) {
      return res.status(400).json({ message: "Task name is required" });
    }

    const task = new Task({ name: name.trim(), userId: req.user.id });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update task
app.put("/api/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const { completed } = req.body;
    
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { completed },
      { new: true }
    );

    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete task
app.delete("/api/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});