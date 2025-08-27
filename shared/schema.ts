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
  numeric,
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
export const userRoleEnum = pgEnum('user_role', ['resident', 'admin', 'super_admin', 'watchman', 'caretaker', 'secretary', 'president', 'treasurer', 'committee_member']);

// User status enum
export const userStatusEnum = pgEnum('user_status', ['active', 'pending', 'suspended']);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  username: varchar("username").unique(), // For local authentication
  password: varchar("password"), // Hashed password for local auth
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('resident').notNull(),
  status: userStatusEnum("status").default('pending').notNull(),
  unitNumber: varchar("unit_number"),
  phone: varchar("phone", { length: 20 }),
  isOwner: boolean("is_owner").default(true).notNull(),
  ownerId: varchar("owner_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Post types enum
export const postTypeEnum = pgEnum('post_type', ['general', 'complaint', 'suggestion', 'event']);

// Post status enum
export const postStatusEnum = pgEnum('post_status', ['active', 'resolved', 'rejected', 'frozen']);

// Posts table
export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  type: postTypeEnum("type").default('general').notNull(),
  status: postStatusEnum("status").default('active').notNull(),
  authorId: varchar("author_id").notNull().references(() => users.id),
  likes: integer("likes").default(0).notNull(),
  adminComment: text("admin_comment"), // Admin comment when resolving/rejecting
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
export const bookingStatusEnum = pgEnum('booking_status', ['pending', 'confirmed', 'cancelled', 'completed']);

// Bookings table
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  amenityId: varchar("amenity_id").notNull().references(() => amenities.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  bookingDate: date("booking_date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  status: bookingStatusEnum("status").default('pending').notNull(),
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

// Biometric access requests table
export const biometricRequests = pgTable("biometric_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  requestType: varchar("request_type").notNull(), // 'fingerprint', 'facial', 'card'
  reason: varchar("reason"), // Why requesting access
  accessLevel: varchar("access_level").default('basic'), // 'basic', 'full', 'maintenance'
  status: varchar("status").notNull().default('pending'), // 'pending', 'approved', 'rejected'
  approvedBy: varchar("approved_by").references(() => users.id),
  adminNotes: varchar("admin_notes"),
  requestDate: timestamp("request_date").defaultNow(),
  approvedDate: timestamp("approved_date"),
  expiryDate: timestamp("expiry_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tenant documents table
export const tenantDocuments = pgTable("tenant_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  documentType: varchar("document_type").notNull(), // 'lease', 'id_proof', 'income_proof', 'photo', 'other'
  documentName: varchar("document_name").notNull(),
  filePath: varchar("file_path").notNull(), // Object storage path
  fileSize: varchar("file_size"),
  mimeType: varchar("mime_type"),
  status: varchar("status").notNull().default('pending'), // 'pending', 'approved', 'rejected'
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  adminNotes: varchar("admin_notes"),
  uploadDate: timestamp("upload_date").defaultNow(),
  reviewDate: timestamp("review_date"),
  expiryDate: timestamp("expiry_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations for biometric requests
export const biometricRequestsRelations = relations(biometricRequests, ({ one }) => ({
  user: one(users, {
    fields: [biometricRequests.userId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [biometricRequests.approvedBy],
    references: [users.id],
  }),
}));

// Relations for tenant documents
export const tenantDocumentsRelations = relations(tenantDocuments, ({ one }) => ({
  user: one(users, {
    fields: [tenantDocuments.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [tenantDocuments.reviewedBy],
    references: [users.id],
  }),
}));

// New insert schemas
export const insertBiometricRequestSchema = createInsertSchema(biometricRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  requestDate: true,
  approvedDate: true,
});

export const insertTenantDocumentSchema = createInsertSchema(tenantDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  uploadDate: true,
  reviewDate: true,
});

// New types
export type BiometricRequest = typeof biometricRequests.$inferSelect;
export type InsertBiometricRequest = z.infer<typeof insertBiometricRequestSchema>;
export type TenantDocument = typeof tenantDocuments.$inferSelect;
export type InsertTenantDocument = z.infer<typeof insertTenantDocumentSchema>;

export type BiometricRequestWithUser = BiometricRequest & {
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'unitNumber' | 'role'>;
  approver?: Pick<User, 'id' | 'firstName' | 'lastName' | 'role'> | null;
};

export type TenantDocumentWithUser = TenantDocument & {
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'unitNumber'>;
  reviewer?: Pick<User, 'id' | 'firstName' | 'lastName' | 'role'> | null;
};

// Booking report types
// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Financial Management Tables

// Fee types enum
export const feeTypeEnum = pgEnum('fee_type', ['maintenance', 'parking', 'amenity', 'security', 'utilities', 'penalty', 'other']);

// Fee frequency enum
export const feeFrequencyEnum = pgEnum('fee_frequency', ['monthly', 'quarterly', 'annually', 'one_time']);

// Payment status enum
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'overdue', 'cancelled']);

// Payment method enum
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'bank_transfer', 'upi', 'cheque', 'card', 'online']);

// Visitor verification status enum
export const visitorStatusEnum = pgEnum('visitor_status', ['pending', 'approved', 'rejected', 'checked_in', 'checked_out']);

// Visitor purpose enum
export const visitorPurposeEnum = pgEnum('visitor_purpose', ['personal', 'business', 'delivery', 'service', 'emergency', 'other']);

// Fee types table
export const feeTypes = pgTable("fee_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  type: feeTypeEnum("type").notNull(),
  description: text("description"),
  defaultAmount: numeric("default_amount", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Fee schedules table
export const feeSchedules = pgTable("fee_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  feeTypeId: varchar("fee_type_id").notNull().references(() => feeTypes.id),
  name: varchar("name", { length: 100 }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  frequency: feeFrequencyEnum("frequency").notNull(),
  dueDay: integer("due_day").default(1), // Day of month for monthly fees
  isActive: boolean("is_active").default(true).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  applicableUnits: text("applicable_units").array(), // Unit patterns like ["1*", "2*"] for floors 1&2
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Fee transactions table
export const feeTransactions = pgTable("fee_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  feeScheduleId: varchar("fee_schedule_id").references(() => feeSchedules.id),
  feeTypeId: varchar("fee_type_id").notNull().references(() => feeTypes.id),
  description: varchar("description", { length: 255 }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: date("due_date").notNull(),
  status: paymentStatusEnum("status").default('pending').notNull(),
  penaltyAmount: numeric("penalty_amount", { precision: 10, scale: 2 }).default('0'),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  unitNumber: varchar("unit_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payments table
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  feeTransactionId: varchar("fee_transaction_id").notNull().references(() => feeTransactions.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  paymentDate: timestamp("payment_date").defaultNow(),
  referenceNumber: varchar("reference_number"),
  transactionId: varchar("transaction_id"),
  notes: text("notes"),
  receiptNumber: varchar("receipt_number"),
  processedBy: varchar("processed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Visitors table
export const visitors = pgTable("visitors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  phone: varchar("phone").notNull(),
  email: varchar("email"),
  purpose: visitorPurposeEnum("purpose").notNull(),
  purposeDetails: text("purpose_details"),
  unitToVisit: varchar("unit_to_visit").notNull(),
  hostUserId: varchar("host_user_id").notNull().references(() => users.id),
  photoUrl: varchar("photo_url"),
  idProofType: varchar("id_proof_type"),
  idProofNumber: varchar("id_proof_number"),
  idProofPhotoUrl: varchar("id_proof_photo_url"),
  status: visitorStatusEnum("status").default('pending').notNull(),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  expectedDuration: varchar("expected_duration"),
  actualDuration: varchar("actual_duration"),
  verificationNotes: text("verification_notes"),
  watchmanId: varchar("watchman_id").notNull().references(() => users.id),
  verifiedBy: varchar("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  rejectionReason: text("rejection_reason"),
  emergencyContact: varchar("emergency_contact"),
  vehicleNumber: varchar("vehicle_number"),
  guestParkingSlot: varchar("guest_parking_slot"),
  accompanyingPersons: integer("accompanying_persons").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Visitor notifications table
export const visitorNotifications = pgTable("visitor_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  visitorId: varchar("visitor_id").notNull().references(() => visitors.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  actionTaken: varchar("action_taken"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Password reset tokens relations
export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

// Insert schema for password reset tokens
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

// Types for password reset
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;

export type BookingReport = {
  totalBookings: number;
  activeBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  popularAmenities: { amenityName: string; bookingCount: number }[];
  bookingsByMonth: { month: string; count: number }[];
  recentBookings: BookingWithAmenity[];
};

// Financial relations
export const feeTypesRelations = relations(feeTypes, ({ many }) => ({
  schedules: many(feeSchedules),
  transactions: many(feeTransactions),
}));

export const feeSchedulesRelations = relations(feeSchedules, ({ one, many }) => ({
  feeType: one(feeTypes, {
    fields: [feeSchedules.feeTypeId],
    references: [feeTypes.id],
  }),
  transactions: many(feeTransactions),
}));

export const feeTransactionsRelations = relations(feeTransactions, ({ one, many }) => ({
  user: one(users, {
    fields: [feeTransactions.userId],
    references: [users.id],
  }),
  feeType: one(feeTypes, {
    fields: [feeTransactions.feeTypeId],
    references: [feeTypes.id],
  }),
  feeSchedule: one(feeSchedules, {
    fields: [feeTransactions.feeScheduleId],
    references: [feeSchedules.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  feeTransaction: one(feeTransactions, {
    fields: [payments.feeTransactionId],
    references: [feeTransactions.id],
  }),
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  processedByUser: one(users, {
    fields: [payments.processedBy],
    references: [users.id],
  }),
}));

// Payment notifications table for tracking defaulters
export const paymentNotifications = pgTable("payment_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  feeTransactionId: varchar("fee_transaction_id").notNull().references(() => feeTransactions.id),
  notificationType: varchar("notification_type").notNull(), // 'reminder', 'overdue', 'final_notice'
  daysOverdue: integer("days_overdue").notNull(),
  message: text("message").notNull(),
  sentDate: timestamp("sent_date").defaultNow(),
  isRead: boolean("is_read").default(false).notNull(),
  nextReminderDate: timestamp("next_reminder_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment schedules for advance payments and partial payments tracking
export const paymentSchedules = pgTable("payment_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  feeTransactionId: varchar("fee_transaction_id").notNull().references(() => feeTransactions.id),
  scheduledAmount: numeric("scheduled_amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: date("due_date").notNull(),
  status: varchar("status").default('pending').notNull(), // 'pending', 'paid', 'overdue'
  paidAmount: numeric("paid_amount", { precision: 10, scale: 2 }).default('0'),
  remainingAmount: numeric("remaining_amount", { precision: 10, scale: 2 }).notNull(),
  isAdvancePayment: boolean("is_advance_payment").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Defaulter tracking table
export const defaulterTracking = pgTable("defaulter_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  unitNumber: varchar("unit_number").notNull(),
  totalOutstandingAmount: numeric("total_outstanding_amount", { precision: 10, scale: 2 }).notNull(),
  oldestDueDate: date("oldest_due_date").notNull(),
  daysInDefault: integer("days_in_default").notNull(),
  lastNotificationDate: timestamp("last_notification_date"),
  notificationCount: integer("notification_count").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Add relations for new tables
export const paymentNotificationsRelations = relations(paymentNotifications, ({ one }) => ({
  user: one(users, {
    fields: [paymentNotifications.userId],
    references: [users.id],
  }),
  feeTransaction: one(feeTransactions, {
    fields: [paymentNotifications.feeTransactionId],
    references: [feeTransactions.id],
  }),
}));

export const paymentSchedulesRelations = relations(paymentSchedules, ({ one }) => ({
  user: one(users, {
    fields: [paymentSchedules.userId],
    references: [users.id],
  }),
  feeTransaction: one(feeTransactions, {
    fields: [paymentSchedules.feeTransactionId],
    references: [feeTransactions.id],
  }),
}));

export const defaulterTrackingRelations = relations(defaulterTracking, ({ one }) => ({
  user: one(users, {
    fields: [defaulterTracking.userId],
    references: [users.id],
  }),
}));

// Financial Management Types
export type FeeType = typeof feeTypes.$inferSelect;
export type InsertFeeType = typeof feeTypes.$inferInsert;
export type FeeSchedule = typeof feeSchedules.$inferSelect;
export type InsertFeeSchedule = typeof feeSchedules.$inferInsert;
export type FeeTransaction = typeof feeTransactions.$inferSelect;
export type InsertFeeTransaction = typeof feeTransactions.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// Financial Management Insert Schemas
export const insertFeeTypeSchema = createInsertSchema(feeTypes);
export const insertFeeScheduleSchema = createInsertSchema(feeSchedules);
export const insertFeeTransactionSchema = createInsertSchema(feeTransactions);
export const insertPaymentSchema = createInsertSchema(payments);

// Financial extended types with relations
export type FeeTransactionWithDetails = FeeTransaction & {
  user: { id: string; firstName: string | null; lastName: string | null; unitNumber: string | null };
  feeType: FeeType;
  feeSchedule?: FeeSchedule | null;
  payments: Payment[];
  totalPaid: string;
  remainingAmount: string;
};

export type PaymentWithDetails = Payment & {
  feeTransaction: FeeTransaction & {
    feeType: FeeType;
    user: { id: string; firstName: string | null; lastName: string | null; unitNumber: string | null };
  };
  processedByUser?: { id: string; firstName: string | null; lastName: string | null } | null;
};

export type FinancialSummary = {
  totalPending: string;
  totalPaid: string;
  totalOverdue: string;
  monthlyCollection: string;
  pendingCount: number;
  paidCount: number;
  overdueCount: number;
};

// Visitor relations
export const visitorsRelations = relations(visitors, ({ one, many }) => ({
  host: one(users, {
    fields: [visitors.hostUserId],
    references: [users.id],
  }),
  watchman: one(users, {
    fields: [visitors.watchmanId],
    references: [users.id],
  }),
  verifiedByUser: one(users, {
    fields: [visitors.verifiedBy],
    references: [users.id],
  }),
  notifications: many(visitorNotifications),
}));

export const visitorNotificationsRelations = relations(visitorNotifications, ({ one }) => ({
  visitor: one(visitors, {
    fields: [visitorNotifications.visitorId],
    references: [visitors.id],
  }),
  user: one(users, {
    fields: [visitorNotifications.userId],
    references: [users.id],
  }),
}));

// Visitor Management Types
export type Visitor = typeof visitors.$inferSelect;
export type InsertVisitor = typeof visitors.$inferInsert;
export type VisitorNotification = typeof visitorNotifications.$inferSelect;
export type InsertVisitorNotification = typeof visitorNotifications.$inferInsert;

// Visitor Management Insert Schemas
export const insertVisitorSchema = createInsertSchema(visitors);
export const insertVisitorNotificationSchema = createInsertSchema(visitorNotifications);

// Visitor with relations
export type VisitorWithDetails = Visitor & {
  host: { id: string; firstName: string | null; lastName: string | null; unitNumber: string | null };
  watchman: { id: string; firstName: string | null; lastName: string | null };
  verifiedByUser?: { id: string; firstName: string | null; lastName: string | null } | null;
  notifications?: VisitorNotification[];
};

// New table types
export type PaymentNotification = typeof paymentNotifications.$inferSelect;
export type InsertPaymentNotification = typeof paymentNotifications.$inferInsert;
export type PaymentSchedule = typeof paymentSchedules.$inferSelect;
export type InsertPaymentSchedule = typeof paymentSchedules.$inferInsert;
export type DefaulterTracking = typeof defaulterTracking.$inferSelect;
export type InsertDefaulterTracking = typeof defaulterTracking.$inferInsert;

// Insert schemas for new tables
export const insertPaymentNotificationSchema = createInsertSchema(paymentNotifications);
export const insertPaymentScheduleSchema = createInsertSchema(paymentSchedules);
export const insertDefaulterTrackingSchema = createInsertSchema(defaulterTracking);

// Extended types for new functionality
export type PaymentNotificationWithDetails = PaymentNotification & {
  user: { id: string; firstName: string | null; lastName: string | null; unitNumber: string | null };
  feeTransaction: FeeTransaction & {
    feeType: FeeType;
  };
};

export type DefaulterWithDetails = DefaulterTracking & {
  user: { id: string; firstName: string | null; lastName: string | null; unitNumber: string | null };
  outstandingTransactions: FeeTransactionWithDetails[];
};

export type PaymentScheduleWithDetails = PaymentSchedule & {
  user: { id: string; firstName: string | null; lastName: string | null; unitNumber: string | null };
  feeTransaction: FeeTransaction & {
    feeType: FeeType;
  };
};
