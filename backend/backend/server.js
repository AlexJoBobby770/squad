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


    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }


    const passwordHash = await bcrypt.hash(password, 10);


    const user = new User({ name, email, passwordHash });
    await user.save();

 
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({ token, message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;


    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

 
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

  
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({ token, message: "Login successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


app.get("/api/posts", authenticateToken, async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


app.post("/api/posts", authenticateToken, async (req, res) => {
  try {
    const { content, imageURL } = req.body;
    const user = await User.findById(req.user.id);

    const post = new Post({
      content,
      imageURL,
      author: user.name,
      userId: req.user.id
    });

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


app.get("/api/tasks", authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


app.post("/api/tasks", authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    const task = new Task({
      name,
      userId: req.user.id
    });

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


app.put("/api/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const { completed } = req.body;
    
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

    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));