const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');
 
// GET /api/users - Get all users (admin only)
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admins only' });
    }
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
 
// GET /api/users/search?email=x - Search user by email
router.get('/search', protect, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'Email query required' });
    const user = await User.findOne({ email: email.toLowerCase() }).select('name email role');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
 
// GET /api/users/dashboard - Dashboard stats
router.get('/dashboard', protect, async (req, res) => {
  try {
    const now = new Date();
    const myTasks = await Task.find({ assignedTo: req.user._id })
      .populate('project', 'name');
 
    const stats = {
      total: myTasks.length,
      todo: myTasks.filter(t => t.status === 'todo').length,
      inProgress: myTasks.filter(t => t.status === 'in-progress').length,
      done: myTasks.filter(t => t.status === 'done').length,
      overdue: myTasks.filter(t => t.dueDate && t.dueDate < now && t.status !== 'done').length,
      recentTasks: myTasks.slice(0, 5)
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
 
module.exports = router;