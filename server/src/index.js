import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { PubSub } from 'graphql-subscriptions';
import dotenv from 'dotenv';
import cors from 'cors';

import typeDefs from './graphql/typeDefs.js';
import resolvers from './graphql/resolvers.js';
import { authenticateUser } from './middleware/auth.js';

dotenv.config();

const app = express();

// Add CORS middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.CLIENT_URL]
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const pubsub = new PubSub();

const schema = makeExecutableSchema({ typeDefs, resolvers });

// Create Apollo Server
const apolloServer = new ApolloServer({
  schema,
  context: ({ req }) => ({
    user: authenticateUser(req),
    pubsub
  }),
  formatError: (error) => {
    console.error('GraphQL Error:', error);
    return error;
  },
  plugins: [
    {
      async serverWillStart() {
        console.log('Server starting up!');
      },
    },
  ],
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Start server
const startServer = async () => {
  await apolloServer.start();
  
  apolloServer.applyMiddleware({ 
    app,
    cors: false, // We're handling CORS with the express middleware
    path: '/graphql'
  });

  const httpServer = createServer(app);
  
  // Set up WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql'
  });

  useServer(
    { 
      schema,
      context: (ctx) => {
        // Add authentication here if needed
        return { pubsub };
      },
      onConnect: async (ctx) => {
        console.log('Client connected');
      },
      onDisconnect(ctx, code, reason) {
        console.log('Client disconnected:', code, reason);
      },
    }, 
    wsServer
  );

  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}${apolloServer.graphqlPath}`);
    console.log(`WebSocket endpoint: ws://localhost:${PORT}${apolloServer.graphqlPath}`);
  });
};

startServer().catch(err => {
  console.error('Error starting server:', err);
}); 