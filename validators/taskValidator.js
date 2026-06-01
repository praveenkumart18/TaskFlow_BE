const { body, param } = require('express-validator');

const isEmailOrMongoId = (value) => {
  const emailPattern = /^\S+@\S+\.\S+$/;
  const mongoIdPattern = /^[a-f\d]{24}$/i;
  return emailPattern.test(value) || mongoIdPattern.test(value);
};

const USER_STATUS_VALUES = ['In Progress', 'On Hold', 'In Review', 'Completed', 'Cancelled', 'Achieved'];

const mongoIdParamValidator = [
  param('id').isMongoId().withMessage('Invalid task id')
];

const createTaskValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 120 })
    .withMessage('Title must be between 3 and 120 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 5, max: 1000 })
    .withMessage('Description must be between 5 and 1000 characters'),
  body('assignedTo')
    .isArray({ min: 1 })
    .withMessage('Assign at least one user'),
  body('assignedTo.*')
    .trim()
    .custom(isEmailOrMongoId)
    .withMessage('Each assigned user must be a valid email or user id')
];

const updateTaskValidator = [
  ...mongoIdParamValidator,
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ min: 3, max: 120 })
    .withMessage('Title must be between 3 and 120 characters'),
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty')
    .isLength({ min: 5, max: 1000 })
    .withMessage('Description must be between 5 and 1000 characters'),
  body('assignedTo')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Assign at least one user'),
  body('assignedTo.*')
    .optional()
    .trim()
    .custom(isEmailOrMongoId)
    .withMessage('Each assigned user must be a valid email or user id')
];

const updateTaskStatusValidator = [
  ...mongoIdParamValidator,
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(USER_STATUS_VALUES)
    .withMessage(`Status must be one of: ${USER_STATUS_VALUES.join(', ')}`)
];

const addTaskMessageValidator = [
  ...mongoIdParamValidator,
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters')
];

module.exports = {
  mongoIdParamValidator,
  createTaskValidator,
  updateTaskValidator,
  updateTaskStatusValidator,
  addTaskMessageValidator
};
