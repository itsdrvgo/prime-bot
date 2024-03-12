import { ChatInputCommandInteraction, PermissionFlagsBits, ApplicationCommandOptionType, GuildMember, EmbedBuilder } from "discord.js";
import { CustomClient, editReply, SlashCommand } from "../../structure/index.js";

export default new SlashCommand({
    name: "kick",
    description: "Kicks a target",
    defaultMemberPermissions: PermissionFlagsBits.KickMembers,
    options: [
        {
            name: "target",
            description: "Select a target",
            type: ApplicationCommandOptionType.User,
            required: true
        },
        {
            name: "reason",
            description: "Provide a reason",
            type: ApplicationCommandOptionType.String,
            required: false
        }
    ],
    async execute(interaction: ChatInputCommandInteraction, client: CustomClient) {
        await interaction.deferReply({ ephemeral: true });

        const target = interaction.options.getMember("target") as GuildMember | null;
        const reason = interaction.options.getString("reason") || "no reason provided";

        if (!target) return editReply(interaction, "❌", "Invalid target!");
        if (target.id === interaction.user.id) return editReply(interaction, "❌", "You can't kick yourself!");
        if (interaction.guild?.ownerId === target.id) return editReply(interaction, "❌", "You can't kick the server's owner!");
        if (!target.kickable) return editReply(interaction, "❌", "Target can't be kicked!");

        await target.kick(reason);
        editReply(interaction, "✅", `${target} has been kicked for : **${reason}**`);

        target.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle("`⚠` | You have been Kicked!")
                    .setColor(client.data.color)
                    .setThumbnail(target.user.displayAvatarURL())
                    .addFields(
                        { name: "Name:", value: target.user.tag, inline: true },
                        { name: "Kicked from:", value: `${interaction.guild?.name}`, inline: true },
                        { name: "Reason:", value: reason, inline: false }
                    )
                    .setTimestamp()
            ]
        }).catch((err) => {
            if (err.code !== 50007) return;
        });
    }
});