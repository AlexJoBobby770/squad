const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/user');
const Post = require('./models/post');
const Task = require('./models/task');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch((err) => console.error("MongoDB connection error:", err));

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

app.get("/", (req, res) => res.send("SquadBoard Backend Running ✅"));

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({ name, email, passwordHash });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, message: "User registered successfully" });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, message: "Login successful" });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/posts", authenticateToken, async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    
    // Transform posts to include 'image' field for frontend compatibility
    const transformedPosts = posts.map(post => ({
      ...post.toObject(),
      image: post.imageURL // Map imageURL to image for frontend
    }));
    
    res.json(transformedPosts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/posts", authenticateToken, async (req, res) => {
  try {
    const { content, imageURL } = req.body;
    
    // Validate that at least content or imageURL is provided
    if (!content && !imageURL) {
      return res.status(400).json({ message: "Content or image is required" });
    }
    
    // Validate content length
    if (content && content.length > 500) {
      return res.status(400).json({ message: "Content cannot exceed 500 characters" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const post = new Post({
      content: content || '',
      imageURL: imageURL || '',
      author: user.name,
      userId: req.user.id
    });

    await post.save();
    
    // Transform the response to include 'image' field
    const responsePost = {
      ...post.toObject(),
      image: post.imageURL
    };
    
    res.status(201).json(responsePost);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/tasks", authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/tasks", authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Task name is required" });
    }

    const task = new Task({
      name: name.trim(),
      userId: req.user.id
    });

    await task.save();
    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const { completed } = req.body;
    
    if (typeof completed !== 'boolean') {
      return res.status(400).json({ message: "Completed must be a boolean" });
    }
    
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { completed },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: "Server error" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));