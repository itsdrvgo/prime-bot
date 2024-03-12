import { ApplicationCommandType } from "discord.js";
import { BaseApplicationCommand } from "./Base.js";

export class ContextCommand {
    public data: ContextCommandData;
    constructor (options: ContextCommandData) {
        this.data = options;
        this.data.type = ApplicationCommandType.User;
    }
}

export interface ContextCommandData extends BaseApplicationCommand {
    type?: ApplicationCommandType.User;
}