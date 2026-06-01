const Task = require('../models/Task');
const User = require('../models/User');
const mongoose = require('mongoose');

const populateTask = (query) =>
  query
    .populate('createdBy', 'name email role')
    .populate('assignments.user', 'name email role')
    .populate('messages.sender', 'name email role');

const isAssignedUser = (user, task) =>
  task.assignments.some((assignment) => {
    const assignedId = assignment.user._id || assignment.user;
    return assignedId.equals(user._id);
  });

const getUserAssignment = (user, task) =>
  task.assignments.find((assignment) => {
    const assignedId = assignment.user._id || assignment.user;
    return assignedId.equals(user._id);
  });

const canViewTask = (user, task) => user.role === 'admin' || isAssignedUser(user, task);
const canMessageTask = canViewTask;

const ensureAssignedUsersExist = async (assignedTo) => {
  const identifiers = [...new Set(assignedTo.map((value) => String(value).trim().toLowerCase()))];
  const ids = identifiers.filter((value) => mongoose.Types.ObjectId.isValid(value));
  const emails = identifiers.filter((value) => !mongoose.Types.ObjectId.isValid(value));
  const users = await User.find({
    role: 'user',
    $or: [
      ...(ids.length ? [{ _id: { $in: ids } }] : []),
      ...(emails.length ? [{ email: { $in: emails } }] : [])
    ]
  }).select('_id email');

  const matchedIdentifiers = new Set();
  users.forEach((user) => {
    matchedIdentifiers.add(String(user._id).toLowerCase());
    matchedIdentifiers.add(user.email.toLowerCase());
  });

  const missingUsers = identifiers.filter((value) => !matchedIdentifiers.has(value));

  if (missingUsers.length) {
    const error = new Error('One or more assigned users were not found');
    error.statusCode = 400;
    throw error;
  }

  return users;
};

const buildAssignments = (users, existingAssignments = []) => {
  const statusByUser = new Map(
    existingAssignments.map((assignment) => [String(assignment.user._id || assignment.user), assignment.status])
  );

  return users.map((user) => ({
    user: user._id,
    status: statusByUser.get(String(user._id)) || 'Draft'
  }));
};

const createTask = async (req, res, next) => {
  try {
    const { title, description, assignedTo } = req.body;
    const assignees = await ensureAssignedUsersExist(assignedTo);

    const task = await Task.create({
      title,
      description,
      assignments: buildAssignments(assignees),
      createdBy: req.user._id
    });

    const populatedTask = await populateTask(Task.findById(task._id));

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task: populatedTask }
    });
  } catch (error) {
    next(error);
  }
};

const getTasks = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      await Task.updateMany(
        { 'assignments.user': req.user._id, 'assignments.status': 'Draft' },
        { $set: { 'assignments.$[assignment].status': 'Open' } },
        { arrayFilters: [{ 'assignment.user': req.user._id, 'assignment.status': 'Draft' }] }
      );
    }

    const query = req.user.role === 'admin' ? {} : { 'assignments.user': req.user._id };
    const tasks = await populateTask(Task.find(query)).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Tasks fetched successfully',
      data: { tasks }
    });
  } catch (error) {
    next(error);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const task = await populateTask(Task.findById(req.params.id));

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (!canViewTask(req.user, task)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const assignment = getUserAssignment(req.user, task);
    if (req.user.role !== 'admin' && assignment.status === 'Draft') {
      assignment.status = 'Open';
      await task.save();
      await task.populate('createdBy', 'name email role');
      await task.populate('assignments.user', 'name email role');
      await task.populate('messages.sender', 'name email role');
    }

    res.status(200).json({
      success: true,
      message: 'Task fetched successfully',
      data: { task }
    });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (req.body.assignedTo) {
      const assignees = await ensureAssignedUsersExist(req.body.assignedTo);
      task.assignments = buildAssignments(assignees, task.assignments);
    }

    const allowedFields = ['title', 'description'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    });

    await task.save();
    const populatedTask = await populateTask(Task.findById(task._id));

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: { task: populatedTask }
    });
  } catch (error) {
    next(error);
  }
};

const updateTaskStatus = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (!isAssignedUser(req.user, task)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const assignment = getUserAssignment(req.user, task);
    assignment.status = req.body.status;
    await task.save();

    const populatedTask = await populateTask(Task.findById(task._id));

    res.status(200).json({
      success: true,
      message: 'Task status updated successfully',
      data: { task: populatedTask }
    });
  } catch (error) {
    next(error);
  }
};

const addTaskMessage = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (!canMessageTask(req.user, task)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    task.messages.push({
      sender: req.user._id,
      message: req.body.message
    });

    await task.save();
    const populatedTask = await populateTask(Task.findById(task._id));

    res.status(201).json({
      success: true,
      message: 'Message added successfully',
      data: { task: populatedTask }
    });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: { taskId: req.params.id }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  addTaskMessage,
  deleteTask
};
