import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  id: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'resident' | 'admin' | 'super_admin' | 'watchman' | 'caretaker' | 'secretary' | 'president' | 'treasurer' | 'committee_member';
  unitNumber?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  role: {
    type: String,
    enum: ['resident', 'admin', 'super_admin', 'watchman', 'caretaker', 'secretary', 'president', 'treasurer', 'committee_member'],
    default: 'resident'
  },
  unitNumber: {
    type: String,
    trim: true
  },
  phone: {
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
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ unitNumber: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
