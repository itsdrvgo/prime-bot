import mongoose, { Document } from "mongoose";

export interface LevelData extends Document {
    guildId: string;
    userId: string;
    xp: number;
    level: number;
    role: string;
}

export default mongoose.model("level", new mongoose.Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    xp: { type: Number, required: true },
    level: { type: Number, required: true },
    role: { type: String, required: false }
}));