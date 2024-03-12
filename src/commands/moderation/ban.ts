import { ChatInputCommandInteraction, PermissionFlagsBits, ApplicationCommandOptionType, GuildMember, EmbedBuilder } from "discord.js";
import { CustomClient, editReply, SlashCommand } from "../../structure/index.js";

export default new SlashCommand({
    name: "ban",
    description: "Permanently bans a target",
    defaultMemberPermissions: PermissionFlagsBits.BanMembers,
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
        if (target.id === interaction.user.id) return editReply(interaction, "❌", "You can't ban yourself!");
        if (interaction.guild?.ownerId === target.id) return editReply(interaction, "❌", "You can't ban the server's owner!");
        if (!target.bannable) return editReply(interaction, "❌", "Target can't be banned!");

        await target.ban({ reason: reason });
        editReply(interaction, "✅", `${target} has been banned for : **${reason}**`);

        target.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle("`⚠` | You have been Banned!")
                    .setColor(client.data.color)
                    .setThumbnail(target.user.displayAvatarURL())
                    .addFields(
                        { name: "Name:", value: target.user.tag, inline: true },
                        { name: "Banned from:", value: `${interaction.guild?.name}`, inline: true },
                        { name: "Reason:", value: reason, inline: false }
                    )
                    .setTimestamp()
            ]
        }).catch((err) => {
            if (err.code !== 50007) return;
        });
    }
});