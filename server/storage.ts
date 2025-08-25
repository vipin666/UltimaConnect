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
  biometricRequests,
  tenantDocuments,
  passwordResetTokens,
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
  type BiometricRequest,
  type BiometricRequestWithUser,
  type InsertBiometricRequest,
  type TenantDocument,
  type TenantDocumentWithUser,
  type InsertTenantDocument,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type BookingReport,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Local authentication
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<User>;
  
  // Password reset
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(tokenId: string): Promise<void>;
  
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
  
  // Biometric request operations
  createBiometricRequest(request: InsertBiometricRequest): Promise<BiometricRequest>;
  getBiometricRequests(): Promise<BiometricRequestWithUser[]>;
  getBiometricRequestsByUserId(userId: string): Promise<BiometricRequestWithUser[]>;
  updateBiometricRequest(id: string, updates: Partial<BiometricRequest>): Promise<BiometricRequest | undefined>;
  
  // Tenant document operations
  createTenantDocument(document: InsertTenantDocument): Promise<TenantDocument>;
  getTenantDocuments(): Promise<TenantDocumentWithUser[]>;
  getTenantDocumentsByUserId(userId: string): Promise<TenantDocumentWithUser[]>;
  updateTenantDocument(id: string, updates: Partial<TenantDocument>): Promise<TenantDocument | undefined>;
  
  // Booking report operations
  getBookingReport(): Promise<BookingReport>;
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

  // Local authentication
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Password reset
  async createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [resetToken] = await db.insert(passwordResetTokens).values(token).returning();
    return resetToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return resetToken;
  }

  async markTokenAsUsed(tokenId: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, tokenId));
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

  // Removed duplicate user management methods (already defined above)

  // Biometric request operations
  async getBiometricRequests(): Promise<BiometricRequestWithUser[]> {
    const requests = await db.select({
      id: biometricRequests.id,
      userId: biometricRequests.userId,
      requestType: biometricRequests.requestType,
      reason: biometricRequests.reason,
      accessLevel: biometricRequests.accessLevel,
      status: biometricRequests.status,
      approvedBy: biometricRequests.approvedBy,
      adminNotes: biometricRequests.adminNotes,
      requestDate: biometricRequests.requestDate,
      approvedDate: biometricRequests.approvedDate,
      expiryDate: biometricRequests.expiryDate,
      createdAt: biometricRequests.createdAt,
      updatedAt: biometricRequests.updatedAt,
      user: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        unitNumber: users.unitNumber,
        role: users.role,
      },
    })
    .from(biometricRequests)
    .leftJoin(users, eq(biometricRequests.userId, users.id))
    .orderBy(desc(biometricRequests.createdAt));

    return requests as BiometricRequestWithUser[];
  }

  async getBiometricRequestsByUserId(userId: string): Promise<BiometricRequestWithUser[]> {
    const requests = await db.select({
      id: biometricRequests.id,
      userId: biometricRequests.userId,
      requestType: biometricRequests.requestType,
      reason: biometricRequests.reason,
      accessLevel: biometricRequests.accessLevel,
      status: biometricRequests.status,
      approvedBy: biometricRequests.approvedBy,
      adminNotes: biometricRequests.adminNotes,
      requestDate: biometricRequests.requestDate,
      approvedDate: biometricRequests.approvedDate,
      expiryDate: biometricRequests.expiryDate,
      createdAt: biometricRequests.createdAt,
      updatedAt: biometricRequests.updatedAt,
      user: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        unitNumber: users.unitNumber,
        role: users.role,
      },
    })
    .from(biometricRequests)
    .leftJoin(users, eq(biometricRequests.userId, users.id))
    .where(eq(biometricRequests.userId, userId))
    .orderBy(desc(biometricRequests.createdAt));

    return requests as BiometricRequestWithUser[];
  }

  async createBiometricRequest(request: InsertBiometricRequest): Promise<BiometricRequest> {
    const [newRequest] = await db
      .insert(biometricRequests)
      .values(request)
      .returning();
    return newRequest;
  }

  async updateBiometricRequest(id: string, updates: Partial<BiometricRequest>): Promise<BiometricRequest | undefined> {
    const [updated] = await db
      .update(biometricRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(biometricRequests.id, id))
      .returning();
    return updated;
  }

  // Tenant document operations
  async getTenantDocuments(): Promise<TenantDocumentWithUser[]> {
    const documents = await db.select({
      id: tenantDocuments.id,
      userId: tenantDocuments.userId,
      documentType: tenantDocuments.documentType,
      documentName: tenantDocuments.documentName,
      filePath: tenantDocuments.filePath,
      fileSize: tenantDocuments.fileSize,
      mimeType: tenantDocuments.mimeType,
      status: tenantDocuments.status,
      reviewedBy: tenantDocuments.reviewedBy,
      adminNotes: tenantDocuments.adminNotes,
      uploadDate: tenantDocuments.uploadDate,
      reviewDate: tenantDocuments.reviewDate,
      expiryDate: tenantDocuments.expiryDate,
      createdAt: tenantDocuments.createdAt,
      updatedAt: tenantDocuments.updatedAt,
      user: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        unitNumber: users.unitNumber,
      },
    })
    .from(tenantDocuments)
    .leftJoin(users, eq(tenantDocuments.userId, users.id))
    .orderBy(desc(tenantDocuments.createdAt));

    return documents as TenantDocumentWithUser[];
  }

  async getTenantDocumentsByUserId(userId: string): Promise<TenantDocumentWithUser[]> {
    const documents = await db.select({
      id: tenantDocuments.id,
      userId: tenantDocuments.userId,
      documentType: tenantDocuments.documentType,
      documentName: tenantDocuments.documentName,
      filePath: tenantDocuments.filePath,
      fileSize: tenantDocuments.fileSize,
      mimeType: tenantDocuments.mimeType,
      status: tenantDocuments.status,
      reviewedBy: tenantDocuments.reviewedBy,
      adminNotes: tenantDocuments.adminNotes,
      uploadDate: tenantDocuments.uploadDate,
      reviewDate: tenantDocuments.reviewDate,
      expiryDate: tenantDocuments.expiryDate,
      createdAt: tenantDocuments.createdAt,
      updatedAt: tenantDocuments.updatedAt,
      user: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        unitNumber: users.unitNumber,
      },
    })
    .from(tenantDocuments)
    .leftJoin(users, eq(tenantDocuments.userId, users.id))
    .where(eq(tenantDocuments.userId, userId))
    .orderBy(desc(tenantDocuments.createdAt));

    return documents as TenantDocumentWithUser[];
  }

  async createTenantDocument(document: InsertTenantDocument): Promise<TenantDocument> {
    const [newDocument] = await db
      .insert(tenantDocuments)
      .values(document)
      .returning();
    return newDocument;
  }

  async updateTenantDocument(id: string, updates: Partial<TenantDocument>): Promise<TenantDocument | undefined> {
    const [updated] = await db
      .update(tenantDocuments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tenantDocuments.id, id))
      .returning();
    return updated;
  }

  // Booking report operations
  async getBookingReport(): Promise<BookingReport> {
    // Get total bookings count
    const totalBookingsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings);
    const totalBookings = totalBookingsResult[0]?.count || 0;

    // Get bookings by status
    const activeBookingsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(eq(bookings.status, 'confirmed'));
    const activeBookings = activeBookingsResult[0]?.count || 0;

    const cancelledBookingsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(eq(bookings.status, 'cancelled'));
    const cancelledBookings = cancelledBookingsResult[0]?.count || 0;

    const completedBookingsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(eq(bookings.status, 'completed'));
    const completedBookings = completedBookingsResult[0]?.count || 0;

    // Get popular amenities
    const popularAmenitiesResult = await db
      .select({
        amenityName: amenities.name,
        bookingCount: sql<number>`count(${bookings.id})`,
      })
      .from(bookings)
      .leftJoin(amenities, eq(bookings.amenityId, amenities.id))
      .groupBy(amenities.name)
      .orderBy(desc(sql`count(${bookings.id})`))
      .limit(5);

    // Get bookings by month (last 12 months)
    const bookingsByMonthResult = await db
      .select({
        month: sql<string>`TO_CHAR(${bookings.createdAt}, 'YYYY-MM')`,
        count: sql<number>`count(*)`,
      })
      .from(bookings)
      .where(gte(bookings.createdAt, sql`NOW() - INTERVAL '12 months'`))
      .groupBy(sql`TO_CHAR(${bookings.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${bookings.createdAt}, 'YYYY-MM')`);

    // Get recent bookings (last 10)
    const recentBookingsResult = await db
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
      .orderBy(desc(bookings.createdAt))
      .limit(10);

    const recentBookings = recentBookingsResult.filter(result => result.amenity !== null) as BookingWithAmenity[];

    return {
      totalBookings,
      activeBookings,
      cancelledBookings,
      completedBookings,
      popularAmenities: popularAmenitiesResult.map(item => ({
        amenityName: item.amenityName || 'Unknown',
        bookingCount: item.bookingCount,
      })),
      bookingsByMonth: bookingsByMonthResult.map(item => ({
        month: item.month,
        count: item.count,
      })),
      recentBookings,
    };
  }
}

export const storage = new DatabaseStorage();
