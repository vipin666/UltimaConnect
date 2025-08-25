import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  pgEnum,
  boolean,
  date,
  time,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum('user_role', ['resident', 'admin', 'super_admin', 'watchman']);

// User status enum
export const userStatusEnum = pgEnum('user_status', ['active', 'pending', 'suspended']);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('resident').notNull(),
  status: userStatusEnum("status").default('pending').notNull(),
  unitNumber: varchar("unit_number"),
  isOwner: boolean("is_owner").default(true).notNull(),
  ownerId: varchar("owner_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Post types enum
export const postTypeEnum = pgEnum('post_type', ['general', 'complaint', 'suggestion', 'event']);

// Post status enum
export const postStatusEnum = pgEnum('post_status', ['active', 'resolved', 'frozen']);

// Posts table
export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  type: postTypeEnum("type").default('general').notNull(),
  status: postStatusEnum("status").default('active').notNull(),
  authorId: varchar("author_id").notNull().references(() => users.id),
  likes: integer("likes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Comments table
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  postId: varchar("post_id").notNull().references(() => posts.id, { onDelete: 'cascade' }),
  authorId: varchar("author_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Amenity types enum
export const amenityTypeEnum = pgEnum('amenity_type', ['swimming_pool', 'pool_table', 'party_hall', 'guest_parking', 'gym']);

// Amenities table
export const amenities = pgTable("amenities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  type: amenityTypeEnum("type").notNull(),
  location: varchar("location", { length: 100 }),
  maxSlots: integer("max_slots").default(1).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
});

// Booking status enum
export const bookingStatusEnum = pgEnum('booking_status', ['confirmed', 'cancelled', 'completed']);

// Bookings table
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  amenityId: varchar("amenity_id").notNull().references(() => amenities.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  bookingDate: date("booking_date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  status: bookingStatusEnum("status").default('confirmed').notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Guest notifications table
export const guestNotifications = pgTable("guest_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  guestName: varchar("guest_name", { length: 100 }).notNull(),
  guestPhone: varchar("guest_phone", { length: 20 }),
  purpose: text("purpose"),
  arrivalTime: timestamp("arrival_time"),
  departureTime: timestamp("departure_time"),
  parkingSlot: varchar("parking_slot", { length: 10 }),
  isActive: boolean("is_active").default(true).notNull(),
  watchmanApproved: boolean("watchman_approved").default(false).notNull(),
  watchmanNotes: text("watchman_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Direct messages table
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Announcements table (for admin/committee broadcasts)
export const announcements = pgTable("announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull().references(() => users.id),
  targetRoles: text("target_roles").array().default(['resident']).notNull(), // ['resident', 'watchman', 'admin']
  isUrgent: boolean("is_urgent").default(false).notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Maintenance requests table
export const maintenanceRequests = pgTable("maintenance_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // 'plumbing', 'electrical', 'general', etc.
  priority: varchar("priority", { length: 20 }).default('medium').notNull(), // 'low', 'medium', 'high', 'urgent'
  status: varchar("status", { length: 20 }).default('pending').notNull(), // 'pending', 'assigned', 'in_progress', 'completed', 'cancelled'
  assignedTo: varchar("assigned_to").references(() => users.id),
  unitNumber: varchar("unit_number", { length: 10 }),
  preferredTime: varchar("preferred_time", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  owner: one(users, {
    fields: [users.ownerId],
    references: [users.id],
    relationName: "owner_tenant",
  }),
  tenants: many(users, {
    relationName: "owner_tenant",
  }),
  posts: many(posts),
  comments: many(comments),
  bookings: many(bookings),
  guestNotifications: many(guestNotifications),
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" }),
  announcements: many(announcements),
  maintenanceRequests: many(maintenanceRequests, { relationName: "requester" }),
  assignedMaintenanceRequests: many(maintenanceRequests, { relationName: "assignee" }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  amenity: one(amenities, {
    fields: [bookings.amenityId],
    references: [amenities.id],
  }),
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
}));

export const guestNotificationsRelations = relations(guestNotifications, ({ one }) => ({
  user: one(users, {
    fields: [guestNotifications.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
  author: one(users, {
    fields: [announcements.authorId],
    references: [users.id],
  }),
}));

export const maintenanceRequestsRelations = relations(maintenanceRequests, ({ one }) => ({
  user: one(users, {
    fields: [maintenanceRequests.userId],
    references: [users.id],
    relationName: "requester",
  }),
  assignee: one(users, {
    fields: [maintenanceRequests.assignedTo],
    references: [users.id],
    relationName: "assignee",
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  likes: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export const insertGuestNotificationSchema = createInsertSchema(guestNotifications).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
});

export const insertMaintenanceRequestSchema = createInsertSchema(maintenanceRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
export type Amenity = typeof amenities.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertGuestNotification = z.infer<typeof insertGuestNotificationSchema>;
export type GuestNotification = typeof guestNotifications.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcements.$inferSelect;
export type InsertMaintenanceRequest = z.infer<typeof insertMaintenanceRequestSchema>;
export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;

// Extended types for API responses
export type PostWithAuthor = Post & {
  author: Pick<User, 'id' | 'firstName' | 'lastName' | 'unitNumber'>;
  comments: (Comment & {
    author: Pick<User, 'id' | 'firstName' | 'lastName' | 'unitNumber'>;
  })[];
};

export type BookingWithAmenity = Booking & {
  amenity: Amenity;
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'unitNumber'>;
};

export type MessageWithUsers = Message & {
  sender: Pick<User, 'id' | 'firstName' | 'lastName' | 'unitNumber' | 'role'>;
  receiver: Pick<User, 'id' | 'firstName' | 'lastName' | 'unitNumber' | 'role'>;
};

export type AnnouncementWithAuthor = Announcement & {
  author: Pick<User, 'id' | 'firstName' | 'lastName' | 'role'>;
};

export type MaintenanceRequestWithUsers = MaintenanceRequest & {
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'unitNumber'>;
  assignee?: Pick<User, 'id' | 'firstName' | 'lastName' | 'role'> | null;
};

export type GuestNotificationWithUser = GuestNotification & {
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'unitNumber'>;
};
