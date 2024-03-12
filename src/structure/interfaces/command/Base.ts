import { BaseApplicationCommandData, PermissionResolvable } from "discord.js";
import { CustomClient } from "../../classes/index.js";

export interface BaseApplicationCommand extends BaseApplicationCommandData {
    developerGuild?: boolean;
    botOwnerOnly?: boolean;
    botPermissions?: PermissionResolvable[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    execute: (interaction: any, client: CustomClient) => any;
}