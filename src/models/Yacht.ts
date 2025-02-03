import mongoose, { ObjectId } from "mongoose";

export interface IYacht {
  owner: ObjectId;
  name: string;
  pickupat: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  description: string;
  price: { sailing: number; still: number };
  availability: boolean;
  amenities: string[];
  capacity: number;
  mnfyear?: number;
  dimension?: string;
  crews?: Array<{ name: string; role: string }>[];
  images: string[];
  createdAt?: Date;
  YachtType: string;
  updatedAt?: Date;  
}

export const yachtSchema = new mongoose.Schema<IYacht>({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true }, // Yacht Owner
  name: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true }
  },
  pickupat: { type: String, required: true },
  YachtType: { type: String, required: true },
  description: { type: String, required: true },
  price: { sailing: { type: Number, required: true }, still: { type: Number, required: true } },
  availability: { type: Boolean, default: true },
  amenities: { type: [String], required: true }, // e.g., "AC", "WiFi"
  capacity: { type: Number, required: true },
  mnfyear: { type: Number },
  dimension: { type: String },
  crews: [{ name: { type: String }, role: { type: String } }], // Array of crew objects
  images: { type: [String], required: true }, // Array of image URLs
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

yachtSchema.index({ location: '2dsphere' });

export const Yacht = mongoose.model<IYacht>('Yacht', yachtSchema);

export default Yacht;