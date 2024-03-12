import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { SlashCommand, CustomClient, reply } from "../../structure/index.js";

export default new SlashCommand({
    name: "reload",
    description: "Reload application commands",
    developerGuild: true,
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    botOwnerOnly: true,
    async execute(interaction: ChatInputCommandInteraction, client: CustomClient) {
        if (!client.data.devBotEnabled) {
            await client.application?.commands.set(Array.from(client.commands.values()).filter((command) => !command.developerGuild) as []);
            client.data.guilds.dev?.forEach(async (id: string) => {
                const guild = await client.guilds.fetch(id);
                if (!guild) return;

                await guild.commands.set([]);
            });
        } else {
            await client.application?.commands.set([]);
            client.data.guilds.dev?.forEach(async (id: string) => {
                const guild = await client.guilds.fetch(id);
                if (!guild) return;

                await guild.commands.set(Array.from(client.commands.values()) as []);
            });
        }

        reply(interaction, "✅", "Reloaded all commands");
    }
});