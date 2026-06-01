const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Management System API',
      version: '1.0.0',
      description: 'MERN stack task management API with JWT authentication and role-based access control.'
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        RegisterInput: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'Asha Sharma' },
            email: { type: 'string', example: 'asha@example.com' },
            password: { type: 'string', example: 'Password123' },
            role: { type: 'string', enum: ['admin', 'user'], example: 'user' },
            adminCode: { type: 'string', example: 'change_me_admin_code' }
          }
        },
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', example: 'asha@example.com' },
            password: { type: 'string', example: 'Password123' }
          }
        },
        TaskInput: {
          type: 'object',
          required: ['title', 'description', 'assignedTo'],
          properties: {
            title: { type: 'string', example: 'Prepare sprint plan' },
            description: { type: 'string', example: 'Create stories, estimates, and sprint goals.' },
            assignedTo: {
              type: 'array',
              items: { type: 'string' },
              example: ['riya@example.com', 'amit@example.com']
            }
          }
        },
        StatusInput: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['In Progress', 'On Hold', 'In Review', 'Completed', 'Cancelled', 'Achieved'],
              example: 'In Progress'
            }
          }
        },
        MessageInput: {
          type: 'object',
          required: ['message'],
          properties: {
            message: { type: 'string', example: 'I have completed the first draft.' }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js', './app.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
