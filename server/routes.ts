import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPostSchema, insertCommentSchema, insertBookingSchema, insertGuestNotificationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userEmail = req.user.claims.email;
      // Find user by email since we're using email as the lookup key
      const allUsers = await storage.getAllUsers();
      const user = allUsers.find((u: any) => u.email === userEmail);
      res.json(user || null);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

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

  // Guest notification routes (Watchman only)
  app.get('/api/guest-notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getUserGuestNotifications(userId);
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

  const httpServer = createServer(app);
  return httpServer;
}
