const express = require('express');
const { register, login, getMe, getUsers } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const validate = require('../middleware/validationMiddleware');
const { registerValidator, loginValidator } = require('../validators/authValidator');

const router = express.Router();

router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.get('/me', protect, getMe);
router.get('/users', protect, authorizeRoles('admin'), getUsers);

module.exports = router;
