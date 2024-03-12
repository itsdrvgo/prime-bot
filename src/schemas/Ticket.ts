import mongoose, { Document } from "mongoose";

export interface TicketData extends Document {
    guildId: string;
    memberIds: string[];
    ticketId: string;
    channelId: string;
    closed: boolean;
    locked: boolean;
    type: string;
    openTime: string;
}

export default mongoose.model("ticket", new mongoose.Schema({
    guildId: { type: String, required: true },
    memberIds: { type: Array, required: true },
    ticketId: { type: String, required: true },
    channelId: { type: String, required: true },
    closed: { type: Boolean, required: true },
    locked: { type: Boolean, required: true },
    type: { type: String, required: true },
    openTime: { type: String, required: true }
}));