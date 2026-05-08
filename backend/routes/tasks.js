const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');
 
// Helper: check project membership
const checkMembership = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return null;
  const member = project.members.find(m => m.user.toString() === userId.toString());
  return member ? { project, role: member.role } : null;
};
 
// GET /api/tasks?project=id - Get tasks for a project
router.get('/', protect, async (req, res) => {
  try {
    const { project, status, assignedTo, priority } = req.query;
    if (!project) return res.status(400).json({ message: 'Project ID required' });
 
    const membership = await checkMembership(project, req.user._id);
    if (!membership) return res.status(403).json({ message: 'Access denied' });
 
    const filter = { project };
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (priority) filter.priority = priority;
 
    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
 
// POST /api/tasks - Create task
router.post('/', protect, [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('project').notEmpty().withMessage('Project ID required'),
  body('status').optional().isIn(['todo', 'in-progress', 'review', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
 
  try {
    const membership = await checkMembership(req.body.project, req.user._id);
    if (!membership) return res.status(403).json({ message: 'Access denied' });
 
    const task = await Task.create({ ...req.body, createdBy: req.user._id });
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
 
// GET /api/tasks/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name');
    if (!task) return res.status(404).json({ message: 'Task not found' });
 
    const membership = await checkMembership(task.project._id, req.user._id);
    if (!membership) return res.status(403).json({ message: 'Access denied' });
 
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
 
// PUT /api/tasks/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
 
    const membership = await checkMembership(task.project, req.user._id);
    if (!membership) return res.status(403).json({ message: 'Access denied' });
 
    // Members can only update status of their assigned tasks; admins can update anything
    if (membership.role === 'member' && req.user.role !== 'admin') {
      if (task.assignedTo?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Can only update your assigned tasks' });
      }
      // Members can only change status
      const { status } = req.body;
      const updated = await Task.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true })
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');
      return res.json(updated);
    }
 
    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
 
// DELETE /api/tasks/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
 
    const membership = await checkMembership(task.project, req.user._id);
    if (!membership) return res.status(403).json({ message: 'Access denied' });
 
    // Only admin or task creator can delete
    if (req.user.role !== 'admin' && task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }
 
    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
 
// GET /api/tasks/my/assigned - Get current user's assigned tasks
router.get('/my/assigned', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate('project', 'name')
      .populate('createdBy', 'name')
      .sort({ dueDate: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
 
module.exports = router;