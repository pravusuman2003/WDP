export default {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  PORT: process.env.PORT || 4000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development'
}; 