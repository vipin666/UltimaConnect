import {
  users,
  posts,
  comments,
  amenities,
  bookings,
  guestNotifications,
  messages,
  announcements,
  maintenanceRequests,
  type User,
  type UpsertUser,
  type Post,
  type InsertPost,
  type PostWithAuthor,
  type Comment,
  type InsertComment,
  type Amenity,
  type Booking,
  type InsertBooking,
  type BookingWithAmenity,
  type GuestNotification,
  type InsertGuestNotification,
  type GuestNotificationWithUser,
  type Message,
  type InsertMessage,
  type MessageWithUsers,
  type Announcement,
  type InsertAnnouncement,
  type AnnouncementWithAuthor,
  type MaintenanceRequest,
  type InsertMaintenanceRequest,
  type MaintenanceRequestWithUsers,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // User management
  getAllUsers(): Promise<User[]>;
  updateUserStatus(userId: string, status: 'active' | 'pending' | 'suspended'): Promise<User>;
  updateUserRole(userId: string, role: 'resident' | 'admin' | 'super_admin' | 'watchman'): Promise<User>;
  
  // Post operations
  createPost(post: InsertPost): Promise<Post>;
  getAllPosts(): Promise<PostWithAuthor[]>;
  getPostsByType(type: string): Promise<PostWithAuthor[]>;
  updatePostStatus(postId: string, status: 'active' | 'resolved' | 'frozen'): Promise<Post>;
  likePost(postId: string): Promise<Post>;
  
  // Comment operations
  createComment(comment: InsertComment): Promise<Comment>;
  getCommentsByPostId(postId: string): Promise<Comment[]>;
  
  // Amenity operations
  getAllAmenities(): Promise<Amenity[]>;
  getAmenityById(id: string): Promise<Amenity | undefined>;
  
  // Booking operations
  createBooking(booking: InsertBooking): Promise<Booking>;
  getUserBookings(userId: string): Promise<BookingWithAmenity[]>;
  getBookingsByAmenityAndDate(amenityId: string, date: string): Promise<Booking[]>;
  cancelBooking(bookingId: string): Promise<Booking>;
  
  // Guest notification operations
  createGuestNotification(notification: InsertGuestNotification): Promise<GuestNotification>;
  getUserGuestNotifications(userId: string): Promise<GuestNotificationWithUser[]>;
  getAllActiveGuestNotifications(): Promise<GuestNotificationWithUser[]>;
  updateGuestNotification(notificationId: string, updates: Partial<GuestNotification>): Promise<GuestNotification>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getUserMessages(userId: string): Promise<MessageWithUsers[]>;
  markMessageAsRead(messageId: string): Promise<Message>;
  
  // Announcement operations
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  getAnnouncementsForRole(role: string): Promise<AnnouncementWithAuthor[]>;
  getAllAnnouncements(): Promise<AnnouncementWithAuthor[]>;
  
  // Maintenance request operations
  createMaintenanceRequest(request: InsertMaintenanceRequest): Promise<MaintenanceRequest>;
  getUserMaintenanceRequests(userId: string): Promise<MaintenanceRequestWithUsers[]>;
  getAllMaintenanceRequests(): Promise<MaintenanceRequestWithUsers[]>;
  updateMaintenanceRequestStatus(requestId: string, status: string, assignedTo?: string): Promise<MaintenanceRequest>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // First check if user exists by email
    const [existingUser] = await db.select().from(users).where(eq(users.email, userData.email || ''));
    
    if (existingUser) {
      // Update existing user
      const [user] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id))
        .returning();
      return user;
    } else {
      // Create new user
      const [user] = await db
        .insert(users)
        .values(userData)
        .returning();
      return user;
    }
  }

  // User management
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserStatus(userId: string, status: 'active' | 'pending' | 'suspended'): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ status, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserRole(userId: string, role: 'resident' | 'admin' | 'super_admin' | 'watchman'): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Post operations
  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }

  async getAllPosts(): Promise<PostWithAuthor[]> {
    const result = await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        type: posts.type,
        status: posts.status,
        authorId: posts.authorId,
        likes: posts.likes,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          unitNumber: users.unitNumber,
        }
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .orderBy(desc(posts.createdAt));

    // Get comments for each post
    const postsWithComments = await Promise.all(
      result.map(async (post) => {
        const postComments = await db
          .select({
            id: comments.id,
            content: comments.content,
            postId: comments.postId,
            authorId: comments.authorId,
            createdAt: comments.createdAt,
            author: {
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
              unitNumber: users.unitNumber,
            }
          })
          .from(comments)
          .leftJoin(users, eq(comments.authorId, users.id))
          .where(eq(comments.postId, post.id))
          .orderBy(desc(comments.createdAt));

        return {
          ...post,
          author: post.author || { id: '', firstName: 'Unknown', lastName: 'User', unitNumber: null },
          comments: postComments.map(comment => ({
            ...comment,
            author: comment.author || { id: '', firstName: 'Unknown', lastName: 'User', unitNumber: null }
          })),
        };
      })
    );

    return postsWithComments;
  }

  async getPostsByType(type: string): Promise<PostWithAuthor[]> {
    const result = await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        type: posts.type,
        status: posts.status,
        authorId: posts.authorId,
        likes: posts.likes,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          unitNumber: users.unitNumber,
        }
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.type, type as any))
      .orderBy(desc(posts.createdAt));

    const postsWithComments = await Promise.all(
      result.map(async (post) => {
        const postComments = await db
          .select({
            id: comments.id,
            content: comments.content,
            postId: comments.postId,
            authorId: comments.authorId,
            createdAt: comments.createdAt,
            author: {
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
              unitNumber: users.unitNumber,
            }
          })
          .from(comments)
          .leftJoin(users, eq(comments.authorId, users.id))
          .where(eq(comments.postId, post.id))
          .orderBy(desc(comments.createdAt));

        return {
          ...post,
          author: post.author || { id: '', firstName: 'Unknown', lastName: 'User', unitNumber: null },
          comments: postComments.map(comment => ({
            ...comment,
            author: comment.author || { id: '', firstName: 'Unknown', lastName: 'User', unitNumber: null }
          })),
        };
      })
    );

    return postsWithComments;
  }

  async updatePostStatus(postId: string, status: 'active' | 'resolved' | 'frozen'): Promise<Post> {
    const [post] = await db
      .update(posts)
      .set({ status, updatedAt: new Date() })
      .where(eq(posts.id, postId))
      .returning();
    return post;
  }

  async likePost(postId: string): Promise<Post> {
    const [post] = await db
      .update(posts)
      .set({ likes: sql`${posts.likes} + 1` })
      .where(eq(posts.id, postId))
      .returning();
    return post;
  }

  // Comment operations
  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    return await db.select().from(comments).where(eq(comments.postId, postId)).orderBy(desc(comments.createdAt));
  }

  // Amenity operations
  async getAllAmenities(): Promise<Amenity[]> {
    return await db.select().from(amenities).where(eq(amenities.isActive, true));
  }

  async getAmenityById(id: string): Promise<Amenity | undefined> {
    const [amenity] = await db.select().from(amenities).where(eq(amenities.id, id));
    return amenity;
  }

  // Booking operations
  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async getUserBookings(userId: string): Promise<BookingWithAmenity[]> {
    const results = await db
      .select({
        id: bookings.id,
        amenityId: bookings.amenityId,
        userId: bookings.userId,
        bookingDate: bookings.bookingDate,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        status: bookings.status,
        notes: bookings.notes,
        createdAt: bookings.createdAt,
        amenity: amenities,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          unitNumber: users.unitNumber,
        }
      })
      .from(bookings)
      .leftJoin(amenities, eq(bookings.amenityId, amenities.id))
      .leftJoin(users, eq(bookings.userId, users.id))
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.createdAt));
    
    return results.filter(result => result.amenity !== null) as BookingWithAmenity[];
  }

  async getBookingsByAmenityAndDate(amenityId: string, date: string): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(and(
        eq(bookings.amenityId, amenityId),
        eq(bookings.bookingDate, date),
        eq(bookings.status, 'confirmed')
      ));
  }

  async cancelBooking(bookingId: string): Promise<Booking> {
    const [booking] = await db
      .update(bookings)
      .set({ status: 'cancelled' })
      .where(eq(bookings.id, bookingId))
      .returning();
    return booking;
  }

  // Guest notification operations
  async createGuestNotification(notification: InsertGuestNotification): Promise<GuestNotification> {
    const [newNotification] = await db.insert(guestNotifications).values(notification).returning();
    return newNotification;
  }

  async getUserGuestNotifications(userId: string): Promise<GuestNotificationWithUser[]> {
    const result = await db
      .select({
        id: guestNotifications.id,
        userId: guestNotifications.userId,
        guestName: guestNotifications.guestName,
        guestPhone: guestNotifications.guestPhone,
        purpose: guestNotifications.purpose,
        arrivalTime: guestNotifications.arrivalTime,
        departureTime: guestNotifications.departureTime,
        parkingSlot: guestNotifications.parkingSlot,
        isActive: guestNotifications.isActive,
        watchmanApproved: guestNotifications.watchmanApproved,
        watchmanNotes: guestNotifications.watchmanNotes,
        createdAt: guestNotifications.createdAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          unitNumber: users.unitNumber,
        },
      })
      .from(guestNotifications)
      .leftJoin(users, eq(guestNotifications.userId, users.id))
      .where(eq(guestNotifications.userId, userId))
      .orderBy(desc(guestNotifications.createdAt));

    return result.map(item => ({
      ...item,
      user: item.user || { id: '', firstName: 'Unknown', lastName: 'User', unitNumber: null }
    }));
  }

  async getAllActiveGuestNotifications(): Promise<GuestNotificationWithUser[]> {
    const result = await db
      .select({
        id: guestNotifications.id,
        userId: guestNotifications.userId,
        guestName: guestNotifications.guestName,
        guestPhone: guestNotifications.guestPhone,
        purpose: guestNotifications.purpose,
        arrivalTime: guestNotifications.arrivalTime,
        departureTime: guestNotifications.departureTime,
        parkingSlot: guestNotifications.parkingSlot,
        isActive: guestNotifications.isActive,
        watchmanApproved: guestNotifications.watchmanApproved,
        watchmanNotes: guestNotifications.watchmanNotes,
        createdAt: guestNotifications.createdAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          unitNumber: users.unitNumber,
        },
      })
      .from(guestNotifications)
      .leftJoin(users, eq(guestNotifications.userId, users.id))
      .where(eq(guestNotifications.isActive, true))
      .orderBy(desc(guestNotifications.createdAt));

    return result.map(item => ({
      ...item,
      user: item.user || { id: '', firstName: 'Unknown', lastName: 'User', unitNumber: null }
    }));
  }

  async updateGuestNotification(notificationId: string, updates: Partial<GuestNotification>): Promise<GuestNotification> {
    const [notification] = await db
      .update(guestNotifications)
      .set(updates)
      .where(eq(guestNotifications.id, notificationId))
      .returning();
    return notification;
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getUserMessages(userId: string): Promise<MessageWithUsers[]> {
    const result = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        content: messages.content,
        isRead: messages.isRead,
        createdAt: messages.createdAt,
        sender: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          unitNumber: users.unitNumber,
          role: users.role,
        },
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.receiverId, userId))
      .orderBy(desc(messages.createdAt));

    const messagesWithReceiver = await Promise.all(
      result.map(async (msg) => {
        const [receiver] = await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            unitNumber: users.unitNumber,
            role: users.role,
          })
          .from(users)
          .where(eq(users.id, msg.receiverId));

        return {
          ...msg,
          sender: msg.sender || { id: '', firstName: 'Unknown', lastName: 'User', unitNumber: null, role: 'resident' as const },
          receiver: receiver || { id: '', firstName: 'Unknown', lastName: 'User', unitNumber: null, role: 'resident' as const },
        };
      })
    );

    return messagesWithReceiver;
  }

  async markMessageAsRead(messageId: string): Promise<Message> {
    const [updatedMessage] = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, messageId))
      .returning();
    return updatedMessage;
  }

  // Announcement operations
  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const [newAnnouncement] = await db.insert(announcements).values(announcement).returning();
    return newAnnouncement;
  }

  async getAnnouncementsForRole(role: string): Promise<AnnouncementWithAuthor[]> {
    const result = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        content: announcements.content,
        authorId: announcements.authorId,
        targetRoles: announcements.targetRoles,
        isUrgent: announcements.isUrgent,
        expiresAt: announcements.expiresAt,
        createdAt: announcements.createdAt,
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
        },
      })
      .from(announcements)
      .leftJoin(users, eq(announcements.authorId, users.id))
      .where(sql`${role} = ANY(${announcements.targetRoles})`)
      .orderBy(desc(announcements.createdAt));

    return result.map(item => ({
      ...item,
      author: item.author || { id: '', firstName: 'Unknown', lastName: 'User', role: 'admin' as const }
    }));
  }

  async getAllAnnouncements(): Promise<AnnouncementWithAuthor[]> {
    const result = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        content: announcements.content,
        authorId: announcements.authorId,
        targetRoles: announcements.targetRoles,
        isUrgent: announcements.isUrgent,
        expiresAt: announcements.expiresAt,
        createdAt: announcements.createdAt,
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
        },
      })
      .from(announcements)
      .leftJoin(users, eq(announcements.authorId, users.id))
      .orderBy(desc(announcements.createdAt));

    return result.map(item => ({
      ...item,
      author: item.author || { id: '', firstName: 'Unknown', lastName: 'User', role: 'admin' as const }
    }));
  }

  // Maintenance request operations
  async createMaintenanceRequest(request: InsertMaintenanceRequest): Promise<MaintenanceRequest> {
    const [newRequest] = await db.insert(maintenanceRequests).values(request).returning();
    return newRequest;
  }

  async getUserMaintenanceRequests(userId: string): Promise<MaintenanceRequestWithUsers[]> {
    const result = await db
      .select({
        id: maintenanceRequests.id,
        userId: maintenanceRequests.userId,
        title: maintenanceRequests.title,
        description: maintenanceRequests.description,
        category: maintenanceRequests.category,
        priority: maintenanceRequests.priority,
        status: maintenanceRequests.status,
        assignedTo: maintenanceRequests.assignedTo,
        unitNumber: maintenanceRequests.unitNumber,
        preferredTime: maintenanceRequests.preferredTime,
        createdAt: maintenanceRequests.createdAt,
        updatedAt: maintenanceRequests.updatedAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          unitNumber: users.unitNumber,
        },
      })
      .from(maintenanceRequests)
      .leftJoin(users, eq(maintenanceRequests.userId, users.id))
      .where(eq(maintenanceRequests.userId, userId))
      .orderBy(desc(maintenanceRequests.createdAt));

    const requestsWithAssignee = await Promise.all(
      result.map(async (req) => {
        let assignee = null;
        if (req.assignedTo) {
          const [assigneeUser] = await db
            .select({
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
              role: users.role,
            })
            .from(users)
            .where(eq(users.id, req.assignedTo));
          assignee = assigneeUser;
        }

        return {
          ...req,
          user: req.user || { id: '', firstName: 'Unknown', lastName: 'User', unitNumber: null },
          assignee,
        };
      })
    );

    return requestsWithAssignee;
  }

  async getAllMaintenanceRequests(): Promise<MaintenanceRequestWithUsers[]> {
    const result = await db
      .select({
        id: maintenanceRequests.id,
        userId: maintenanceRequests.userId,
        title: maintenanceRequests.title,
        description: maintenanceRequests.description,
        category: maintenanceRequests.category,
        priority: maintenanceRequests.priority,
        status: maintenanceRequests.status,
        assignedTo: maintenanceRequests.assignedTo,
        unitNumber: maintenanceRequests.unitNumber,
        preferredTime: maintenanceRequests.preferredTime,
        createdAt: maintenanceRequests.createdAt,
        updatedAt: maintenanceRequests.updatedAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          unitNumber: users.unitNumber,
        },
      })
      .from(maintenanceRequests)
      .leftJoin(users, eq(maintenanceRequests.userId, users.id))
      .orderBy(desc(maintenanceRequests.createdAt));

    const requestsWithAssignee = await Promise.all(
      result.map(async (req) => {
        let assignee = null;
        if (req.assignedTo) {
          const [assigneeUser] = await db
            .select({
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
              role: users.role,
            })
            .from(users)
            .where(eq(users.id, req.assignedTo));
          assignee = assigneeUser;
        }

        return {
          ...req,
          user: req.user || { id: '', firstName: 'Unknown', lastName: 'User', unitNumber: null },
          assignee,
        };
      })
    );

    return requestsWithAssignee;
  }

  async updateMaintenanceRequestStatus(requestId: string, status: string, assignedTo?: string): Promise<MaintenanceRequest> {
    const updateData: any = { status, updatedAt: new Date() };
    if (assignedTo) {
      updateData.assignedTo = assignedTo;
    }
    
    const [updatedRequest] = await db
      .update(maintenanceRequests)
      .set(updateData)
      .where(eq(maintenanceRequests.id, requestId))
      .returning();
    return updatedRequest;
  }

  // Additional user management methods
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async updateUserStatus(userId: string, status: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ status, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }
}

export const storage = new DatabaseStorage();
