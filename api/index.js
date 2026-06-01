require('dotenv').config();
const app = require('../app');
const connectDB = require('../config/db');

let connectionPromise;

if (!connectionPromise) {
  connectionPromise = connectDB();
}

module.exports = async (req, res) => {
  await connectionPromise;
  return app(req, res);
};
