import { 
  User, IUser, 
  Flat, IFlat, 
  Post, IPost, 
  Comment, IComment, 
  PostLike, IPostLike, 
  Amenity, IAmenity, 
  Booking, IBooking, 
  Visitor, IVisitor, 
  BiometricRequest, IBiometricRequest 
} from '../models';
import { hashPassword, comparePasswords } from '../auth';

export class MongoStorage {
  // User methods
  async createUser(userData: Partial<IUser>): Promise<IUser> {
    const hashedPassword = await hashPassword(userData.password!);
    const user = new User({
      ...userData,
      password: hashedPassword
    });
    return await user.save();
  }

  async getUserById(id: string): Promise<IUser | null> {
    return await User.findById(id);
  }

  async getUserByUsername(username: string): Promise<IUser | null> {
    return await User.findOne({ username });
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email });
  }

  async updateUser(id: string, updates: Partial<IUser>): Promise<IUser | null> {
    return await User.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await User.findByIdAndDelete(id);
    return !!result;
  }

  async getUsersByRole(role: string): Promise<IUser[]> {
    return await User.find({ role });
  }

  async getAllUsers(): Promise<IUser[]> {
    return await User.find().sort({ createdAt: -1 });
  }

  // Flat methods
  async createFlat(flatData: Partial<IFlat>): Promise<IFlat> {
    const flat = new Flat(flatData);
    return await flat.save();
  }

  async getFlatById(id: string): Promise<IFlat | null> {
    return await Flat.findById(id);
  }

  async getFlatByNumber(flatNumber: string): Promise<IFlat | null> {
    return await Flat.findOne({ flatNumber });
  }

  async getAllFlats(): Promise<IFlat[]> {
    return await Flat.find().populate('assignedUserId', 'firstName lastName username unitNumber');
  }

  async updateFlat(id: string, updates: Partial<IFlat>): Promise<IFlat | null> {
    return await Flat.findByIdAndUpdate(id, updates, { new: true });
  }

  async assignFlatToUser(flatId: string, userId: string): Promise<IFlat | null> {
    return await Flat.findByIdAndUpdate(flatId, {
      assignedUserId: userId,
      isOccupied: true
    }, { new: true });
  }

  async unassignFlat(flatId: string): Promise<IFlat | null> {
    return await Flat.findByIdAndUpdate(flatId, {
      assignedUserId: undefined,
      isOccupied: false
    }, { new: true });
  }

  // Post methods
  async createPost(postData: Partial<IPost>): Promise<IPost> {
    const post = new Post(postData);
    return await post.save();
  }

  async getPostById(id: string): Promise<IPost | null> {
    return await Post.findById(id).populate('authorId', 'firstName lastName username unitNumber');
  }

  async getAllPosts(): Promise<IPost[]> {
    return await Post.find()
      .populate('authorId', 'firstName lastName username unitNumber')
      .sort({ createdAt: -1 });
  }

  async getPostsByType(type: string): Promise<IPost[]> {
    return await Post.find({ type })
      .populate('authorId', 'firstName lastName username unitNumber')
      .sort({ createdAt: -1 });
  }

  async updatePost(id: string, updates: Partial<IPost>): Promise<IPost | null> {
    return await Post.findByIdAndUpdate(id, updates, { new: true });
  }

  async deletePost(id: string): Promise<boolean> {
    const result = await Post.findByIdAndDelete(id);
    return !!result;
  }

  async updatePostStatus(id: string, status: string, adminComment?: string): Promise<IPost | null> {
    const updates: any = { status };
    if (adminComment) {
      updates.adminComment = adminComment;
    }
    return await Post.findByIdAndUpdate(id, updates, { new: true });
  }

  // Comment methods
  async createComment(commentData: Partial<IComment>): Promise<IComment> {
    const comment = new Comment(commentData);
    return await comment.save();
  }

  async getCommentsByPostId(postId: string): Promise<IComment[]> {
    return await Comment.find({ postId })
      .populate('authorId', 'firstName lastName username unitNumber')
      .sort({ createdAt: -1 });
  }

  async getCommentById(id: string): Promise<IComment | null> {
    return await Comment.findById(id).populate('authorId', 'firstName lastName username unitNumber');
  }

  async deleteComment(id: string): Promise<boolean> {
    const result = await Comment.findByIdAndDelete(id);
    return !!result;
  }

  // Post Like methods
  async likePost(postId: string, userId: string): Promise<IPostLike> {
    const like = new PostLike({ postId, userId });
    return await like.save();
  }

  async unlikePost(postId: string, userId: string): Promise<boolean> {
    const result = await PostLike.findOneAndDelete({ postId, userId });
    return !!result;
  }

  async hasUserLikedPost(postId: string, userId: string): Promise<boolean> {
    const like = await PostLike.findOne({ postId, userId });
    return !!like;
  }

  async getPostLikes(postId: string): Promise<IPostLike[]> {
    return await PostLike.find({ postId })
      .populate('userId', 'firstName lastName username unitNumber')
      .sort({ createdAt: -1 });
  }

  // Amenity methods
  async createAmenity(amenityData: Partial<IAmenity>): Promise<IAmenity> {
    const amenity = new Amenity(amenityData);
    return await amenity.save();
  }

  async getAmenityById(id: string): Promise<IAmenity | null> {
    return await Amenity.findById(id);
  }

  async getAllAmenities(): Promise<IAmenity[]> {
    return await Amenity.find({ isActive: true }).sort({ name: 1 });
  }

  async updateAmenity(id: string, updates: Partial<IAmenity>): Promise<IAmenity | null> {
    return await Amenity.findByIdAndUpdate(id, updates, { new: true });
  }

  // Booking methods
  async createBooking(bookingData: Partial<IBooking>): Promise<IBooking> {
    const booking = new Booking(bookingData);
    return await booking.save();
  }

  async getBookingById(id: string): Promise<IBooking | null> {
    return await Booking.findById(id)
      .populate('userId', 'firstName lastName username unitNumber')
      .populate('amenityId', 'name type');
  }

  async getAllBookings(): Promise<IBooking[]> {
    return await Booking.find()
      .populate('userId', 'firstName lastName username unitNumber')
      .populate('amenityId', 'name type')
      .sort({ createdAt: -1 });
  }

  async getBookingsByUser(userId: string): Promise<IBooking[]> {
    return await Booking.find({ userId })
      .populate('amenityId', 'name type')
      .sort({ createdAt: -1 });
  }

  async getBookingsByAmenityAndDate(amenityId: string, date: Date): Promise<IBooking[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await Booking.find({
      amenityId,
      bookingDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['confirmed', 'pending'] }
    });
  }

  async updateBooking(id: string, updates: Partial<IBooking>): Promise<IBooking | null> {
    return await Booking.findByIdAndUpdate(id, updates, { new: true });
  }

  async getGuestParkingBookings(): Promise<IBooking[]> {
    return await Booking.find({
      'amenityId': { $exists: true }, // This will be replaced with actual guest parking amenity ID
      status: { $in: ['confirmed', 'pending'] }
    })
    .populate('userId', 'firstName lastName username unitNumber')
    .populate('amenityId', 'name type')
    .sort({ createdAt: -1 });
  }

  async getGuestParkingBookingsByUser(userId: string): Promise<IBooking[]> {
    return await Booking.find({
      userId,
      'amenityId': { $exists: true }, // This will be replaced with actual guest parking amenity ID
      status: { $in: ['confirmed', 'pending'] }
    })
    .populate('amenityId', 'name type')
    .sort({ createdAt: -1 });
  }

  // Visitor methods
  async createVisitor(visitorData: Partial<IVisitor>): Promise<IVisitor> {
    const visitor = new Visitor(visitorData);
    return await visitor.save();
  }

  async getVisitorById(id: string): Promise<IVisitor | null> {
    return await Visitor.findById(id).populate('hostUserId', 'firstName lastName username unitNumber');
  }

  async getAllVisitors(): Promise<IVisitor[]> {
    return await Visitor.find()
      .populate('hostUserId', 'firstName lastName username unitNumber')
      .sort({ createdAt: -1 });
  }

  async getVisitorsByHost(hostUserId: string): Promise<IVisitor[]> {
    return await Visitor.find({ hostUserId })
      .populate('hostUserId', 'firstName lastName username unitNumber')
      .sort({ createdAt: -1 });
  }

  async updateVisitor(id: string, updates: Partial<IVisitor>): Promise<IVisitor | null> {
    return await Visitor.findByIdAndUpdate(id, updates, { new: true });
  }

  // Biometric Request methods
  async createBiometricRequest(requestData: Partial<IBiometricRequest>): Promise<IBiometricRequest> {
    const request = new BiometricRequest(requestData);
    return await request.save();
  }

  async getBiometricRequestById(id: string): Promise<IBiometricRequest | null> {
    return await BiometricRequest.findById(id).populate('userId', 'firstName lastName username unitNumber');
  }

  async getAllBiometricRequests(): Promise<IBiometricRequest[]> {
    return await BiometricRequest.find()
      .populate('userId', 'firstName lastName username unitNumber')
      .sort({ createdAt: -1 });
  }

  async updateBiometricRequest(id: string, updates: Partial<IBiometricRequest>): Promise<IBiometricRequest | null> {
    return await BiometricRequest.findByIdAndUpdate(id, updates, { new: true });
  }

  // Authentication methods
  async validateUser(username: string, password: string): Promise<IUser | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    
    const isValid = await comparePasswords(password, user.password);
    return isValid ? user : null;
  }

  async resetUserPassword(userId: string, newPassword: string): Promise<boolean> {
    const hashedPassword = await hashPassword(newPassword);
    const result = await User.findByIdAndUpdate(userId, { password: hashedPassword });
    return !!result;
  }

  // Additional methods needed for compatibility with existing routes
  
  // User methods
  async getUser(userId: string): Promise<IUser | null> {
    return await this.getUserById(userId);
  }

  async getResidents(): Promise<IUser[]> {
    return await User.find({ role: 'resident' }).sort({ createdAt: -1 });
  }

  async updateUserStatus(userId: string, status: string): Promise<IUser | null> {
    return await User.findByIdAndUpdate(userId, { status }, { new: true });
  }

  async updateUserRole(userId: string, role: string): Promise<IUser | null> {
    return await User.findByIdAndUpdate(userId, { role }, { new: true });
  }

  // Post methods
  async getPosts(): Promise<IPost[]> {
    return await this.getAllPosts();
  }

  async getComments(postId: string): Promise<IComment[]> {
    return await this.getCommentsByPostId(postId);
  }

  // Amenity methods
  async getAmenities(): Promise<IAmenity[]> {
    return await this.getAllAmenities();
  }

  async getAmenity(id: string): Promise<IAmenity | null> {
    return await this.getAmenityById(id);
  }

  // Booking methods
  async getBookings(): Promise<IBooking[]> {
    return await this.getAllBookings();
  }

  async getUserBookings(userId: string): Promise<IBooking[]> {
    return await this.getBookingsByUser(userId);
  }

  async cancelBooking(bookingId: string): Promise<IBooking | null> {
    return await this.updateBooking(bookingId, { status: 'cancelled' });
  }

  async rejectBooking(bookingId: string, reason: string): Promise<IBooking | null> {
    return await this.updateBooking(bookingId, { 
      status: 'rejected',
      adminComment: reason
    });
  }

  // Flat methods
  async getFlats(): Promise<IFlat[]> {
    return await this.getAllFlats();
  }

  async getUniqueUnitNumbers(): Promise<string[]> {
    const flats = await Flat.find().distinct('unitNumber');
    return flats;
  }

  async deleteFlat(id: string): Promise<boolean> {
    const result = await Flat.findByIdAndDelete(id);
    return !!result;
  }

  async assignFlatToUser(flatId: string, userId: string, isOwner: boolean): Promise<IFlat | null> {
    return await Flat.findByIdAndUpdate(flatId, {
      assignedUserId: userId,
      isOccupied: true,
      isRented: !isOwner
    }, { new: true });
  }

  async unassignFlatFromUser(flatId: string): Promise<IFlat | null> {
    return await Flat.findByIdAndUpdate(flatId, {
      assignedUserId: undefined,
      isOccupied: false
    }, { new: true });
  }

  // Placeholder methods for features not yet implemented in MongoDB
  async createPasswordResetToken(data: any): Promise<any> {
    // TODO: Implement password reset token functionality
    console.log('Password reset token creation not yet implemented in MongoDB');
    return { id: 'temp-id' };
  }

  async getPasswordResetToken(token: string): Promise<any> {
    // TODO: Implement password reset token retrieval
    console.log('Password reset token retrieval not yet implemented in MongoDB');
    return { id: 'temp-id', userId: 'temp-user-id' };
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<boolean> {
    const result = await User.findByIdAndUpdate(userId, { password: hashedPassword });
    return !!result;
  }

  async markTokenAsUsed(tokenId: string): Promise<boolean> {
    // TODO: Implement token marking as used
    console.log('Token marking as used not yet implemented in MongoDB');
    return true;
  }

  // Placeholder methods for features that need to be implemented
  async getGuestNotifications(): Promise<any[]> {
    console.log('Guest notifications not yet implemented in MongoDB');
    return [];
  }

  async getUserGuestNotifications(userId: string): Promise<any[]> {
    console.log('User guest notifications not yet implemented in MongoDB');
    return [];
  }

  async createGuestNotification(data: any): Promise<any> {
    console.log('Guest notification creation not yet implemented in MongoDB');
    return { id: 'temp-id' };
  }

  async updateGuestNotification(id: string, data: any): Promise<any> {
    console.log('Guest notification update not yet implemented in MongoDB');
    return { id: 'temp-id' };
  }

  async getMessages(): Promise<any[]> {
    console.log('Messages not yet implemented in MongoDB');
    return [];
  }

  async createMessage(data: any): Promise<any> {
    console.log('Message creation not yet implemented in MongoDB');
    return { id: 'temp-id' };
  }

  async markMessageAsRead(messageId: string): Promise<any> {
    console.log('Message marking as read not yet implemented in MongoDB');
    return { id: 'temp-id' };
  }

  async getAnnouncementsForRole(role: string): Promise<any[]> {
    console.log('Announcements not yet implemented in MongoDB');
    return [];
  }

  async createAnnouncement(data: any): Promise<any> {
    console.log('Announcement creation not yet implemented in MongoDB');
    return { id: 'temp-id' };
  }

  async getMaintenanceRequests(): Promise<any[]> {
    console.log('Maintenance requests not yet implemented in MongoDB');
    return [];
  }

  async createMaintenanceRequest(data: any): Promise<any> {
    console.log('Maintenance request creation not yet implemented in MongoDB');
    return { id: 'temp-id' };
  }

  async updateMaintenanceRequestStatus(id: string, status: string, assignedTo?: string): Promise<any> {
    console.log('Maintenance request status update not yet implemented in MongoDB');
    return { id: 'temp-id' };
  }

  async getBookingReport(): Promise<any> {
    console.log('Booking report not yet implemented in MongoDB');
    return {};
  }

  async getBiometricRequestsByUserId(userId: string): Promise<any[]> {
    return await BiometricRequest.find({ userId }).populate('userId', 'firstName lastName username unitNumber');
  }

  async enableBiometricAccess(userId: string, requestType: string, accessLevel: string): Promise<any> {
    console.log('Biometric access enable not yet implemented in MongoDB');
    return { success: true };
  }

  async disableBiometricAccess(userId: string): Promise<any> {
    console.log('Biometric access disable not yet implemented in MongoDB');
    return { success: true };
  }

  async getUserBiometricStatus(userId: string): Promise<any> {
    console.log('User biometric status not yet implemented in MongoDB');
    return { status: 'enabled' };
  }

  async getTenantDocuments(): Promise<any[]> {
    console.log('Tenant documents not yet implemented in MongoDB');
    return [];
  }

  async getTenantDocumentsByUserId(userId: string): Promise<any[]> {
    console.log('User tenant documents not yet implemented in MongoDB');
    return [];
  }

  async createTenantDocument(data: any): Promise<any> {
    console.log('Tenant document creation not yet implemented in MongoDB');
    return { id: 'temp-id' };
  }

  async updateTenantDocument(id: string, data: any): Promise<any> {
    console.log('Tenant document update not yet implemented in MongoDB');
    return { id: 'temp-id' };
  }

  async getFeeTypes(): Promise<any[]> {
    console.log('Fee types not yet implemented in MongoDB');
    return [];
  }

  async createFeeType(data: any): Promise<any> {
    console.log('Fee type creation not yet implemented in MongoDB');
    return { id: 'temp-id' };
  }

  async updateFeeType(id: string, data: any): Promise<any> {
    console.log('Fee type update not yet implemented in MongoDB');
    return { id: 'temp-id' };
  }

  async deleteFeeType(id: string): Promise<boolean> {
    console.log('Fee type deletion not yet implemented in MongoDB');
    return true;
  }

  async getFeeSchedules(): Promise<any[]> {
    console.log('Fee schedules not yet implemented in MongoDB');
    return [];
  }

  async createFeeSchedule(data: any): Promise<any> {
    console.log('Fee schedule creation not yet implemented in MongoDB');
    return { id: 'temp-id' };
  }

  async getAllFeeTransactions(): Promise<any[]> {
    console.log('Fee transactions not yet implemented in MongoDB');
    return [];
  }
}

export const mongoStorage = new MongoStorage();
