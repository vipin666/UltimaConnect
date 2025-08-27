import mongoose, { Document, Schema } from 'mongoose';

export interface IPostLike extends Document {
  id: string;
  postId: string;
  userId: string;
  createdAt: Date;
}

const postLikeSchema = new Schema<IPostLike>({
  postId: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Create unique compound index to prevent duplicate likes
postLikeSchema.index({ postId: 1, userId: 1 }, { unique: true });

// Create indexes for better performance
postLikeSchema.index({ postId: 1 });
postLikeSchema.index({ userId: 1 });
postLikeSchema.index({ createdAt: -1 });

export const PostLike = mongoose.model<IPostLike>('PostLike', postLikeSchema);
