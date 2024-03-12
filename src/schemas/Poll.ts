import mongoose, { Document } from "mongoose";

export interface VotesObject {
    [index: string]: number;
}

export interface UsersObject {
    [index: string]: string[];
}

export interface PollData extends Document {
    guildId: string;
    channelId: string;
    messageId: string;
    userId: string;
    topic: string;
    options: string[];
    voters: string[];
    answer: number;
    votes: VotesObject;
    users: UsersObject;
    type: string;
    endTime: number;
}

export default mongoose.model("poll", new mongoose.Schema({
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    userId: { type: String, required: true },
    topic: { type: String, required: true },
    type: { type: String, required: true },
    endTime: { type: Number, required: true },
    votes: { type: Object, required: true },
    users: { type: Object, required: true },
    options: { type: Array, required: false },
    voters: { type: Array, required: false },
    answer: { type: Number, required: false },
    messageId: { type: String, required: false }
}));