import mongoose, { ObjectId } from "mongoose";
import { AddonService,LocationType } from "../utils/trip";


interface AddonServiceDetail {
  service: AddonService;
  pricePerHour: number;
}

export interface IYacht {
  owner: ObjectId;
  name: string;
  pickupat: string;
  location: LocationType;
  description: string;
  price: {
    sailing: {
      peakTime: number;
      nonPeakTime: number;
    };
    anchoring: {
      peakTime: number;
      nonPeakTime: number;
    };
  };
  addonServices: AddonServiceDetail[];
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
    type: String, 
    enum: Object.values(LocationType),
    required: true 
  },
  pickupat: { type: String, required: true },
  YachtType: { type: String, required: true },
  description: { type: String, required: true },
  price: {
    sailing: {
      peakTime: { type: Number, required: true },
      nonPeakTime: { type: Number, required: true }
    },
    anchoring: {
      peakTime: { type: Number, required: true },
      nonPeakTime: { type: Number, required: true }
    }
  },
  addonServices: [{
    service: { 
      type: String,
      enum: Object.values(AddonService),
      required: true 
    },
    pricePerHour: { 
      type: Number, 
      required: true 
    }
  }],
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

export const Yacht = mongoose.model<IYacht>('Yacht', yachtSchema);

export default Yacht;