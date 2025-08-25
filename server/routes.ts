import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { hashPassword, comparePasswords, generateResetToken, getPasswordResetTokenExpiry, isPasswordResetTokenExpired } from "./auth";
import { insertPostSchema, insertCommentSchema, insertBookingSchema, insertGuestNotificationSchema, insertMessageSchema, insertAnnouncementSchema, insertMaintenanceRequestSchema, insertBiometricRequestSchema, insertTenantDocumentSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup local authentication strategy
  passport.use(
    new LocalStrategy(
      { usernameField: 'username', passwordField: 'password' },
      async (username, password, done) => {
        try {
          const user = await storage.getUserByUsername(username.toLowerCase());
          if (!user || !user.password) {
            return done(null, false, { message: 'Invalid username or password' });
          }
          
          const isValidPassword = await comparePasswords(password, user.password);
          if (!isValidPassword) {
            return done(null, false, { message: 'Invalid username or password' });
          }
          
          if (user.status !== 'active') {
            return done(null, false, { message: 'Account is not active. Please contact admin.' });
          }
          
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Auth middleware
  await setupAuth(app);

  // Local authentication routes
  app.post('/api/auth/local/login', (req, res, next) => {
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

  app.post('/api/auth/local/register', async (req, res) => {
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

  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists for security
        return res.json({ message: 'If that email exists, a reset link has been sent.' });
      }
      
      // Generate reset token
      const token = generateResetToken();
      const expiresAt = getPasswordResetTokenExpiry();
      
      await storage.createPasswordResetToken({
        userId: user.id,
        token,
        expiresAt,
        used: false,
      });
      
      // In a real app, you'd send an email here
      console.log(`Password reset token for ${email}: ${token}`);
      
      res.json({ message: 'If that email exists, a reset link has been sent.' });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: 'Failed to process request' });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
      }
      
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken || resetToken.used || isPasswordResetTokenExpired(resetToken.expiresAt)) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }
      
      // Hash new password and update user
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(resetToken.userId, hashedPassword);
      
      // Mark token as used
      await storage.markTokenAsUsed(resetToken.id);
      
      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  });

  app.get('/api/auth/user', async (req: any, res) => {
    try {
      if (req.isAuthenticated() && req.user) {
        // Check if it's a local user or Replit user
        if (req.user.claims) {
          // Replit Auth user
          const userEmail = req.user.claims.email;
          const allUsers = await storage.getAllUsers();
          const user = allUsers.find((u: any) => u.email === userEmail);
          res.json(user || null);
        } else {
          // Local auth user
          res.json(req.user);
        }
      } else {
        res.status(401).json({ message: 'Unauthorized' });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  // Admin user management routes
  app.get('/api/admin/users', async (req: any, res) => {
    try {
      const currentUser = req.user?.claims ? 
        await storage.getUser(req.user.claims.sub) : 
        req.user;
      
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin')) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.post('/api/admin/users', async (req: any, res) => {
    try {
      const currentUser = req.user?.claims ? 
        await storage.getUser(req.user.claims.sub) : 
        req.user;
      
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin')) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      const { username, password, firstName, lastName, email, unitNumber, role, isOwner } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(password || 'Skymax123');
      
      const userData = {
        username: username.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        email,
        unitNumber,
        role: role || 'resident',
        status: 'active' as const,
        isOwner: isOwner ?? true,
      };
      
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  app.patch('/api/admin/users/:userId/status', async (req: any, res) => {
    try {
      const currentUser = req.user?.claims ? 
        await storage.getUser(req.user.claims.sub) : 
        req.user;
      
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin')) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      const { status } = req.body;
      const updatedUser = await storage.updateUserStatus(req.params.userId, status);
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ message: 'Failed to update user status' });
    }
  });

  // Legacy Replit auth routes (keeping for backward compatibility)

  // User management routes (Admin/Super Admin only)
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/users/:userId/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const targetUserId = req.params.userId;
      const { status } = req.body;
      
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const updatedUser = await storage.updateUserStatus(targetUserId, status);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  app.patch('/api/users/:userId/role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const targetUserId = req.params.userId;
      const { role } = req.body;
      
      const user = await storage.getUser(userId);
      
      // Only super admin can change roles
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const updatedUser = await storage.updateUserRole(targetUserId, role);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Post routes
  app.get('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const { type } = req.query;
      
      let posts;
      if (type) {
        posts = await storage.getPostsByType(type as string);
      } else {
        posts = await storage.getAllPosts();
      }
      
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.post('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postData = insertPostSchema.parse({
        ...req.body,
        authorId: userId,
      });
      
      const post = await storage.createPost(postData);
      res.json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid post data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.patch('/api/posts/:postId/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.postId;
      const { status } = req.body;
      
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const post = await storage.updatePostStatus(postId, status);
      res.json(post);
    } catch (error) {
      console.error("Error updating post status:", error);
      res.status(500).json({ message: "Failed to update post status" });
    }
  });

  app.post('/api/posts/:postId/like', isAuthenticated, async (req: any, res) => {
    try {
      const postId = req.params.postId;
      const post = await storage.likePost(postId);
      res.json(post);
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ message: "Failed to like post" });
    }
  });

  // Comment routes
  app.post('/api/posts/:postId/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.postId;
      const commentData = insertCommentSchema.parse({
        ...req.body,
        postId,
        authorId: userId,
      });
      
      const comment = await storage.createComment(commentData);
      res.json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Amenity routes
  app.get('/api/amenities', isAuthenticated, async (req, res) => {
    try {
      const amenities = await storage.getAllAmenities();
      res.json(amenities);
    } catch (error) {
      console.error("Error fetching amenities:", error);
      res.status(500).json({ message: "Failed to fetch amenities" });
    }
  });

  // Booking routes
  app.get('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookings = await storage.getUserBookings(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        userId,
      });
      
      // Check for conflicts
      const existingBookings = await storage.getBookingsByAmenityAndDate(
        bookingData.amenityId,
        bookingData.bookingDate
      );
      
      const hasConflict = existingBookings.some(booking => {
        const startTime = bookingData.startTime;
        const endTime = bookingData.endTime;
        const existingStart = booking.startTime;
        const existingEnd = booking.endTime;
        
        return (startTime < existingEnd && endTime > existingStart);
      });
      
      if (hasConflict) {
        return res.status(400).json({ message: "Time slot is already booked" });
      }
      
      const booking = await storage.createBooking(bookingData);
      res.json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.patch('/api/bookings/:bookingId/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const bookingId = req.params.bookingId;
      const booking = await storage.cancelBooking(bookingId);
      res.json(booking);
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  // Guest notification routes (Enhanced for Watchman features)
  app.get('/api/guest-notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let notifications;
      if (user.role === 'watchman') {
        // Watchman sees all active guest notifications
        notifications = await storage.getAllActiveGuestNotifications();
      } else {
        // Residents see only their own notifications
        notifications = await storage.getUserGuestNotifications(userId);
      }
      
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching guest notifications:", error);
      res.status(500).json({ message: "Failed to fetch guest notifications" });
    }
  });

  app.post('/api/guest-notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'watchman') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const notificationData = insertGuestNotificationSchema.parse(req.body);
      const notification = await storage.createGuestNotification(notificationData);
      res.json(notification);
    } catch (error) {
      console.error("Error creating guest notification:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid notification data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create guest notification" });
    }
  });

  app.patch('/api/guest-notifications/:notificationId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notificationId = req.params.notificationId;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'watchman') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const notification = await storage.updateGuestNotification(notificationId, req.body);
      res.json(notification);
    } catch (error) {
      console.error("Error updating guest notification:", error);
      res.status(500).json({ message: "Failed to update guest notification" });
    }
  });

  app.patch('/api/guest-notifications/:notificationId/approve', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { notificationId } = req.params;
      const { approved, notes } = req.body;
      
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'watchman') {
        return res.status(403).json({ message: "Unauthorized - Watchman access required" });
      }
      
      const updatedNotification = await storage.updateGuestNotification(notificationId, {
        watchmanApproved: approved,
        watchmanNotes: notes,
      });
      
      res.json(updatedNotification);
    } catch (error) {
      console.error("Error updating guest notification:", error);
      res.status(500).json({ message: "Failed to update guest notification" });
    }
  });

  // Messages endpoints
  app.get('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messages = await storage.getUserMessages(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub;
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId,
      });
      
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.patch('/api/messages/:messageId/read', isAuthenticated, async (req: any, res) => {
    try {
      const { messageId } = req.params;
      const message = await storage.markMessageAsRead(messageId);
      res.json(message);
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // Announcements endpoints
  app.get('/api/announcements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const announcements = await storage.getAnnouncementsForRole(user.role);
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.post('/api/announcements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const announcementData = insertAnnouncementSchema.parse({
        ...req.body,
        authorId: userId,
      });
      
      const announcement = await storage.createAnnouncement(announcementData);
      res.json(announcement);
    } catch (error) {
      console.error("Error creating announcement:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid announcement data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create announcement" });
    }
  });

  // Maintenance requests endpoints
  app.get('/api/maintenance-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let requests;
      if (user.role === 'admin' || user.role === 'super_admin') {
        requests = await storage.getAllMaintenanceRequests();
      } else {
        requests = await storage.getUserMaintenanceRequests(userId);
      }
      
      res.json(requests);
    } catch (error) {
      console.error("Error fetching maintenance requests:", error);
      res.status(500).json({ message: "Failed to fetch maintenance requests" });
    }
  });

  app.post('/api/maintenance-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const requestData = insertMaintenanceRequestSchema.parse({
        ...req.body,
        userId,
        unitNumber: user.unitNumber,
      });
      
      const request = await storage.createMaintenanceRequest(requestData);
      res.json(request);
    } catch (error) {
      console.error("Error creating maintenance request:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid maintenance request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create maintenance request" });
    }
  });

  app.patch('/api/maintenance-requests/:requestId/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { requestId } = req.params;
      const { status, assignedTo } = req.body;
      
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const updatedRequest = await storage.updateMaintenanceRequestStatus(requestId, status, assignedTo);
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error updating maintenance request status:", error);
      res.status(500).json({ message: "Failed to update maintenance request status" });
    }
  });

  // Get booking reports (admin only)
  app.get("/api/booking-reports", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const report = await storage.getBookingReport();
      res.json(report);
    } catch (error) {
      console.error("Error fetching booking reports:", error);
      res.status(500).json({ message: "Failed to fetch booking reports" });
    }
  });

  // Biometric request routes
  app.get("/api/biometric-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      let requests;
      if (['admin', 'super_admin'].includes(user.role)) {
        // Admins can see all requests
        requests = await storage.getBiometricRequests();
      } else {
        // Regular users can only see their own requests
        requests = await storage.getBiometricRequestsByUserId(userId);
      }
      
      res.json(requests);
    } catch (error) {
      console.error("Error fetching biometric requests:", error);
      res.status(500).json({ message: "Failed to fetch biometric requests" });
    }
  });

  app.post("/api/biometric-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const validatedData = insertBiometricRequestSchema.parse({
        ...req.body,
        userId,
      });
      
      const request = await storage.createBiometricRequest(validatedData);
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating biometric request:", error);
      res.status(500).json({ message: "Failed to create biometric request" });
    }
  });

  app.put("/api/biometric-requests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updates = {
        ...req.body,
        approvedBy: userId,
        approvedDate: req.body.status === 'approved' ? new Date() : null,
      };
      
      const request = await storage.updateBiometricRequest(req.params.id, updates);
      if (!request) {
        return res.status(404).json({ message: "Biometric request not found" });
      }
      
      res.json(request);
    } catch (error) {
      console.error("Error updating biometric request:", error);
      res.status(500).json({ message: "Failed to update biometric request" });
    }
  });

  // Tenant document routes
  app.get("/api/tenant-documents", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      let documents;
      if (['admin', 'super_admin'].includes(user.role)) {
        // Admins can see all documents
        documents = await storage.getTenantDocuments();
      } else {
        // Regular users can only see their own documents
        documents = await storage.getTenantDocumentsByUserId(userId);
      }
      
      res.json(documents);
    } catch (error) {
      console.error("Error fetching tenant documents:", error);
      res.status(500).json({ message: "Failed to fetch tenant documents" });
    }
  });

  app.post("/api/tenant-documents", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const validatedData = insertTenantDocumentSchema.parse({
        ...req.body,
        userId,
      });
      
      const document = await storage.createTenantDocument(validatedData);
      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating tenant document:", error);
      res.status(500).json({ message: "Failed to create tenant document" });
    }
  });

  app.put("/api/tenant-documents/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updates = {
        ...req.body,
        reviewedBy: userId,
        reviewDate: new Date(),
      };
      
      const document = await storage.updateTenantDocument(req.params.id, updates);
      if (!document) {
        return res.status(404).json({ message: "Tenant document not found" });
      }
      
      res.json(document);
    } catch (error) {
      console.error("Error updating tenant document:", error);
      res.status(500).json({ message: "Failed to update tenant document" });
    }
  });

  // Financial Management Routes
  
  // Fee Types
  app.get('/api/fee-types', isAuthenticated, async (req, res) => {
    try {
      const feeTypes = await storage.getAllFeeTypes();
      res.json(feeTypes);
    } catch (error) {
      console.error('Error fetching fee types:', error);
      res.status(500).json({ message: 'Failed to fetch fee types' });
    }
  });

  app.post('/api/fee-types', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const feeType = await storage.createFeeType(req.body);
      res.status(201).json(feeType);
    } catch (error) {
      console.error('Error creating fee type:', error);
      res.status(500).json({ message: 'Failed to create fee type' });
    }
  });

  app.put('/api/fee-types/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const feeType = await storage.updateFeeType(req.params.id, req.body);
      res.json(feeType);
    } catch (error) {
      console.error('Error updating fee type:', error);
      res.status(500).json({ message: 'Failed to update fee type' });
    }
  });

  app.delete('/api/fee-types/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      await storage.deleteFeeType(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting fee type:', error);
      res.status(500).json({ message: 'Failed to delete fee type' });
    }
  });

  // Fee Schedules
  app.get('/api/fee-schedules', isAuthenticated, async (req, res) => {
    try {
      const feeSchedules = await storage.getAllFeeSchedules();
      res.json(feeSchedules);
    } catch (error) {
      console.error('Error fetching fee schedules:', error);
      res.status(500).json({ message: 'Failed to fetch fee schedules' });
    }
  });

  app.post('/api/fee-schedules', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const feeSchedule = await storage.createFeeSchedule(req.body);
      res.status(201).json(feeSchedule);
    } catch (error) {
      console.error('Error creating fee schedule:', error);
      res.status(500).json({ message: 'Failed to create fee schedule' });
    }
  });

  // Fee Transactions
  app.get('/api/fee-transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      let transactions;

      if (user && ['admin', 'super_admin'].includes(user.role)) {
        transactions = await storage.getAllFeeTransactions();
      } else {
        transactions = await storage.getFeeTransactionsByUser(userId);
      }

      res.json(transactions);
    } catch (error) {
      console.error('Error fetching fee transactions:', error);
      res.status(500).json({ message: 'Failed to fetch fee transactions' });
    }
  });

  app.get('/api/fee-transactions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const transaction = await storage.getFeeTransactionById(req.params.id);
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      // Users can only see their own transactions unless they're admin
      if (!user || (!['admin', 'super_admin'].includes(user.role) && transaction.userId !== userId)) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      res.json(transaction);
    } catch (error) {
      console.error('Error fetching fee transaction:', error);
      res.status(500).json({ message: 'Failed to fetch fee transaction' });
    }
  });

  app.post('/api/fee-transactions/generate-monthly', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const { month, year } = req.body;
      const transactions = await storage.generateMonthlyFees(month, year);
      res.json({ 
        message: `Generated ${transactions.length} fee transactions for ${month}/${year}`,
        transactions 
      });
    } catch (error) {
      console.error('Error generating monthly fees:', error);
      res.status(500).json({ message: 'Failed to generate monthly fees' });
    }
  });

  // Payments
  app.get('/api/payments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      let payments;

      if (user && ['admin', 'super_admin'].includes(user.role)) {
        payments = await storage.getAllPayments();
      } else {
        payments = await storage.getPaymentsByUser(userId);
      }

      res.json(payments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      res.status(500).json({ message: 'Failed to fetch payments' });
    }
  });

  app.post('/api/payments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      // Set the processedBy field based on user role
      const paymentData = {
        ...req.body,
        processedBy: user && ['admin', 'super_admin'].includes(user.role) ? userId : undefined,
      };

      const payment = await storage.createPayment(paymentData);
      res.status(201).json(payment);
    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({ message: 'Failed to create payment' });
    }
  });

  // Financial Reports
  app.get('/api/financial/summary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const summary = await storage.getFinancialSummary();
      res.json(summary);
    } catch (error) {
      console.error('Error fetching financial summary:', error);
      res.status(500).json({ message: 'Failed to fetch financial summary' });
    }
  });

  app.get('/api/financial/monthly-collection', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const { month, year } = req.query;
      if (!month || !year) {
        return res.status(400).json({ message: 'Month and year are required' });
      }

      const report = await storage.getMonthlyCollectionReport(month as string, year as string);
      res.json(report);
    } catch (error) {
      console.error('Error fetching monthly collection report:', error);
      res.status(500).json({ message: 'Failed to fetch monthly collection report' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
