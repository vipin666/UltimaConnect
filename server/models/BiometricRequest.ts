import mongoose, { Document, Schema } from 'mongoose';

export interface IBiometricRequest extends Document {
  id: string;
  userId: string;
  biometricId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const biometricRequestSchema = new Schema<IBiometricRequest>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  biometricId: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
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
biometricRequestSchema.index({ userId: 1 });
biometricRequestSchema.index({ biometricId: 1 });
biometricRequestSchema.index({ status: 1 });
biometricRequestSchema.index({ createdAt: -1 });

export const BiometricRequest = mongoose.model<IBiometricRequest>('BiometricRequest', biometricRequestSchema);
