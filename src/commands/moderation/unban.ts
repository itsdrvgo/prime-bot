import { ChatInputCommandInteraction, PermissionFlagsBits, ApplicationCommandOptionType } from "discord.js";
import { editReply, SlashCommand } from "../../structure/index.js";

export default new SlashCommand({
    name: "unban",
    description: "Unbans a target",
    defaultMemberPermissions: PermissionFlagsBits.BanMembers,
    options: [
        {
            name: "target-id",
            description: "Provide a target id",
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });

        const targetId = interaction.options.getString("target-id", true);

        interaction.guild?.bans.fetch().then(async (bannedMembers) => {
            if (bannedMembers.size === 0) return editReply(interaction, "❌", "No one is banned in this server!");
            if (!bannedMembers.find((x) => x.user.id === targetId)) return editReply(interaction, "❌", "Target is not banned!");

            await interaction.guild?.members.unban(targetId);
            editReply(interaction, "✅", `<@${targetId}> has been unbanned`);
        }).catch((err) => {
            editReply(interaction, "❌", "Unexpected error occurred : " + "```" + err + "```");
        });
    }
});