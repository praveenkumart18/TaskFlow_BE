const express = require('express');
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  addTaskMessage,
  deleteTask
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const validate = require('../middleware/validationMiddleware');
const {
  mongoIdParamValidator,
  createTaskValidator,
  updateTaskValidator,
  updateTaskStatusValidator,
  addTaskMessageValidator
} = require('../validators/taskValidator');

const router = express.Router();

router.use(protect);

router.route('/').post(authorizeRoles('admin'), createTaskValidator, validate, createTask).get(getTasks);
router
  .route('/:id')
  .get(mongoIdParamValidator, validate, getTaskById)
  .put(updateTaskValidator, validate, updateTask)
  .delete(mongoIdParamValidator, validate, deleteTask);
router.patch('/:id/status', updateTaskStatusValidator, validate, updateTaskStatus);
router.post('/:id/messages', addTaskMessageValidator, validate, addTaskMessage);

module.exports = router;
