import mongoose, { Document, Schema } from 'mongoose';

export interface IAmenity extends Document {
  id: string;
  name: string;
  type: string;
  description?: string;
  isActive: boolean;
  maxCapacity?: number;
  bookingDuration?: number;
  createdAt: Date;
  updatedAt: Date;
}

const amenitySchema = new Schema<IAmenity>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  maxCapacity: {
    type: Number,
    min: 1
  },
  bookingDuration: {
    type: Number,
    min: 1
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
amenitySchema.index({ name: 1 });
amenitySchema.index({ type: 1 });
amenitySchema.index({ isActive: 1 });

export const Amenity = mongoose.model<IAmenity>('Amenity', amenitySchema);
