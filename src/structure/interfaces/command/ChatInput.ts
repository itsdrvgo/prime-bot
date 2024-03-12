import { ApplicationCommandOptionData, ApplicationCommandType, AutocompleteInteraction, LocalizationMap } from "discord.js";
import { CustomClient } from "../../classes/index.js";
import { BaseApplicationCommand } from "./Base.js";

export class SlashCommand {
    public data: SlashCommandData;
    constructor (options: SlashCommandData) {
        this.data = options;
    }
}

export interface SlashCommandData extends BaseApplicationCommand {
    description: string;
    descriptionLocalizations?: LocalizationMap;
    options?: ApplicationCommandOptionData[];
    type?: ApplicationCommandType.ChatInput;
    autcomplete?: boolean;
    executeAutocomplete?: (interaction: AutocompleteInteraction, client: CustomClient) => unknown;
}