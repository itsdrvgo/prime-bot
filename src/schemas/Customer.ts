import mongoose, { Document } from "mongoose";

export interface PurchaseData {
    itemId: number;
    timestamp: number;
}

export interface CustomerData extends Document {
    userId: string;
    purchased: PurchaseData[];
    strikes: number;
}

export default mongoose.model("customer", new mongoose.Schema({
    userId: { type: String, required: true },
    purchased: { type: Array, required: true },
    strikes: { type: Number, required: true }
}));