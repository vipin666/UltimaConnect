import mongoose, { Document, Schema } from 'mongoose';

export interface IVisitor extends Document {
  id: string;
  name: string;
  phone: string;
  purpose: string;
  unitToVisit: string;
  hostUserId: string;
  arrivalTime: string;
  departureTime: string;
  guestParkingSlot?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const visitorSchema = new Schema<IVisitor>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  purpose: {
    type: String,
    required: true,
    trim: true
  },
  unitToVisit: {
    type: String,
    required: true,
    trim: true
  },
  hostUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  arrivalTime: {
    type: String,
    required: true
  },
  departureTime: {
    type: String,
    required: true
  },
  guestParkingSlot: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
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
visitorSchema.index({ hostUserId: 1 });
visitorSchema.index({ unitToVisit: 1 });
visitorSchema.index({ status: 1 });
visitorSchema.index({ guestParkingSlot: 1 });
visitorSchema.index({ createdAt: -1 });

export const Visitor = mongoose.model<IVisitor>('Visitor', visitorSchema);
