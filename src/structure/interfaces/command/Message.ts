import { ApplicationCommandType } from "discord.js";
import { BaseApplicationCommand } from "./Base.js";

export class MessageCommand {
    public data: MessageCommandData;
    constructor (options: MessageCommandData) {
        this.data = options;
        this.data.type = ApplicationCommandType.Message;
    }
}

export interface MessageCommandData extends BaseApplicationCommand {
    type?: ApplicationCommandType.Message;
}