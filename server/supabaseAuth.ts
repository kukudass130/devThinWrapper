import type { Express, RequestHandler } from "express";
import { createClient } from '@supabase/supabase-js';

// Supabase configuration for server-side
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://strjiukfgtwzonucwmec.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0cmppdWtmZ3R3em9udWN3bWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5ODYyMjYsImV4cCI6MjA2MzU2MjIyNn0.yuFp4Lmn03TqA4VRQpXPbBsaP-5bzFLPjHSAR9kjg9E';

// Server-side Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export function setupAuth(app: Express) {
  // CORS for Supabase auth
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
}

// Middleware to verify Supabase JWT token
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    // Add user to request object
    req.user = {
      id: user.id,
      email: user.email,
      claims: {
        sub: user.id,
        email: user.email,
        first_name: user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0],
        last_name: user.user_metadata?.last_name || user.user_metadata?.name?.split(' ')[1],
        profile_image_url: user.user_metadata?.avatar_url,
      }
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: "Unauthorized: Token verification failed" });
  }
};

// Development mode - bypass auth for testing
export const isAuthenticatedDev: RequestHandler = (req, res, next) => {
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
    // Mock user for development
    req.user = {
      id: 'dev-user-id',
      email: 'dev@example.com',
      claims: {
        sub: 'dev-user-id',
        email: 'dev@example.com',
        first_name: 'Dev',
        last_name: 'User',
        profile_image_url: null,
      }
    };
    return next();
  }
  
  return isAuthenticated(req, res, next);
}; 