import {
  users,
  posts,
  comments,
  amenities,
  bookings,
  guestNotifications,
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
  getUserGuestNotifications(userId: string): Promise<GuestNotification[]>;
  updateGuestNotification(notificationId: string, updates: Partial<GuestNotification>): Promise<GuestNotification>;
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
          comments: postComments.filter(comment => comment.author !== null) as any,
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
          comments: postComments.filter(comment => comment.author !== null) as any,
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

  async getUserGuestNotifications(userId: string): Promise<GuestNotification[]> {
    return await db
      .select()
      .from(guestNotifications)
      .where(eq(guestNotifications.userId, userId))
      .orderBy(desc(guestNotifications.createdAt));
  }

  async updateGuestNotification(notificationId: string, updates: Partial<GuestNotification>): Promise<GuestNotification> {
    const [notification] = await db
      .update(guestNotifications)
      .set(updates)
      .where(eq(guestNotifications.id, notificationId))
      .returning();
    return notification;
  }
}

export const storage = new DatabaseStorage();
