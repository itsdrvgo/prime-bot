import mongoose, { Document } from "mongoose";

export interface RoleData {
    roleId: string,
    roleEmoji: string
}

export interface SelfRoleData extends Document {
    name: string;
    description: string;
    userId: string;
    guildId: string;
    roleIds: RoleData[];
    requiredRoleId?: string;
}

export default mongoose.model("self-roles", new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    roleIds: { type: Array, required: true },
    requiredRoleId: { type: String, required: false }
}));