require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is required. Add it to your .env file.');
  process.exit(1);
}

connectDB();

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});

process.on('unhandledRejection', (error) => {
  console.error(`Unhandled rejection: ${error.message}`);
  server.close(() => process.exit(1));
});
