import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  id: string;
  title: string;
  content: string;
  type: 'announcement' | 'complaint' | 'suggestion' | 'general';
  status: 'active' | 'resolved' | 'rejected';
  authorId: string;
  adminComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['announcement', 'complaint', 'suggestion', 'general'],
    default: 'general'
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'rejected'],
    default: 'active'
  },
  authorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adminComment: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Create indexes for better performance
postSchema.index({ authorId: 1 });
postSchema.index({ type: 1 });
postSchema.index({ status: 1 });
postSchema.index({ createdAt: -1 });

export const Post = mongoose.model<IPost>('Post', postSchema);
