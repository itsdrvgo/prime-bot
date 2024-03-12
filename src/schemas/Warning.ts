import mongoose, { Document } from "mongoose";

export interface WarningData extends Document {
    userId: string;
    guildId: string;
    moderatorId: string;
    reason: string;
    timestamp: string
}

export default mongoose.model("warning", new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    moderatorId: { type: String, required: true },
    reason: { type: String, required: true },
    timestamp: { type: String, required: true }
}));