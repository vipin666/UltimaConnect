import sqlite3 from 'sqlite3';
import { hashPassword, comparePasswords } from './auth';

// Create SQLite database connection
const dbPath = './tower-connect.db';
const sqlite = new sqlite3.Database(dbPath);

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<any | undefined>;
  upsertUser(user: any): Promise<any>;
  
  // Local authentication
  getUserByUsername(username: string): Promise<any | undefined>;
  getUserByEmail(email: string): Promise<any | undefined>;
  getUsersByRole(role: string): Promise<any[]>;
  createUser(user: any): Promise<any>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<any>;
  updateUser(id: string, updates: any): Promise<any>;
  deleteUser(id: string): Promise<void>;
  
  // Password reset
  createPasswordResetToken(token: any): Promise<any>;
  getPasswordResetToken(token: string): Promise<any | undefined>;
  markTokenAsUsed(tokenId: string): Promise<void>;
  
  // User management
  getAllUsers(): Promise<any[]>;
  updateUser(userId: string, updates: any): Promise<any>;
  updateUserStatus(userId: string, status: string): Promise<any>;
  deleteUser(userId: string): Promise<void>;
  
  // Post operations
  getPosts(): Promise<any[]>;
  getPostsByType(type: string): Promise<any[]>;
  getPost(id: string): Promise<any | undefined>;
  createPost(post: any): Promise<any>;
  updatePost(id: string, updates: any): Promise<any>;
  updatePostStatus(id: string, status: string): Promise<any>;
  deletePost(id: string): Promise<void>;
  likePost(postId: string, userId: string): Promise<any>;
  
  // Comment operations
  getComments(postId: string): Promise<any[]>;
  getComment(id: string): Promise<any | undefined>;
  createComment(comment: any): Promise<any>;
  deleteComment(id: string): Promise<void>;
  
  // Amenity operations
  getAmenities(): Promise<any[]>;
  getAmenity(id: string): Promise<any | undefined>;
  createAmenity(amenity: any): Promise<any>;
  updateAmenity(id: string, updates: any): Promise<any>;
  deleteAmenity(id: string): Promise<void>;
  
  // Booking operations
  getBookings(): Promise<any[]>;
  getBooking(id: string): Promise<any | undefined>;
  createBooking(booking: any): Promise<any>;
  updateBooking(id: string, updates: any): Promise<any>;
  deleteBooking(id: string): Promise<void>;
  getBookingsByUser(userId: string): Promise<any[]>;
  getUserBookings(userId: string): Promise<any[]>;
  getBookingsByAmenity(amenityId: string): Promise<any[]>;
  getBookingsByAmenityAndDate(amenityId: string, date: string): Promise<any[]>;
  cancelBooking(bookingId: string): Promise<any>;
  rejectBooking(bookingId: string, reason?: string): Promise<any>;
  
  // Guest notification operations
  getGuestNotifications(): Promise<any[]>;
  getUserGuestNotifications(userId: string): Promise<any[]>;
  createGuestNotification(notification: any): Promise<any>;
  updateGuestNotification(id: string, updates: any): Promise<any>;
  deleteGuestNotification(id: string): Promise<void>;
  
  // Message operations
  getMessages(): Promise<any[]>;
  createMessage(message: any): Promise<any>;
  deleteMessage(id: string): Promise<void>;
  markMessageAsRead(messageId: string): Promise<any>;
  
  // Announcement operations
  getAnnouncements(): Promise<any[]>;
  getAnnouncementsForRole(role: string): Promise<any[]>;
  createAnnouncement(announcement: any): Promise<any>;
  updateAnnouncement(id: string, updates: any): Promise<any>;
  deleteAnnouncement(id: string): Promise<void>;
  
  // Maintenance request operations
  getMaintenanceRequests(): Promise<any[]>;
  createMaintenanceRequest(request: any): Promise<any>;
  updateMaintenanceRequest(id: string, updates: any): Promise<any>;
  deleteMaintenanceRequest(id: string): Promise<void>;
  
  // Biometric request operations
  getBiometricRequests(): Promise<any[]>;
  getBiometricRequestsByUserId(userId: string): Promise<any[]>;
  createBiometricRequest(request: any): Promise<any>;
  updateBiometricRequest(id: string, updates: any): Promise<any>;
  deleteBiometricRequest(id: string): Promise<void>;
  enableBiometricAccess(userId: string, requestType: string, accessLevel: string): Promise<any>;
  disableBiometricAccess(userId: string): Promise<any>;
  getUserBiometricStatus(userId: string): Promise<any>;
  
  // Flat management operations
  getFlats(): Promise<any[]>;
  getFlat(id: string): Promise<any>;
  createFlat(flat: any): Promise<any>;
  updateFlat(id: string, updates: any): Promise<any>;
  deleteFlat(id: string): Promise<void>;
  assignFlatToUser(flatId: string, userId: string, isOwner: boolean): Promise<any>;
  unassignFlatFromUser(flatId: string): Promise<any>;
  getUniqueUnitNumbers(): Promise<any[]>;
  
  // Tenant document operations
  getTenantDocuments(): Promise<any[]>;
  createTenantDocument(document: any): Promise<any>;
  updateTenantDocument(id: string, updates: any): Promise<any>;
  deleteTenantDocument(id: string): Promise<void>;
  
  // Financial operations
  getFeeTypes(): Promise<any[]>;
  createFeeType(feeType: any): Promise<any>;
  updateFeeType(id: string, updates: any): Promise<any>;
  deleteFeeType(id: string): Promise<void>;
  
  getFeeSchedules(): Promise<any[]>;
  createFeeSchedule(schedule: any): Promise<any>;
  updateFeeSchedule(id: string, updates: any): Promise<any>;
  deleteFeeSchedule(id: string): Promise<void>;
  
  getFeeTransactions(): Promise<any[]>;
  getFeeTransactionsByUser(userId: string): Promise<any[]>;
  createFeeTransaction(transaction: any): Promise<any>;
  updateFeeTransaction(id: string, updates: any): Promise<any>;
  deleteFeeTransaction(id: string): Promise<void>;
  
  getPayments(): Promise<any[]>;
  getPaymentsByUser(userId: string): Promise<any[]>;
  createPayment(payment: any): Promise<any>;
  updatePayment(id: string, updates: any): Promise<any>;
  deletePayment(id: string): Promise<void>;
  
  getPaymentNotifications(): Promise<any[]>;
  createPaymentNotification(notification: any): Promise<any>;
  updatePaymentNotification(id: string, updates: any): Promise<any>;
  deletePaymentNotification(id: string): Promise<void>;
  
  getPaymentSchedules(): Promise<any[]>;
  createPaymentSchedule(schedule: any): Promise<any>;
  updatePaymentSchedule(id: string, updates: any): Promise<any>;
  deletePaymentSchedule(id: string): Promise<void>;
  
  getDefaulterTracking(): Promise<any[]>;
  createDefaulterTracking(tracking: any): Promise<any>;
  updateDefaulterTracking(id: string, updates: any): Promise<any>;
  deleteDefaulterTracking(id: string): Promise<void>;
  
  // Visitor operations
  getVisitors(): Promise<any[]>;
  getVisitorsByWatchman(watchmanId: string): Promise<any[]>;
  getVisitorsForHost(hostUserId: string): Promise<any[]>;
  getVisitorsByStatus(status: string): Promise<any[]>;
  getGuestParkingBookings(): Promise<any[]>;
  getGuestParkingBookingsByUser(userId: string): Promise<any[]>;
  getVisitor(id: string): Promise<any>;
  createVisitor(visitor: any): Promise<any>;
  updateVisitor(id: string, updates: any): Promise<any>;
  deleteVisitor(id: string): Promise<void>;
  
  getVisitorNotifications(): Promise<any[]>;
  createVisitorNotification(notification: any): Promise<any>;
  updateVisitorNotification(id: string, updates: any): Promise<any>;
  deleteVisitorNotification(id: string): Promise<void>;
}

