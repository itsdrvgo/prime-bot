import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { SlashCommand, CustomClient, editReply } from "../../structure/index.js";
import DB from "../../schemas/Service.js";

export default new SlashCommand({
    name: "service",
    description: "Toggles service status",
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    botOwnerOnly: true,
    async execute(interaction: ChatInputCommandInteraction, client: CustomClient) {
        await interaction.deferReply({ ephemeral: true });

        let data = await DB.findOne({ guildId: client.data.guilds.primary }).catch(() => { });

        if (!data) {
            data = new DB({
                guildId: client.data.guilds.primary,
                state: true
            });

            await data.save();
            editReply(interaction, "✅", "Service state is now active");
        } else {
            if (data.state === true) data.state = false;
            else data.state = true;
            await data.save();

            editReply(interaction, "✅", `Service state is now ${data.state ? "active" : "inactive"}`);
        }
    }
});