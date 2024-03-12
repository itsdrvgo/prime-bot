import mongoose, { Document } from "mongoose";

export interface ReviewData extends Document {
    userId: string;
    starCount: number;
    review: string;
    channelId: string;
}

export default mongoose.model("review", new mongoose.Schema({
    userId: { type: String, required: true },
    starCount: { type: Number, required: true },
    review: { type: String, required: true },
    channelId: { type: String, required: true }
}));