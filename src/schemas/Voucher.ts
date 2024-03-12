import mongoose, { Document } from "mongoose";

export interface VoucherData extends Document {
    code: string;
    expiry: number;
    type: number;
    maxUse: number;
    uses?: number;
    userIds?: string[];
}

export default mongoose.model("voucher", new mongoose.Schema({
    code: { type: String, required: true },
    expiry: { type: Number, required: true },
    type: { type: Number, required: true },
    maxUse: { type: Number, required: true },
    uses: { type: Number, required: false, default: 0 },
    userIds: { type: Array, required: false, default: [] }
}));