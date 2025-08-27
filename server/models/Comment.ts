import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>({
  content: {
    type: String,
    required: true,
    trim: true
  },
  postId: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  authorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
commentSchema.index({ postId: 1 });
commentSchema.index({ authorId: 1 });
commentSchema.index({ createdAt: -1 });

export const Comment = mongoose.model<IComment>('Comment', commentSchema);
