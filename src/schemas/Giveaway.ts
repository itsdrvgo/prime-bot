import mongoose, { Document } from "mongoose";

export interface GiveawayData extends Document {
    guildId: string;
    channelId: string;
    messageId: string;
    description: string;
    winnerCount: number;
    prize: string;
    endTimestamp: number;
    paused: boolean;
    ended: boolean;
    hostId: string;
    joined: string[];
}

export default mongoose.model("giveaway", new mongoose.Schema({
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    messageId: { type: String, required: true },
    description: { type: String, required: true },
    winnerCount: { type: Number, required: true },
    prize: { type: String, required: true },
    endTimestamp: { type: Number, required: true },
    paused: { type: Boolean, required: true },
    ended: { type: Boolean, required: true },
    hostId: { type: String, required: true },
    joined: { type: Array, required: true },
}));