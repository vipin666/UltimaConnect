import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import MemoryStore from "memorystore";
import { storage } from "./storage";
import { hashPassword, comparePasswords } from "./auth";
import { Strategy as LocalStrategy } from "passport-local";

const MemoryStoreSession = MemoryStore(session);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const sessionStore = new MemoryStoreSession({
    checkPeriod: 86400000, // prune expired entries every 24h
    ttl: sessionTtl,
  });
  
  return session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Configure local strategy
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username.toLowerCase());
      
      if (!user) {
        return done(null, false, { message: 'Invalid username or password' });
      }
      
      if (user.status !== 'active') {
        return done(null, false, { message: 'Account is not active. Please contact administrator.' });
      }
      
      const isValidPassword = await comparePasswords(password, user.password);
      
      if (!isValidPassword) {
        return done(null, false, { message: 'Invalid username or password' });
      }
      
      return done(null, user);
    } catch (error) {
      console.error('Authentication error:', error);
      return done(error);
    }
  }));

  // Local authentication routes
  app.post("/api/auth/login", async (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: 'Authentication failed' });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || 'Invalid credentials' });
      }
      
      req.logIn(user, (err: any) => {
        if (err) {
          return res.status(500).json({ message: 'Login failed' });
        }
        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, firstName, lastName, email, unitNumber } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Create user with pending status (requires admin approval)
      const userData = {
        username: username.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        email,
        unitNumber,
        role: 'resident' as const,
        status: 'pending' as const,
        isOwner: true,
      };
      
      const user = await storage.createUser(userData);
      
      res.status(201).json({ 
        message: 'Registration successful. Please wait for admin approval.',
        user: { 
          id: user.id, 
          username: user.username, 
          firstName: user.firstName, 
          lastName: user.lastName,
          status: user.status 
        } 
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  app.get("/api/auth/user", async (req: any, res) => {
    try {
      if (req.isAuthenticated() && req.user) {
        res.json(req.user);
      } else {
        res.status(401).json({ message: 'Unauthorized' });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  app.get("/api/auth/logout", (req, res) => {
    req.logout(() => {
      // Clear the session cookie
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Add a route to clear all sessions (for testing)
  app.get("/api/auth/clear-sessions", (req, res) => {
    if (req.sessionStore && typeof req.sessionStore.clear === 'function') {
      req.sessionStore.clear((err) => {
        if (err) {
          console.error('Error clearing sessions:', err);
          return res.status(500).json({ message: 'Failed to clear sessions' });
        }
        res.json({ message: 'All sessions cleared successfully' });
      });
    } else {
      res.json({ message: 'Session store does not support clearing' });
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
};
