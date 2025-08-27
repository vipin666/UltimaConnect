import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./localAuth";
import { hashPassword, comparePasswords, generateResetToken, getPasswordResetTokenExpiry, isPasswordResetTokenExpired } from "./auth";
import { LocalStorageService } from "./localStorage";
import { insertPostSchema, insertCommentSchema, insertBookingSchema, insertGuestNotificationSchema, insertMessageSchema, insertAnnouncementSchema, insertMaintenanceRequestSchema, insertBiometricRequestSchema, insertTenantDocumentSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

// Helper function to generate time slots based on amenity type
function generateTimeSlots(amenityType: string) {
  switch (amenityType) {
    case 'swimming_pool':
      return [
        { time: "6:00 AM", startTime: "06:00", endTime: "07:00", label: "6:00 - 7:00 AM" },
        { time: "7:00 AM", startTime: "07:00", endTime: "08:00", label: "7:00 - 8:00 AM" },
        { time: "8:00 AM", startTime: "08:00", endTime: "09:00", label: "8:00 - 9:00 AM" },
        { time: "9:00 AM", startTime: "09:00", endTime: "10:00", label: "9:00 - 10:00 AM" },
        { time: "6:00 PM", startTime: "18:00", endTime: "19:00", label: "6:00 - 7:00 PM" },
        { time: "7:00 PM", startTime: "19:00", endTime: "20:00", label: "7:00 - 8:00 PM" },
        { time: "8:00 PM", startTime: "20:00", endTime: "21:00", label: "8:00 - 9:00 PM" },
        { time: "9:00 PM", startTime: "21:00", endTime: "22:00", label: "9:00 - 10:00 PM" },
      ];
    case 'gym':
      return Array.from({ length: 9 }, (_, i) => {
        const hour = 5 + i * 2;
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const endHour = hour + 1;
        const endDisplayHour = endHour > 12 ? endHour - 12 : endHour === 0 ? 12 : endHour;
        const endAmpm = endHour >= 12 ? 'PM' : 'AM';
        return {
          time: `${displayHour}:00 ${ampm}`,
          startTime: `${hour.toString().padStart(2, '0')}:00`,
          endTime: `${endHour.toString().padStart(2, '0')}:00`,
          label: `${displayHour}:00 ${ampm} - ${endDisplayHour}:00 ${endAmpm}`
        };
      });
    case 'community_hall':
      return [
        { time: "Full Day", startTime: "00:00", endTime: "23:59", label: "Full Day Booking" }
      ];
    case 'garden':
      return Array.from({ length: 12 }, (_, i) => {
        const hour = 6 + i;
        const displayHour = hour > 12 ? hour - 12 : hour;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        return {
          time: `${displayHour}:00 ${ampm}`,
          startTime: `${hour.toString().padStart(2, '0')}:00`,
          endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
          label: `${displayHour}:00 - ${displayHour + 1 > 12 ? displayHour + 1 - 12 : displayHour + 1}:00 ${hour + 1 >= 12 ? 'PM' : 'AM'}`
        };
      });
    case 'guest_parking':
      return [
        { time: "Full Day", startTime: "00:00", endTime: "23:59", label: "Full Day (24 hours)" }
      ];
    default:
      return Array.from({ length: 12 }, (_, i) => {
        const hour = 9 + i;
        const displayHour = hour > 12 ? hour - 12 : hour;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        return {
          time: `${displayHour}:00 ${ampm}`,
          startTime: `${hour.toString().padStart(2, '0')}:00`,
          endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
          label: `${displayHour}:00 - ${displayHour + 1 > 12 ? displayHour + 1 - 12 : displayHour + 1}:00 ${hour + 1 >= 12 ? 'PM' : 'AM'}`
        };
      });
  }
}

// Helper function to validate consecutive day bookings for guest parking
async function validateConsecutiveDayBookings(userId: string, amenityId: string, bookingDate: string) {
  try {
    // Get user's existing bookings for this amenity
    const userBookings = await storage.getUserBookings(userId);
    const guestParkingBookings = userBookings.filter((booking: any) => 
      booking.amenityId === amenityId && 
      (booking.status === 'confirmed' || booking.status === 'pending')
    );
    
    if (guestParkingBookings.length === 0) {
      return { isValid: true, message: '' };
    }
    
    // Check for consecutive days
    const bookingDates = guestParkingBookings.map((booking: any) => booking.bookingDate);
    const requestedDate = new Date(bookingDate);
    
    // Sort dates to check for consecutive days
    const allDates = [...bookingDates, bookingDate].sort();
    const uniqueDates = Array.from(new Set(allDates));
    
    // Find the longest consecutive sequence
    let maxConsecutive = 1;
    let currentConsecutive = 1;
    
    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1]);
      const currDate = new Date(uniqueDates[i]);
      const diffTime = currDate.getTime() - prevDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 1;
      }
    }
    
    if (maxConsecutive > 2) {
      return {
        isValid: false,
        message: `You can only book guest parking for a maximum of 2 consecutive days. You currently have ${maxConsecutive} consecutive days booked.`
      };
    }
    
    return { isValid: true, message: '' };
  } catch (error) {
    console.error('Error validating consecutive day bookings:', error);
    return { isValid: true, message: '' }; // Allow booking if validation fails
  }
}

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

  // Get residents for visitor host selection
  app.get('/api/users/residents', isAuthenticated, async (req: any, res) => {
    try {
      const residents = await storage.getResidents();
      res.json(residents);
    } catch (error) {
      console.error("Error fetching residents:", error);
      res.status(500).json({ message: "Failed to fetch residents" });
    }
  });

  // Admin user management routes
  app.get('/api/admin/users', async (req: any, res) => {
    try {
      const currentUser = req.user;
      
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
      const currentUser = req.user;
      
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
      const currentUser = req.user;
      
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

  // Committee members endpoint (accessible to all authenticated users)
  app.get('/api/committee-members', isAuthenticated, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      const committeeMembers = users.filter((user: any) => 
        ['caretaker', 'secretary', 'president', 'treasurer', 'committee_member'].includes(user.role)
      );
      res.json(committeeMembers);
    } catch (error) {
      console.error("Error fetching committee members:", error);
      res.status(500).json({ message: "Failed to fetch committee members" });
    }
  });

  // User management routes (Admin/Super Admin only)
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
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

  app.patch('/api/users/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const targetUserId = req.params.userId;
      const updates = req.body;
      
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const updatedUser = await storage.updateUser(targetUserId, updates);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.patch('/api/users/:userId/status', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const targetUserId = req.params.userId;
      const { status } = req.body;
      
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
      const user = req.user;
      const targetUserId = req.params.userId;
      const { role } = req.body;
      
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

  // PUT endpoint for updating users
  app.put('/api/users/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const targetUserId = req.params.userId;
      const updates = req.body;
      
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const updatedUser = await storage.updateUser(targetUserId, updates);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // DELETE endpoint for deleting users
  app.delete('/api/users/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const targetUserId = req.params.userId;
      
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Prevent self-deletion
      if (user.id === targetUserId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      await storage.deleteUser(targetUserId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
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
        posts = await storage.getPosts();
      }
      
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.post('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      const user = req.user;
      const postId = req.params.postId;
      const { status, adminComment } = req.body;
      
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const post = await storage.updatePostStatus(postId, status, adminComment);
      res.json(post);
    } catch (error) {
      console.error("Error updating post status:", error);
      res.status(500).json({ message: "Failed to update post status" });
    }
  });

  app.post('/api/posts/:postId/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const postId = req.params.postId;
      const post = await storage.likePost(postId, userId);
      res.json(post);
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ message: "Failed to like post" });
    }
  });

  app.get('/api/posts/:postId/like-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const postId = req.params.postId;
      const hasLiked = await storage.hasUserLikedPost(postId, userId);
      res.json({ hasLiked });
    } catch (error) {
      console.error("Error checking like status:", error);
      res.status(500).json({ message: "Failed to check like status" });
    }
  });

  // Comment routes
  app.get('/api/posts/:postId/comments', isAuthenticated, async (req: any, res) => {
    try {
      const postId = req.params.postId;
      const comments = await storage.getComments(postId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post('/api/posts/:postId/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  app.delete('/api/comments/:commentId', isAuthenticated, async (req: any, res) => {
    try {
      const commentId = req.params.commentId;
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      // Get the comment to check ownership
      const comment = await storage.getComment(commentId);
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Only the comment author or admin can delete comments
      if (comment.authorId !== userId && user.role !== 'admin' && user.role !== 'super_admin') {
        return res.status(403).json({ message: "You can only delete your own comments" });
      }
      
      await storage.deleteComment(commentId);
      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Amenity routes
  app.get('/api/amenities', isAuthenticated, async (req, res) => {
    try {
      const amenities = await storage.getAmenities();
      res.json(amenities);
    } catch (error) {
      console.error("Error fetching amenities:", error);
      res.status(500).json({ message: "Failed to fetch amenities" });
    }
  });

  // Booking routes
  app.get('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      let bookings;
      if (user.role === 'admin' || user.role === 'super_admin') {
        // Admins see all bookings
        bookings = await storage.getBookings();
      } else {
        // Regular users see only their own bookings
        bookings = await storage.getBookingsByUser(user.id);
      }
      
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        userId,
      });
      
      // Set booking status based on user role
      // Admins can book directly (confirmed), residents need approval (pending)
      const isAdmin = user.role === 'admin' || user.role === 'super_admin';
      const bookingStatus = isAdmin ? 'confirmed' : 'pending';
      
      // Get amenity details to check if it's guest parking
      const amenity = await storage.getAmenity(bookingData.amenityId);
      if (!amenity) {
        return res.status(404).json({ message: "Amenity not found" });
      }
      
      // Special validation for guest parking slots
      if (amenity.type === 'guest_parking') {
        // Check for consecutive day booking limit (max 2 days)
        const consecutiveDayValidation = await validateConsecutiveDayBookings(
          userId, 
          bookingData.amenityId, 
          bookingData.bookingDate
        );
        
        if (!consecutiveDayValidation.isValid) {
          return res.status(400).json({ 
            message: consecutiveDayValidation.message,
            errorType: 'consecutive_days_limit'
          });
        }
      }
      
      // Check for conflicts (only consider confirmed bookings as conflicts)
      const existingBookings = await storage.getBookingsByAmenityAndDate(
        bookingData.amenityId,
        bookingData.bookingDate
      );
      
      // Check if user already has a booking for this amenity on this date
      const userExistingBooking = existingBookings.find(booking => 
        booking.userId === userId && 
        (booking.status === 'confirmed' || booking.status === 'pending')
      );
      
      if (userExistingBooking) {
        return res.status(400).json({ 
          message: "You already have a booking for this amenity on this date",
          errorType: 'user_already_booked'
        });
      }
      
      const hasConflict = existingBookings.some(booking => {
        // For guest parking, any existing confirmed or pending booking means conflict (since it's the same slot)
        if (amenity.type === 'guest_parking') {
          return booking.status === 'confirmed' || booking.status === 'pending';
        }
        
        // For other amenities, only check against confirmed bookings
        if (booking.status !== 'confirmed') {
          return false;
        }
        
        const startTime = bookingData.startTime;
        const endTime = bookingData.endTime;
        const existingStart = booking.startTime;
        const existingEnd = booking.endTime;
        
        return (startTime < existingEnd && endTime > existingStart);
      });
      
      if (hasConflict) {
        return res.status(400).json({ message: "Time slot is already booked" });
      }
      
      const booking = await storage.createBooking({
        ...bookingData,
        status: bookingStatus
      });
      
      res.json({
        ...booking,
        message: isAdmin 
          ? "Booking confirmed successfully" 
          : "Booking request submitted. Awaiting admin approval."
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      
      // Handle database constraint violations
      if (error && typeof error === 'object' && 'code' in error) {
        const dbError = error as any;
        if (dbError.code === 'SQLITE_CONSTRAINT') {
          if (dbError.message.includes('idx_user_amenity_date_unique')) {
            return res.status(400).json({ 
              message: "You already have a booking for this amenity on this date",
              errorType: 'user_already_booked'
            });
          }
          if (dbError.message.includes('idx_guest_parking_slot_unique')) {
            return res.status(400).json({ 
              message: "This slot is already booked for this date",
              errorType: 'slot_already_booked'
            });
          }
        }
      }
      
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.get('/api/bookings/user/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      
      // Users can only access their own bookings
      if (req.user.id !== userId && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const userBookings = await storage.getUserBookings(userId);
      res.json(userBookings);
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      res.status(500).json({ message: "Failed to fetch user bookings" });
    }
  });

  app.get('/api/bookings/available-slots', isAuthenticated, async (req: any, res) => {
    try {
      const { amenityId, date } = req.query;
      
      if (!amenityId || !date) {
        return res.status(400).json({ message: "Amenity ID and date are required" });
      }
      
      // Get existing bookings for the date and amenity
      const existingBookings = await storage.getBookingsByAmenityAndDate(amenityId, date);
      
      // Get amenity details to determine available slots
      const amenity = await storage.getAmenity(amenityId);
      if (!amenity) {
        return res.status(404).json({ message: "Amenity not found" });
      }
      
      // Generate all possible time slots based on amenity type
      const allSlots = generateTimeSlots(amenity.type);
      
      // Filter out booked slots (exclude cancelled and rejected bookings)
      let availableSlots = allSlots;
      
      if (amenity.type === 'guest_parking') {
        // For guest parking, check if this specific slot is taken
        const confirmedBookings = existingBookings.filter(booking => 
          booking.status === 'confirmed' || booking.status === 'pending'
        );
        
        if (confirmedBookings.length > 0) {
          availableSlots = []; // This specific slot is taken
        }
      } else {
        // For other amenities, filter by time conflicts
        availableSlots = allSlots.filter(slot => {
          return !existingBookings.some(booking => {
            // Skip cancelled and rejected bookings
            if (booking.status === 'cancelled' || booking.status === 'rejected') {
              return false;
            }
            
            const startTime = slot.startTime;
            const endTime = slot.endTime;
            const existingStart = booking.startTime;
            const existingEnd = booking.endTime;
            
            return (startTime < existingEnd && endTime > existingStart);
          });
        });
      }
      
      res.json({
        amenity,
        date,
        availableSlots,
        bookedSlots: existingBookings.map(booking => ({
          startTime: booking.startTime,
          endTime: booking.endTime,
          bookedBy: `${booking.firstName} ${booking.lastName} (${booking.unitNumber || 'No Unit'})`,
          bookingId: booking.id,
          userId: booking.userId
        }))
      });
    } catch (error) {
      console.error("Error fetching available slots:", error);
      res.status(500).json({ message: "Failed to fetch available slots" });
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

  app.patch('/api/bookings/:bookingId/approve', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      // Only admins can approve bookings
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        return res.status(403).json({ message: "Only admins can approve bookings" });
      }
      
      const bookingId = req.params.bookingId;
      const booking = await storage.updateBooking(bookingId, { status: 'confirmed' });
      res.json(booking);
    } catch (error) {
      console.error("Error approving booking:", error);
      res.status(500).json({ message: "Failed to approve booking" });
    }
  });

  app.patch('/api/bookings/:bookingId/reject', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      // Only admins can reject bookings
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        return res.status(403).json({ message: "Only admins can reject bookings" });
      }
      
      const bookingId = req.params.bookingId;
      const { reason } = req.body;
      
      const booking = await storage.rejectBooking(bookingId, reason);
      res.json(booking);
    } catch (error) {
      console.error("Error rejecting booking:", error);
      res.status(500).json({ message: "Failed to reject booking" });
    }
  });

  // Guest notification routes (Enhanced for Watchman features)
  app.get('/api/guest-notifications', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let notifications;
      if (user.role === 'watchman') {
        // Watchman sees all active guest notifications
        notifications = await storage.getGuestNotifications();
      } else {
        // Residents see only their own notifications
        notifications = await storage.getUserGuestNotifications(user.id);
      }
      
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching guest notifications:", error);
      res.status(500).json({ message: "Failed to fetch guest notifications" });
    }
  });

  app.post('/api/guest-notifications', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
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
      const user = req.user;
      const notificationId = req.params.notificationId;
      
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
      const user = req.user;
      const { notificationId } = req.params;
      const { approved, notes } = req.body;
      
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
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.id;
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
      const user = req.user;
      
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
      const user = req.user;
      
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const announcementData = insertAnnouncementSchema.parse({
        ...req.body,
        authorId: user.id,
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
      const user = req.user;
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let requests;
      if (user.role === 'admin' || user.role === 'super_admin') {
        requests = await storage.getMaintenanceRequests();
      } else {
        requests = await storage.getMaintenanceRequests(); // For now, return all requests
      }
      
      res.json(requests);
    } catch (error) {
      console.error("Error fetching maintenance requests:", error);
      res.status(500).json({ message: "Failed to fetch maintenance requests" });
    }
  });

  app.post('/api/maintenance-requests', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const requestData = insertMaintenanceRequestSchema.parse({
        ...req.body,
        userId: user.id,
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
      const user = req.user;
      const { requestId } = req.params;
      const { status, assignedTo } = req.body;
      
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
      const user = req.user;
      
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
      const userId = req.user?.id || req.user?.claims?.sub;
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
      const userId = req.user?.id || req.user?.claims?.sub;
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
      const userId = req.user?.id || req.user?.claims?.sub;
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

  // Biometric access management routes
  app.post("/api/biometric-access/enable", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { targetUserId, requestType, accessLevel } = req.body;
      
      if (!targetUserId || !requestType || !accessLevel) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const result = await storage.enableBiometricAccess(targetUserId, requestType, accessLevel);
      res.json(result);
    } catch (error) {
      console.error("Error enabling biometric access:", error);
      res.status(500).json({ message: "Failed to enable biometric access" });
    }
  });

  app.post("/api/biometric-access/disable", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { targetUserId } = req.body;
      
      if (!targetUserId) {
        return res.status(400).json({ message: "Missing user ID" });
      }

      const result = await storage.disableBiometricAccess(targetUserId);
      res.json(result);
    } catch (error) {
      console.error("Error disabling biometric access:", error);
      res.status(500).json({ message: "Failed to disable biometric access" });
    }
  });

  app.get("/api/biometric-access/status/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user;
      const targetUserId = req.params.userId;
      
      // Users can only check their own status, admins can check any user
      if (currentUser.id !== targetUserId) {
        if (!['admin', 'super_admin'].includes(currentUser.role)) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const status = await storage.getUserBiometricStatus(targetUserId);
      res.json(status);
    } catch (error) {
      console.error("Error fetching biometric status:", error);
      res.status(500).json({ message: "Failed to fetch biometric status" });
    }
  });

  // Flat management routes
  app.get("/api/flats", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const flats = await storage.getFlats();
      res.json(flats);
    } catch (error) {
      console.error("Error fetching flats:", error);
      res.status(500).json({ message: "Failed to fetch flats" });
    }
  });

  app.get("/api/units", isAuthenticated, async (req: any, res) => {
    try {
      const units = await storage.getUniqueUnitNumbers();
      res.json(units);
    } catch (error) {
      console.error("Error fetching units:", error);
      res.status(500).json({ message: "Failed to fetch units" });
    }
  });

  app.post("/api/flats", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const flat = await storage.createFlat(req.body);
      res.status(201).json(flat);
    } catch (error) {
      console.error("Error creating flat:", error);
      res.status(500).json({ message: "Failed to create flat" });
    }
  });

  app.put("/api/flats/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const flat = await storage.updateFlat(req.params.id, req.body);
      if (!flat) {
        return res.status(404).json({ message: "Flat not found" });
      }
      
      res.json(flat);
    } catch (error) {
      console.error("Error updating flat:", error);
      res.status(500).json({ message: "Failed to update flat" });
    }
  });

  app.delete("/api/flats/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteFlat(req.params.id);
      res.json({ message: "Flat deleted successfully" });
    } catch (error) {
      console.error("Error deleting flat:", error);
      res.status(500).json({ message: "Failed to delete flat" });
    }
  });

  app.post("/api/flats/:id/assign", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { userId: targetUserId, isOwner } = req.body;
      
      if (!targetUserId || typeof isOwner !== 'boolean') {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const flat = await storage.assignFlatToUser(req.params.id, targetUserId, isOwner);
      res.json(flat);
    } catch (error) {
      console.error("Error assigning flat:", error);
      res.status(500).json({ message: "Failed to assign flat" });
    }
  });

  app.post("/api/flats/:id/unassign", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const flat = await storage.unassignFlatFromUser(req.params.id);
      res.json(flat);
    } catch (error) {
      console.error("Error unassigning flat:", error);
      res.status(500).json({ message: "Failed to unassign flat" });
    }
  });

  // Tenant document routes
  app.get("/api/tenant-documents", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
              const feeTypes = await storage.getFeeTypes();
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
              const feeSchedules = await storage.getFeeSchedules();
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

  // Local File Storage Routes
  app.post('/api/upload', isAuthenticated, async (req: any, res) => {
    try {
      const localStorageService = new LocalStorageService();
      // For now, return a simple response - actual file upload will be handled by multer middleware
      res.json({ message: 'File upload endpoint ready' });
    } catch (error) {
      console.error('Error with upload endpoint:', error);
      res.status(500).json({ error: 'Failed to setup upload' });
    }
  });

  // Enhanced Financial Management - Notifications & Defaulter Tracking

  // Payment Notifications
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  app.get('/api/notifications/unread', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const notifications = await storage.getAllUnreadNotifications();
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      res.status(500).json({ message: 'Failed to fetch unread notifications' });
    }
  });

  app.put('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationAsRead(id);
      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Failed to mark notification as read' });
    }
  });

  // Defaulter Management
  app.get('/api/defaulters', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const defaulters = await storage.getAllDefaulters();
      res.json(defaulters);
    } catch (error) {
      console.error('Error fetching defaulters:', error);
      res.status(500).json({ message: 'Failed to fetch defaulters' });
    }
  });

  // Admin Payment Management
  app.post('/api/payments/mark-received', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const { transactionId, amount, paymentMethod, referenceNumber, notes } = req.body;
      
      if (!transactionId || !amount || !paymentMethod) {
        return res.status(400).json({ message: 'Transaction ID, amount, and payment method are required' });
      }

      const payment = await storage.markPaymentReceived(transactionId, {
        amount,
        paymentMethod,
        referenceNumber,
        notes,
        processedBy: userId,
      });

      res.json(payment);
    } catch (error) {
      console.error('Error marking payment received:', error);
      res.status(500).json({ message: 'Failed to mark payment as received' });
    }
  });

  // Daily Notification Processing (for automated tasks)
  app.post('/api/admin/process-overdue', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      await storage.processOverduePayments();
      const notifications = await storage.generateDailyNotifications();
      
      res.json({ 
        message: 'Overdue processing completed',
        notificationsGenerated: notifications.length 
      });
    } catch (error) {
      console.error('Error processing overdue payments:', error);
      res.status(500).json({ message: 'Failed to process overdue payments' });
    }
  });

  // Visitor Management Routes
  app.get('/api/visitors', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      let visitors;
      if (user.role === 'admin' || user.role === 'super_admin') {
        // Admin can see all visitors
        visitors = await storage.getVisitors();
      } else if (user.role === 'watchman') {
        // Watchman can see visitors they registered
        visitors = await storage.getVisitorsByWatchman(userId);
      } else {
        // Residents can see their own visitors
        visitors = await storage.getVisitorsForHost(userId);
      }

      res.json(visitors);
    } catch (error) {
      console.error('Error fetching visitors:', error);
      res.status(500).json({ message: 'Failed to fetch visitors' });
    }
  });

  // Enhanced Visitor Management Routes (includes guest parking bookings)
  app.get('/api/visitors/enhanced', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      let visitors;
      let guestParkingBookings = [];

      if (user.role === 'admin' || user.role === 'super_admin') {
        // Admin can see all visitors and all guest parking bookings
        visitors = await storage.getVisitors();
        guestParkingBookings = await storage.getGuestParkingBookings();
      } else if (user.role === 'watchman') {
        // Watchman can see visitors they registered and all guest parking bookings
        visitors = await storage.getVisitorsByWatchman(userId);
        guestParkingBookings = await storage.getGuestParkingBookings();
      } else {
        // Residents can see their own visitors and their own guest parking bookings
        visitors = await storage.getVisitorsForHost(userId);
        guestParkingBookings = await storage.getGuestParkingBookingsByUser(userId);
      }

      // Combine visitors and guest parking bookings
      const combinedData = [
        ...visitors.map(v => ({ ...v, type: 'visitor' })),
        ...guestParkingBookings.map(b => ({ ...b, type: 'guest_parking' }))
      ];

      // Sort by creation date (newest first)
      combinedData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json(combinedData);
    } catch (error) {
      console.error('Error fetching enhanced visitors:', error);
      res.status(500).json({ message: 'Failed to fetch enhanced visitors' });
    }
  });

  app.get('/api/visitors/pending', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      let visitors;
      if (user.role === 'admin' || user.role === 'super_admin') {
        visitors = await storage.getVisitorsByStatus('pending');
      } else {
        // Residents can see their own pending visitors
        const allVisitors = await storage.getVisitorsForHost(userId);
        visitors = allVisitors.filter(v => v.status === 'pending');
      }

      res.json(visitors);
    } catch (error) {
      console.error('Error fetching pending visitors:', error);
      res.status(500).json({ message: 'Failed to fetch pending visitors' });
    }
  });

  app.post('/api/visitors', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'watchman' && user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'resident')) {
        return res.status(403).json({ message: 'Only watchmen, admins, and residents can register visitors' });
      }

      let watchmanId = userId;
      
      // If resident is registering, find a watchman to assign
      if (user.role === 'resident') {
        const watchmen = await storage.getUsersByRole('watchman');
        if (watchmen.length > 0) {
          watchmanId = watchmen[0].id; // Assign to first available watchman
        }
      }

      const visitorData = {
        ...req.body,
        watchmanId: watchmanId,
        status: 'pending'
      };

      const visitor = await storage.createVisitor(visitorData);

      // Create notification for the host
      await storage.createVisitorNotification({
        visitorId: visitor.id,
        userId: visitor.hostUserId,
        title: 'New Visitor Verification Required',
        message: `${visitor.name} is waiting for your approval to visit.`,
        isRead: false,
      });

      res.status(201).json(visitor);
    } catch (error) {
      console.error('Error creating visitor:', error);
      res.status(500).json({ message: 'Failed to create visitor' });
    }
  });

  app.patch('/api/visitors/:id/verify', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { action, notes } = req.body; // action: 'approve' or 'reject'
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const visitor = await storage.getVisitorById(id);
      if (!visitor) {
        return res.status(404).json({ message: 'Visitor not found' });
      }

      // Check if user can verify this visitor
      if (user.role !== 'admin' && user.role !== 'super_admin' && visitor.hostUserId !== userId) {
        return res.status(403).json({ message: 'You can only verify visitors for your unit' });
      }

      const updateData: any = {
        verifiedBy: userId,
        verifiedAt: new Date(),
        verificationNotes: notes,
      };

      if (action === 'approve') {
        updateData.status = 'approved';
      } else if (action === 'reject') {
        updateData.status = 'rejected';
        updateData.rejectionReason = notes;
      }

      const updatedVisitor = await storage.updateVisitor(id, updateData);

      // Create notification for watchman
      await storage.createVisitorNotification({
        visitorId: visitor.id,
        userId: visitor.watchmanId,
        title: `Visitor ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        message: `${visitor.name}'s visit has been ${action}d by the host.`,
        isRead: false,
      });

      res.json(updatedVisitor);
    } catch (error) {
      console.error('Error verifying visitor:', error);
      res.status(500).json({ message: 'Failed to verify visitor' });
    }
  });

  app.patch('/api/visitors/:id/checkin', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'watchman' && user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: 'Only watchmen and admins can check in visitors' });
      }

      const visitor = await storage.getVisitorById(id);
      if (!visitor) {
        return res.status(404).json({ message: 'Visitor not found' });
      }

      if (visitor.status !== 'approved') {
        return res.status(400).json({ message: 'Visitor must be approved before check-in' });
      }

      const updatedVisitor = await storage.updateVisitor(id, {
        status: 'checked_in',
        checkInTime: new Date(),
      });

      res.json(updatedVisitor);
    } catch (error) {
      console.error('Error checking in visitor:', error);
      res.status(500).json({ message: 'Failed to check in visitor' });
    }
  });

  app.patch('/api/visitors/:id/checkout', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'watchman' && user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: 'Only watchmen and admins can check out visitors' });
      }

      const visitor = await storage.getVisitorById(id);
      if (!visitor) {
        return res.status(404).json({ message: 'Visitor not found' });
      }

      if (visitor.status !== 'checked_in') {
        return res.status(400).json({ message: 'Visitor must be checked in before checkout' });
      }

      const checkOutTime = new Date();
      let actualDuration = '';
      
      if (visitor.checkInTime) {
        const duration = checkOutTime.getTime() - visitor.checkInTime.getTime();
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        actualDuration = `${hours}h ${minutes}m`;
      }

      const updatedVisitor = await storage.updateVisitor(id, {
        status: 'checked_out',
        checkOutTime,
        actualDuration,
      });

      res.json(updatedVisitor);
    } catch (error) {
      console.error('Error checking out visitor:', error);
      res.status(500).json({ message: 'Failed to check out visitor' });
    }
  });

  app.get('/api/visitor-notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const notifications = await storage.getVisitorNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching visitor notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  app.patch('/api/visitor-notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.markVisitorNotificationRead(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Failed to mark notification as read' });
    }
  });

  app.get('/api/visitors/report', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const { startDate, endDate, format } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start date and end date are required' });
      }

      const visitors = await storage.generateVisitorReport(
        new Date(startDate as string),
        new Date(endDate as string)
      );

      if (format === 'csv') {
        // Generate CSV
        const csvHeaders = 'Name,Phone,Purpose,Unit,Status,Check In,Check Out,Duration,Watchman,Host\n';
        const csvData = visitors.map(v => 
          `"${v.name}","${v.phone}","${v.purpose}","${v.unitToVisit}","${v.status}","${v.checkInTime || ''}","${v.checkOutTime || ''}","${v.actualDuration || ''}","${v.watchman?.firstName || ''} ${v.watchman?.lastName || ''}","${v.host?.firstName || ''} ${v.host?.lastName || ''}"`
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="visitor-report.csv"');
        res.send(csvHeaders + csvData);
      } else {
        res.json(visitors);
      }
    } catch (error) {
      console.error('Error generating visitor report:', error);
      res.status(500).json({ message: 'Failed to generate visitor report' });
    }
  });

  // User Management Endpoints (Admin only)
  app.post('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: 'Only admins can create users' });
      }

      const userData = req.body;
      const newUser = await storage.createUser(userData);
      res.status(201).json(newUser);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  app.put('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: 'Only admins can update users' });
      }

      const { id } = req.params;
      const userData = req.body;
      const updatedUser = await storage.updateUser(id, userData);
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  app.delete('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: 'Only admins can delete users' });
      }

      const { id } = req.params;
      await storage.deleteUser(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
