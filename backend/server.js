const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const port = 5000;
mongoose.set('strictQuery', false);
app.use(cors());
app.use(express.static('images'));
app.use(express.json());

mongoose
  .connect('mongodb://localhost/Blog', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

const blogSchema = new mongoose.Schema({
  title: String,
  content: String,
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  usersName: String,
});

const Blog = mongoose.model('Blog', blogSchema);
const User = mongoose.model('User', userSchema);

app.get('/api/blog', async (req, res) => {
  try {
    const blogPosts = await Blog.find();
    res.json(blogPosts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch blog posts' });
  }
});

app.post('/api/blog', async (req, res) => {
  try {
    const { title, content } = req.body;
    const newBlogPost = new Blog({ title, content });
    await newBlogPost.save();
    res.status(201).json(newBlogPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create blog post' });
  }
});

app.put('/api/blog/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const updatedBlogPost = await Blog.findByIdAndUpdate(
      id,
      { title, content },
      { new: true }
    );
    res.json(updatedBlogPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update blog post' });
  }
});

app.delete('/api/blog/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Blog.findByIdAndDelete(id);
    res.json({ message: 'Blog post deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete blog post' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    let isPasswordMatch = false;
    if (user.password.startsWith('$2b$')) {
      // Hashed password
      isPasswordMatch = await bcrypt.compare(password, user.password);
    } else {
      // Plain text password
      isPasswordMatch = password === user.password;
    }

    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, 'your-secret-key', {
      expiresIn: '1h',
    });

    res.json({ token, usersName: user.usersName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to login' });
  }
});

app.post('/api/signup', async (req, res) => {
  try {
    const { username, password, usersName } = req.body;
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, usersName });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to signup' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
