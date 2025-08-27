import mongoose, { Document, Schema } from 'mongoose';

export interface IFlat extends Document {
  id: string;
  flatNumber: string;
  unitNumber: string;
  floor: number;
  type: string;
  size: number;
  isOccupied: boolean;
  isRented: boolean;
  assignedUserId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const flatSchema = new Schema<IFlat>({
  flatNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  unitNumber: {
    type: String,
    required: true,
    trim: true
  },
  floor: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true,
    trim: true
  },
  size: {
    type: Number,
    required: true
  },
  isOccupied: {
    type: Boolean,
    default: false
  },
  isRented: {
    type: Boolean,
    default: false
  },
  assignedUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
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
flatSchema.index({ flatNumber: 1 });
flatSchema.index({ unitNumber: 1 });
flatSchema.index({ assignedUserId: 1 });
flatSchema.index({ isOccupied: 1 });
flatSchema.index({ isRented: 1 });

export const Flat = mongoose.model<IFlat>('Flat', flatSchema);
