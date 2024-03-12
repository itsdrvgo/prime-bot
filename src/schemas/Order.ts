import mongoose, { Document } from "mongoose";

export interface OrderData extends Document {
    ordererId: string;
    items: string[];
    price: string;
    timestamp: number;
    files?: string[],
    invoiceId?: string;
    channelId?: string;
    checkoutMessageId?: string;
    orderMessageId?: string;
}

export default mongoose.model("order", new mongoose.Schema({
    ordererId: { type: String, required: true },
    items: { type: Array, required: true },
    price: { type: String, required: true },
    files: { type: Array, required: false },
    timestamp: { type: Number, required: true },
    invoiceId: { type: String, required: false },
    channelId: { type: String, required: false },
    checkoutMessageId: { type: String, required: false },
    orderMessageId: { type: String, required: false }
}));