// Helper function to run SQLite queries
function runQuery<T>(query: string, params: any[] = []): Promise<T> {
  return new Promise((resolve, reject) => {
    sqlite.get(query, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row as T);
      }
    });
  });
}

function runQueryAll<T>(query: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    sqlite.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows as T[]);
      }
    });
  });
}

function runQueryRun(query: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    sqlite.run(query, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export const storage: IStorage = {
  // User operations
  async getUser(id: string) {
    return runQuery('SELECT * FROM users WHERE id = ?', [id]);
  },

  async upsertUser(user: any) {
    const existingUser = await this.getUser(user.id);
    if (existingUser) {
      await runQueryRun(
        'UPDATE users SET username = ?, firstName = ?, lastName = ?, email = ?, unitNumber = ?, role = ?, status = ?, isOwner = ?, profileImageUrl = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [user.username, user.firstName, user.lastName, user.email, user.unitNumber, user.role, user.status, user.isOwner, user.profileImageUrl, user.id]
      );
      return this.getUser(user.id);
    } else {
      return this.createUser(user);
    }
  },

  async getUserByUsername(username: string) {
    return runQuery('SELECT * FROM users WHERE username = ?', [username.toLowerCase()]);
  },

  async getUserByEmail(email: string) {
    return runQuery('SELECT * FROM users WHERE email = ?', [email]);
  },

  async getUsersByRole(role: string) {
    return runQueryAll('SELECT * FROM users WHERE role = ?', [role]);
  },

  async createUser(user: any) {
    const id = user.id || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await runQueryRun(
      'INSERT INTO users (id, username, password, firstName, lastName, email, unitNumber, role, status, isOwner, profileImageUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, user.username.toLowerCase(), user.password, user.firstName, user.lastName, user.email, user.unitNumber, user.role, user.status, user.isOwner, user.profileImageUrl]
    );
    return this.getUser(id);
  },

  async updateUserPassword(userId: string, hashedPassword: string) {
    await runQueryRun('UPDATE users SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [hashedPassword, userId]);
    return this.getUser(userId);
  },

  async updateUser(id: string, updates: any) {
    const fields = [];
    const values = [];
    
    if (updates.firstName !== undefined) {
      fields.push('firstName = ?');
      values.push(updates.firstName);
    }
    if (updates.lastName !== undefined) {
      fields.push('lastName = ?');
      values.push(updates.lastName);
    }
    if (updates.username !== undefined) {
      fields.push('username = ?');
      values.push(updates.username.toLowerCase());
    }
    if (updates.email !== undefined) {
      fields.push('email = ?');
      values.push(updates.email);
    }
    if (updates.phone !== undefined) {
      fields.push('phone = ?');
      values.push(updates.phone);
    }
    if (updates.role !== undefined) {
      fields.push('role = ?');
      values.push(updates.role);
    }
    if (updates.unitNumber !== undefined) {
      fields.push('unitNumber = ?');
      values.push(updates.unitNumber);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    
    if (fields.length === 0) {
      return this.getUser(id);
    }
    
    fields.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(id);
    
    await runQueryRun(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.getUser(id);
  },

  async deleteUser(id: string) {
    await runQueryRun('DELETE FROM users WHERE id = ?', [id]);
  },

  // Password reset operations
  async createPasswordResetToken(token: any) {
    const id = `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await runQueryRun(
      'INSERT INTO passwordResetTokens (id, userId, token, expiresAt) VALUES (?, ?, ?, ?)',
      [id, token.userId, token.token, token.expiresAt]
    );
    return runQuery('SELECT * FROM passwordResetTokens WHERE id = ?', [id]);
  },

  async getPasswordResetToken(token: string) {
    return runQuery('SELECT * FROM passwordResetTokens WHERE token = ? AND expiresAt > CURRENT_TIMESTAMP AND used = 0', [token]);
  },

  async markTokenAsUsed(tokenId: string) {
    await runQueryRun('UPDATE passwordResetTokens SET used = 1 WHERE id = ?', [tokenId]);
  },

  // User management
  async getAllUsers() {
    return runQueryAll('SELECT * FROM users ORDER BY createdAt DESC');
  },

  async updateUserStatus(userId: string, status: string) {
    await runQueryRun(`UPDATE users SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`, [status, userId]);
    return this.getUser(userId);
  },

  // Post operations
  async getPosts() {
    const posts = await runQueryAll(`
      SELECT p.*, u.firstName, u.lastName, u.username,
             (SELECT COUNT(*) FROM post_likes WHERE postId = p.id) as likesCount,
             (SELECT COUNT(*) FROM comments WHERE postId = p.id) as commentsCount
      FROM posts p 
      LEFT JOIN users u ON p.authorId = u.id 
      ORDER BY p.createdAt DESC
    `);
    
    // Transform to include likes and comments data
    return posts.map(post => ({
      ...post,
      likes: post.likesCount,
      commentsCount: post.commentsCount,
      comments: [] // Will be populated separately if needed
    }));
  },

  async getPostsByType(type: string) {
    const posts = await runQueryAll(`
      SELECT p.*, u.firstName, u.lastName, u.username,
             (SELECT COUNT(*) FROM post_likes WHERE postId = p.id) as likesCount,
             (SELECT COUNT(*) FROM comments WHERE postId = p.id) as commentsCount
      FROM posts p 
      LEFT JOIN users u ON p.authorId = u.id 
      WHERE p.type = ?
      ORDER BY p.createdAt DESC
    `, [type]);
    
    // Transform to include likes and comments data
    return posts.map(post => ({
      ...post,
      likes: post.likesCount,
      commentsCount: post.commentsCount,
      comments: [] // Will be populated separately if needed
    }));
  },

  async getPost(id: string) {
    const post = await runQuery(`
      SELECT p.*, u.firstName, u.lastName, u.username,
             (SELECT COUNT(*) FROM post_likes WHERE postId = p.id) as likesCount,
             (SELECT COUNT(*) FROM comments WHERE postId = p.id) as commentsCount
      FROM posts p 
      LEFT JOIN users u ON p.authorId = u.id 
      WHERE p.id = ?
    `, [id]);
    
    if (!post) return null;
    
    // Get comments for this post
    const comments = await this.getComments(id);
    
    return {
      ...post,
      likes: post.likesCount,
      comments: comments
    };
  },

  async createPost(post: any) {
    const id = `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const status = post.status || 'active';
    await runQueryRun(
      'INSERT INTO posts (id, title, content, type, authorId, status) VALUES (?, ?, ?, ?, ?, ?)',
      [id, post.title, post.content, post.type, post.authorId, status]
    );
    return this.getPost(id);
  },

  async updatePost(id: string, updates: any) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    await runQueryRun(`UPDATE posts SET ${fields}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`, [...values, id]);
    return this.getPost(id);
  },

  async updatePostStatus(id: string, status: string, adminComment?: string) {
    if (adminComment) {
      await runQueryRun('UPDATE posts SET status = ?, admin_comment = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [status, adminComment, id]);
    } else {
      await runQueryRun('UPDATE posts SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
    }
    return this.getPost(id);
  },

  async likePost(postId: string, userId: string) {
    // Check if already liked
    const existingLike = await runQuery('SELECT * FROM post_likes WHERE postId = ? AND userId = ?', [postId, userId]);
    if (existingLike) {
      // Unlike
      await runQueryRun('DELETE FROM post_likes WHERE postId = ? AND userId = ?', [postId, userId]);
    } else {
      // Like
      const likeId = `like-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await runQueryRun('INSERT INTO post_likes (id, postId, userId) VALUES (?, ?, ?)', [likeId, postId, userId]);
    }
    return this.getPost(postId);
  },

  async hasUserLikedPost(postId: string, userId: string) {
    const like = await runQuery('SELECT * FROM post_likes WHERE postId = ? AND userId = ?', [postId, userId]);
    return !!like;
  },

  async getPostLikes(postId: string) {
    const likes = await runQueryAll(`
      SELECT pl.*, u.firstName, u.lastName, u.username, u.unitNumber
      FROM post_likes pl
      LEFT JOIN users u ON pl.userId = u.id
      WHERE pl.postId = ?
      ORDER BY pl.createdAt DESC
    `, [postId]);
    
    return likes.map(like => ({
      id: like.id,
      userId: like.userId,
      postId: like.postId,
      createdAt: like.createdAt,
      user: {
        firstName: like.firstName,
        lastName: like.lastName,
        username: like.username,
        unitNumber: like.unitNumber
      }
    }));
  },

  async deletePost(id: string) {
    await runQueryRun('DELETE FROM posts WHERE id = ?', [id]);
  },

  // Comment operations
  async getComments(postId: string) {
    const comments = await runQueryAll(`
      SELECT c.*, u.firstName, u.lastName, u.username 
      FROM comments c 
      LEFT JOIN users u ON c.authorId = u.id 
      WHERE c.postId = ? 
      ORDER BY c.createdAt ASC
    `, [postId]);
    
    // Transform the data to match the expected structure
    return comments.map((comment: any) => ({
      id: comment.id,
      content: comment.content,
      authorId: comment.authorId,
      postId: comment.postId,
      createdAt: comment.createdAt,
      author: {
        firstName: comment.firstName,
        lastName: comment.lastName,
        username: comment.username
      }
    }));
  },

  async getComment(id: string) {
    const comment = await runQuery(`
      SELECT c.*, u.firstName, u.lastName, u.username 
      FROM comments c 
      LEFT JOIN users u ON c.authorId = u.id 
      WHERE c.id = ?
    `, [id]);
    
    if (!comment) return null;
    
    // Transform the data to match the expected structure
    return {
      id: comment.id,
      content: comment.content,
      authorId: comment.authorId,
      postId: comment.postId,
      createdAt: comment.createdAt,
      author: {
        firstName: comment.firstName,
        lastName: comment.lastName,
        username: comment.username
      }
    };
  },

  async createComment(comment: any) {
    const id = `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await runQueryRun(
      'INSERT INTO comments (id, content, postId, authorId) VALUES (?, ?, ?, ?)',
      [id, comment.content, comment.postId, comment.authorId]
    );
    
    const createdComment = await runQuery(`
      SELECT c.*, u.firstName, u.lastName, u.username 
      FROM comments c 
      LEFT JOIN users u ON c.authorId = u.id 
      WHERE c.id = ?
    `, [id]);
    
    if (!createdComment) return null;
    
    // Transform the data to match the expected structure
    return {
      id: createdComment.id,
      content: createdComment.content,
      authorId: createdComment.authorId,
      postId: createdComment.postId,
      createdAt: createdComment.createdAt,
      author: {
        firstName: createdComment.firstName,
        lastName: createdComment.lastName,
        username: createdComment.username
      }
    };
  },

  async deleteComment(id: string) {
    await runQueryRun('DELETE FROM comments WHERE id = ?', [id]);
  },

  // Amenity operations
  async getAmenities() {
    return runQueryAll('SELECT * FROM amenities ORDER BY name');
  },

  async getAmenity(id: string) {
    return runQuery('SELECT * FROM amenities WHERE id = ?', [id]);
  },

  async createAmenity(amenity: any) {
    const id = `amenity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await runQueryRun(
      'INSERT INTO amenities (id, name, description, type, capacity, isActive) VALUES (?, ?, ?, ?, ?, ?)',
      [id, amenity.name, amenity.description, amenity.type, amenity.capacity, amenity.isActive]
    );
    return this.getAmenity(id);
  },

  async updateAmenity(id: string, updates: any) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    await runQueryRun(`UPDATE amenities SET ${fields} WHERE id = ?`, [...values, id]);
    return this.getAmenity(id);
  },

  async deleteAmenity(id: string) {
    await runQueryRun('DELETE FROM amenities WHERE id = ?', [id]);
  },

  // Booking operations
  async getBookings() {
    return runQueryAll(`
      SELECT b.*, 
             u.firstName, u.lastName, u.username, u.unitNumber,
             a.id as amenityId, a.name as amenityName, a.type as amenityType, 
             a.description as amenityDescription
      FROM bookings b 
      LEFT JOIN users u ON b.userId = u.id 
      LEFT JOIN amenities a ON b.amenityId = a.id 
      ORDER BY b.bookingDate DESC, b.startTime ASC
    `);
  },

  async getBooking(id: string) {
    return runQuery(`
      SELECT b.*, u.firstName, u.lastName, u.username, u.unitNumber, a.name as amenityName 
      FROM bookings b 
      LEFT JOIN users u ON b.userId = u.id 
      LEFT JOIN amenities a ON b.amenityId = a.id 
      WHERE b.id = ?
    `, [id]);
  },

  async createBooking(booking: any) {
    const id = `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await runQueryRun(
      'INSERT INTO bookings (id, userId, amenityId, bookingDate, startTime, endTime, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, booking.userId, booking.amenityId, booking.bookingDate, booking.startTime, booking.endTime, booking.status]
    );
    return this.getBooking(id);
  },

  async updateBooking(id: string, updates: any) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    await runQueryRun(`UPDATE bookings SET ${fields} WHERE id = ?`, [...values, id]);
    return this.getBooking(id);
  },

  async deleteBooking(id: string) {
    await runQueryRun('DELETE FROM bookings WHERE id = ?', [id]);
  },

  async getBookingsByUser(userId: string) {
    return runQueryAll(`
      SELECT b.*, 
             a.id as amenityId, a.name as amenityName, a.type as amenityType, 
             a.description as amenityDescription,
             u.firstName, u.lastName, u.username, u.unitNumber
      FROM bookings b 
      LEFT JOIN amenities a ON b.amenityId = a.id 
      LEFT JOIN users u ON b.userId = u.id
      WHERE b.userId = ? 
      ORDER BY b.bookingDate DESC, b.startTime ASC
    `, [userId]);
  },

  async getUserBookings(userId: string) {
    return runQueryAll(`
      SELECT b.*, 
             a.id as amenityId, a.name as amenityName, a.type as amenityType, 
             a.description as amenityDescription,
             u.firstName, u.lastName, u.username, u.unitNumber
      FROM bookings b 
      LEFT JOIN amenities a ON b.amenityId = a.id 
      LEFT JOIN users u ON b.userId = u.id
      WHERE b.userId = ? 
      ORDER BY b.bookingDate DESC, b.startTime ASC
    `, [userId]);
  },

  async getBookingsByAmenity(amenityId: string) {
    return runQueryAll(`
      SELECT b.*, u.firstName, u.lastName, u.username 
      FROM bookings b 
      LEFT JOIN users u ON b.userId = u.id 
      WHERE b.amenityId = ? 
      ORDER BY b.bookingDate DESC, b.startTime ASC
    `, [amenityId]);
  },

  async getBookingsByAmenityAndDate(amenityId: string, date: string) {
    return runQueryAll(`
      SELECT b.*, u.firstName, u.lastName, u.username, u.unitNumber 
      FROM bookings b 
      LEFT JOIN users u ON b.userId = u.id 
      WHERE b.amenityId = ? AND b.bookingDate = ? AND b.status IN ('confirmed', 'pending')
      ORDER BY b.startTime ASC
    `, [amenityId, date]);
  },

  async cancelBooking(bookingId: string) {
    await runQueryRun(`UPDATE bookings SET status = 'cancelled' WHERE id = ?`, [bookingId]);
    return this.getBooking(bookingId);
  },

  async rejectBooking(bookingId: string, reason?: string) {
    await runQueryRun(`UPDATE bookings SET status = 'rejected' WHERE id = ?`, [bookingId]);
    return this.getBooking(bookingId);
  },

  // Placeholder implementations for other operations
  async getGuestNotifications() { return []; },
  async getUserGuestNotifications(userId: string) { return []; },
  async createGuestNotification(notification: any) { return notification; },
  async updateGuestNotification(id: string, updates: any) { return updates; },
  async deleteGuestNotification(id: string) {},

  async getMessages() { return []; },
  async createMessage(message: any) { return message; },
  async deleteMessage(id: string) {},
  async markMessageAsRead(messageId: string) { return { id: messageId, isRead: true }; },

  async getAnnouncements() { return []; },
  async getAnnouncementsForRole(role: string) { return []; },
  async createAnnouncement(announcement: any) { return announcement; },
  async updateAnnouncement(id: string, updates: any) { return updates; },
  async deleteAnnouncement(id: string) {},

  async getMaintenanceRequests() { return []; },
  async createMaintenanceRequest(request: any) { return request; },
  async updateMaintenanceRequest(id: string, updates: any) { return updates; },
  async deleteMaintenanceRequest(id: string) {},

  async getBiometricRequests() {
    const rows = await runQueryAll(`
      SELECT br.*, u.firstName, u.lastName, u.unitNumber, u.role as userRole,
             a.firstName as approverFirstName, a.lastName as approverLastName
      FROM biometric_requests br
      LEFT JOIN users u ON br.userId = u.id
      LEFT JOIN users a ON br.approvedBy = a.id
      ORDER BY br.createdAt DESC
    `);
    
    // Transform the data to match frontend expectations
    return rows.map((row: any) => ({
      ...row,
      user: {
        id: row.userId,
        firstName: row.firstName,
        lastName: row.lastName,
        unitNumber: row.unitNumber,
        role: row.userRole
      },
      approvedByUser: row.approvedBy ? {
        id: row.approvedBy,
        firstName: row.approverFirstName,
        lastName: row.approverLastName
      } : null
    }));
  },

  async getBiometricRequestsByUserId(userId: string) {
    const rows = await runQueryAll(`
      SELECT br.*, u.firstName, u.lastName, u.unitNumber, u.role as userRole,
             a.firstName as approverFirstName, a.lastName as approverLastName
      FROM biometric_requests br
      LEFT JOIN users u ON br.userId = u.id
      LEFT JOIN users a ON br.approvedBy = a.id
      WHERE br.userId = ?
      ORDER BY br.createdAt DESC
    `, [userId]);
    
    // Transform the data to match frontend expectations
    return rows.map((row: any) => ({
      ...row,
      user: {
        id: row.userId,
        firstName: row.firstName,
        lastName: row.lastName,
        unitNumber: row.unitNumber,
        role: row.userRole
      },
      approvedByUser: row.approvedBy ? {
        id: row.approvedBy,
        firstName: row.approverFirstName,
        lastName: row.approverLastName
      } : null
    }));
  },

  async createBiometricRequest(request: any) {
    const id = `biometric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await runQueryRun(
      'INSERT INTO biometric_requests (id, userId, requestType, reason, accessLevel, status) VALUES (?, ?, ?, ?, ?, ?)',
      [id, request.userId, request.requestType, request.reason, request.accessLevel, 'pending']
    );
    return this.getBiometricRequestsByUserId(request.userId);
  },

  async updateBiometricRequest(id: string, updates: any) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(id);
    
    await runQueryRun(
      `UPDATE biometric_requests SET ${fields}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
    
    // Return the updated request
    const row = await runQuery(`
      SELECT br.*, u.firstName, u.lastName, u.unitNumber, u.role as userRole,
             a.firstName as approverFirstName, a.lastName as approverLastName
      FROM biometric_requests br
      LEFT JOIN users u ON br.userId = u.id
      LEFT JOIN users a ON br.approvedBy = a.id
      WHERE br.id = ?
    `, [id]);
    
    if (!row) return null;
    
    // Transform the data to match frontend expectations
    return {
      ...row,
      user: {
        id: row.userId,
        firstName: row.firstName,
        lastName: row.lastName,
        unitNumber: row.unitNumber,
        role: row.userRole
      },
      approvedByUser: row.approvedBy ? {
        id: row.approvedBy,
        firstName: row.approverFirstName,
        lastName: row.approverLastName
      } : null
    };
  },

  async deleteBiometricRequest(id: string) {
    await runQueryRun('DELETE FROM biometric_requests WHERE id = ?', [id]);
  },

  async enableBiometricAccess(userId: string, requestType: string, accessLevel: string) {
    // Create an approved biometric request
    const id = `biometric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const reason = `Admin enabled biometric access for user ${userId}`;
    
    await runQueryRun(
      `INSERT INTO biometric_requests (
        id, userId, requestType, reason, accessLevel, status, 
        approvedBy, approvedDate, expiryDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, userId, requestType, reason, accessLevel, 'approved',
        'admin-001', new Date().toISOString(),
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year expiry
      ]
    );
    
    return this.getUserBiometricStatus(userId);
  },

  async disableBiometricAccess(userId: string) {
    // Update all biometric requests for this user to rejected
    await runQueryRun(
      `UPDATE biometric_requests 
       SET status = 'rejected', 
           adminNotes = 'Access disabled by admin',
           updatedAt = CURRENT_TIMESTAMP 
       WHERE userId = ? AND status = 'approved'`,
      [userId]
    );
    
    return this.getUserBiometricStatus(userId);
  },

  async getUserBiometricStatus(userId: string) {
    const row = await runQuery(`
      SELECT br.*, u.firstName, u.lastName, u.unitNumber, u.role as userRole
      FROM biometric_requests br
      LEFT JOIN users u ON br.userId = u.id
      WHERE br.userId = ? AND br.status = 'approved'
      ORDER BY br.createdAt DESC
      LIMIT 1
    `, [userId]);
    
    if (!row) return null;
    
    // Transform the data to match frontend expectations
    return {
      ...row,
      user: {
        id: row.userId,
        firstName: row.firstName,
        lastName: row.lastName,
        unitNumber: row.unitNumber,
        role: row.userRole
      }
    };
  },

  // Flat management operations
  async getFlats() {
    return runQueryAll(`
      SELECT f.*, 
             u.firstName as ownerFirstName, u.lastName as ownerLastName, u.email as ownerEmail,
             COUNT(r.id) as residentCount
      FROM flats f
      LEFT JOIN users u ON f.ownerId = u.id
      LEFT JOIN users r ON r.unitNumber = f.flatNumber
      GROUP BY f.id
      ORDER BY f.flatNumber
    `);
  },

  async getFlat(id: string) {
    return runQuery(`
      SELECT f.*, 
             u.firstName as ownerFirstName, u.lastName as ownerLastName, u.email as ownerEmail
      FROM flats f
      LEFT JOIN users u ON f.ownerId = u.id
      WHERE f.id = ?
    `, [id]);
  },

  async createFlat(flat: any) {
    const id = `flat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await runQueryRun(
      `INSERT INTO flats (id, flatNumber, floorNumber, type, bedrooms, bathrooms, area, rentAmount, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, flat.flatNumber, flat.floorNumber, flat.type, flat.bedrooms, flat.bathrooms, flat.area, flat.rentAmount, 'available']
    );
    return this.getFlat(id);
  },

  async updateFlat(id: string, updates: any) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(id);
    
    await runQueryRun(
      `UPDATE flats SET ${fields}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
    
    return this.getFlat(id);
  },

  async deleteFlat(id: string) {
    await runQueryRun('DELETE FROM flats WHERE id = ?', [id]);
  },

  async assignFlatToUser(flatId: string, userId: string, isOwner: boolean) {
    const flat = await this.getFlat(flatId);
    if (!flat) throw new Error('Flat not found');
    
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');
    
    if (isOwner) {
      // Assign as owner
      await runQueryRun(
        'UPDATE flats SET ownerId = ?, isOccupied = true, status = ? WHERE id = ?',
        [userId, 'occupied', flatId]
      );
    } else {
      // Assign as tenant - update user's unit number
      await runQueryRun(
        'UPDATE users SET unitNumber = ? WHERE id = ?',
        [flat.flatNumber, userId]
      );
      
      // Update flat status
      await runQueryRun(
        'UPDATE flats SET isOccupied = true, status = ? WHERE id = ?',
        ['occupied', flatId]
      );
    }
    
    return this.getFlat(flatId);
  },

  async unassignFlatFromUser(flatId: string) {
    const flat = await this.getFlat(flatId);
    if (!flat) throw new Error('Flat not found');
    
    // Remove owner assignment
    await runQueryRun(
      'UPDATE flats SET ownerId = NULL, isOccupied = false, status = ? WHERE id = ?',
      ['available', flatId]
    );
    
    // Remove tenant assignments (users with this unit number)
    await runQueryRun(
      'UPDATE users SET unitNumber = ? WHERE unitNumber = ?',
      ['Unassigned', flat.flatNumber]
    );
    
    return this.getFlat(flatId);
  },

  // Get unique unit numbers for dropdown
  async getUniqueUnitNumbers() {
    return runQueryAll(`
      SELECT DISTINCT flatNumber as unitNumber
      FROM flats 
      WHERE flatNumber IS NOT NULL AND flatNumber != ''
      ORDER BY flatNumber
    `);
  },

  async getTenantDocuments() { return []; },
  async createTenantDocument(document: any) { return document; },
  async updateTenantDocument(id: string, updates: any) { return updates; },
  async deleteTenantDocument(id: string) {},

  async getFeeTypes() { return []; },
  async createFeeType(feeType: any) { return feeType; },
  async updateFeeType(id: string, updates: any) { return updates; },
  async deleteFeeType(id: string) {},

  async getFeeSchedules() { return []; },
  async createFeeSchedule(schedule: any) { return schedule; },
  async updateFeeSchedule(id: string, updates: any) { return updates; },
  async deleteFeeSchedule(id: string) {},

  async getFeeTransactions() { return []; },
  async getFeeTransactionsByUser(userId: string) { return []; },
  async createFeeTransaction(transaction: any) { return transaction; },
  async updateFeeTransaction(id: string, updates: any) { return updates; },
  async deleteFeeTransaction(id: string) {},

  async getPayments() { return []; },
  async getPaymentsByUser(userId: string) { return []; },
  async createPayment(payment: any) { return payment; },
  async updatePayment(id: string, updates: any) { return updates; },
  async deletePayment(id: string) {},

  async getPaymentNotifications() { return []; },
  async createPaymentNotification(notification: any) { return notification; },
  async updatePaymentNotification(id: string, updates: any) { return updates; },
  async deletePaymentNotification(id: string) {},

  async getPaymentSchedules() { return []; },
  async createPaymentSchedule(schedule: any) { return schedule; },
  async updatePaymentSchedule(id: string, updates: any) { return updates; },
  async deletePaymentSchedule(id: string) {},

  async getDefaulterTracking() { return []; },
  async createDefaulterTracking(tracking: any) { return tracking; },
  async updateDefaulterTracking(id: string, updates: any) { return updates; },
  async deleteDefaulterTracking(id: string) {},

  async getVisitors() {
    return runQueryAll(`
      SELECT v.*, 
             h.firstName as hostFirstName, h.lastName as hostLastName, h.unitNumber as hostUnitNumber,
             w.firstName as watchmanFirstName, w.lastName as watchmanLastName,
             vb.firstName as verifiedByFirstName, vb.lastName as verifiedByLastName
      FROM visitors v
      LEFT JOIN users h ON v.hostUserId = h.id
      LEFT JOIN users w ON v.watchmanId = w.id
      LEFT JOIN users vb ON v.verifiedBy = vb.id
      ORDER BY v.createdAt DESC
    `);
  },

  async getVisitorsByWatchman(watchmanId: string) {
    return runQueryAll(`
      SELECT v.*, 
             h.firstName as hostFirstName, h.lastName as hostLastName, h.unitNumber as hostUnitNumber,
             w.firstName as watchmanFirstName, w.lastName as watchmanLastName,
             vb.firstName as verifiedByFirstName, vb.lastName as verifiedByLastName
      FROM visitors v
      LEFT JOIN users h ON v.hostUserId = h.id
      LEFT JOIN users w ON v.watchmanId = w.id
      LEFT JOIN users vb ON v.verifiedBy = vb.id
      WHERE v.watchmanId = ?
      ORDER BY v.createdAt DESC
    `, [watchmanId]);
  },

  async getVisitorsForHost(hostUserId: string) {
    return runQueryAll(`
      SELECT v.*, 
             h.firstName as hostFirstName, h.lastName as hostLastName, h.unitNumber as hostUnitNumber,
             w.firstName as watchmanFirstName, w.lastName as watchmanLastName,
             vb.firstName as verifiedByFirstName, vb.lastName as verifiedByLastName
      FROM visitors v
      LEFT JOIN users h ON v.hostUserId = h.id
      LEFT JOIN users w ON v.watchmanId = w.id
      LEFT JOIN users vb ON v.verifiedBy = vb.id
      WHERE v.hostUserId = ?
      ORDER BY v.createdAt DESC
    `, [hostUserId]);
  },

  async getGuestParkingBookings() {
    return runQueryAll(`
      SELECT b.*, 
             u.firstName, u.lastName, u.unitNumber,
             a.name as amenityName, a.type as amenityType
      FROM bookings b
      LEFT JOIN users u ON b.userId = u.id
      LEFT JOIN amenities a ON b.amenityId = a.id
      WHERE a.type = 'guest_parking' AND b.status IN ('confirmed', 'pending')
      ORDER BY b.createdAt DESC
    `);
  },

  async getGuestParkingBookingsByUser(userId: string) {
    return runQueryAll(`
      SELECT b.*, 
             u.firstName, u.lastName, u.unitNumber,
             a.name as amenityName, a.type as amenityType
      FROM bookings b
      LEFT JOIN users u ON b.userId = u.id
      LEFT JOIN amenities a ON b.amenityId = a.id
      WHERE a.type = 'guest_parking' AND b.userId = ? AND b.status IN ('confirmed', 'pending')
      ORDER BY b.createdAt DESC
    `, [userId]);
  },

  async getVisitorsByStatus(status: string) {
    return runQueryAll(`
      SELECT v.*, 
             h.firstName as hostFirstName, h.lastName as hostLastName, h.unitNumber as hostUnitNumber,
             w.firstName as watchmanFirstName, w.lastName as watchmanLastName,
             vb.firstName as verifiedByFirstName, vb.lastName as verifiedByLastName
      FROM visitors v
      LEFT JOIN users h ON v.hostUserId = h.id
      LEFT JOIN users w ON v.watchmanId = w.id
      LEFT JOIN users vb ON v.verifiedBy = vb.id
      WHERE v.status = ?
      ORDER BY v.createdAt DESC
    `, [status]);
  },

  async getVisitor(id: string) {
    return runQuery(`
      SELECT v.*, 
             h.firstName as hostFirstName, h.lastName as hostLastName, h.unitNumber as hostUnitNumber,
             w.firstName as watchmanFirstName, w.lastName as watchmanLastName,
             vb.firstName as verifiedByFirstName, vb.lastName as verifiedByLastName
      FROM visitors v
      LEFT JOIN users h ON v.hostUserId = h.id
      LEFT JOIN users w ON v.watchmanId = w.id
      LEFT JOIN users vb ON v.verifiedBy = vb.id
      WHERE v.id = ?
    `, [id]);
  },

  async createVisitor(visitor: any) {
    const id = `visitor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await runQueryRun(`
      INSERT INTO visitors (
        id, name, phone, email, purpose, purposeDetails, unitToVisit, hostUserId,
        photoUrl, idProofType, idProofNumber, idProofPhotoUrl, status, expectedDuration,
        watchmanId, emergencyContact, vehicleNumber, guestParkingSlot, accompanyingPersons,
        arrivalTime, departureTime
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, visitor.name, visitor.phone, visitor.email, visitor.purpose, visitor.purposeDetails,
      visitor.unitToVisit, visitor.hostUserId, visitor.photoUrl, visitor.idProofType,
      visitor.idProofNumber, visitor.idProofPhotoUrl, visitor.status || 'pending',
      visitor.expectedDuration, visitor.watchmanId, visitor.emergencyContact,
      visitor.vehicleNumber, visitor.guestParkingSlot, visitor.accompanyingPersons || 0,
      visitor.arrivalTime, visitor.departureTime
    ]);
    return this.getVisitor(id);
  },

  async updateVisitor(id: string, updates: any) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    await runQueryRun(`
      UPDATE visitors SET ${fields}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?
    `, [...values, id]);
    return this.getVisitor(id);
  },

  async deleteVisitor(id: string) {
    await runQueryRun('DELETE FROM visitors WHERE id = ?', [id]);
  },

  async getVisitorNotifications() { return []; },
  async createVisitorNotification(notification: any) { return notification; },
  async updateVisitorNotification(id: string, updates: any) { return updates; },
  async deleteVisitorNotification(id: string) {},
};
