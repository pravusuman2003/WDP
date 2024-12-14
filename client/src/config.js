const config = {
  BACKEND_URL: process.env.NODE_ENV === 'production' 
    ? 'https://your-backend-vercel-url.vercel.app' 
    : 'http://localhost:4000',
  WS_URL: process.env.NODE_ENV === 'production'
    ? 'wss://your-backend-vercel-url.vercel.app'
    : 'ws://localhost:4000',
};

export default config; 