import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  id: string;
  userId: string;
  amenityId: string;
  bookingDate: Date;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  guestParkingSlot?: string;
  adminComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amenityId: {
    type: Schema.Types.ObjectId,
    ref: 'Amenity',
    required: true
  },
  bookingDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected', 'cancelled'],
    default: 'pending'
  },
  guestParkingSlot: {
    type: String,
    trim: true
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
bookingSchema.index({ userId: 1 });
bookingSchema.index({ amenityId: 1 });
bookingSchema.index({ bookingDate: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ guestParkingSlot: 1 });
bookingSchema.index({ createdAt: -1 });

// Create compound indexes for common queries
bookingSchema.index({ amenityId: 1, bookingDate: 1 });
bookingSchema.index({ userId: 1, amenityId: 1, bookingDate: 1 });

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
