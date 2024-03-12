import mongoose, { Document } from "mongoose";

export interface ServiceData extends Document {
    guildId: string;
    state: boolean;
}

export default mongoose.model("service", new mongoose.Schema({
    guildId: { type: String, required: true },
    state: { type: Boolean, required: true }
}));