import DB, { WarningData } from "../../schemas/Warning.js";
import { ChatInputCommandInteraction, PermissionFlagsBits, ApplicationCommandOptionType, GuildMember, EmbedBuilder } from "discord.js";
import { CustomClient, editReply, paginate, reply, SlashCommand } from "../../structure/index.js";
import ms from "ms";

export default new SlashCommand({
    name: "warn",
    description: "Warns or removes or show warns of a member",
    defaultMemberPermissions: PermissionFlagsBits.ManageMessages,
    options: [
        {
            name: "add",
            description: "Warns a target",
            type: ApplicationCommandOptionType.Subcommand,
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
            ]
        },
        {
            name: "remove",
            description: "Removes warn from a target",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "id",
                    description: "Provide the target's Warn ID",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        },
        {
            name: "list",
            description: "Shows a list full of warnings of a target",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "target",
                    description: "Select a target",
                    type: ApplicationCommandOptionType.User,
                    required: true
                }
            ]
        },
    ],
    async execute(interaction: ChatInputCommandInteraction, client: CustomClient) {
        switch (interaction.options.getSubcommand()) {
            case "add": {
                const target = interaction.options.getMember("target") as GuildMember | null;
                const reason = interaction.options.getString("reason") || "no reason provided";

                if (!target) return reply(interaction, "❌", "Invalid target!");
                if (target.id === interaction.user.id) return reply(interaction, "❌", "You can't warn yourself!");
                if (interaction.guild?.ownerId === target.id) return reply(interaction, "❌", "You can't warn the server's owner!");

                await interaction.deferReply();

                const data = new DB({
                    userId: target.id,
                    guildId: interaction.guild?.id,
                    moderatorId: interaction.user.id,
                    reason,
                    timestamp: Date.now()
                });
                await data.save();

                editReply(interaction, "✅", `${target} has been warned for : **${reason}**`);

                const punishmentReason = "Detected by Auto-Punishment system, warn count reached maximium punishment limit";

                const embed = new EmbedBuilder()
                    .setColor(client.data.color)
                    .setThumbnail(target.user.displayAvatarURL())
                    .addFields(
                        { name: "Reason:", value: reason },
                        { name: "Punished in:", value: `${interaction.guild?.name}` }
                    )
                    .setTimestamp();

                const warnData = await DB.find({ userId: target.id, guildId: interaction.guild?.id }).catch(() => { });

                switch (warnData?.length) {
                    case 5: {
                        target.timeout(ms("1d"), punishmentReason);

                        target.send({
                            embeds: [
                                embed.setTitle("⚠ | Timed Out for 1 Day")
                            ]
                        }).catch((err) => {
                            if (err.code !== 50007) return;
                        });
                    }
                        break;

                    case 15: {
                        target.kick(punishmentReason);

                        target.send({
                            embeds: [
                                embed.setTitle("⚠ | You've been Kicked")
                            ]
                        }).catch((err) => {
                            if (err.code !== 50007) return;
                        });
                    }
                        break;

                    case 25: {
                        target.ban({ reason: punishmentReason });

                        target.send({
                            embeds: [
                                embed.setTitle("⚠ | You've been Banned")
                            ]
                        }).catch((err) => {
                            if (err.code !== 50007) return;
                        });
                    }
                        break;
                }

                target.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("`⚠` | You have been Warned!")
                            .setColor(client.data.color)
                            .setThumbnail(target.user.displayAvatarURL())
                            .addFields(
                                { name: "Name:", value: target.user.tag, inline: true },
                                { name: "Warned in:", value: `${interaction.guild?.name}`, inline: true },
                                { name: "Reason:", value: reason, inline: false }
                            )
                            .setTimestamp()
                    ]
                }).catch((err) => {
                    if (err.code !== 50007) return;
                });
            }
                break;

            case "remove": {
                await interaction.deferReply({ ephemeral: true });

                const warnId = interaction.options.getString("id");
                const data = await DB.findOne({ _id: warnId }).catch(() => { });
                if (!data) return editReply(interaction, "❌", "Invalid ID!");
                if (data.userId === interaction.user.id) return reply(interaction, "❌", "You can't remove warn from yourself!");

                await data.deleteOne();
                editReply(interaction, "✅", `Removed \`1\` warning from **<@${data.userId}>**`);
            }
                break;

            case "list": {
                const target = interaction.options.getMember("target") as GuildMember | null;
                if (!target) return reply(interaction, "❌", "Invalid target!");

                const data = await DB.find({ userId: target.id, guildId: interaction.guild?.id }).catch(() => { });
                if (data?.length === 0) return reply(interaction, "❌", `${target} doesn't have any warnings!`);

                const pages = pageBuilder(data as WarningData[], 5, client, target);
                paginate(interaction, pages);

            }
                break;
        }
    }
});

function pageBuilder(data: WarningData[], numberOfPages: number, client: CustomClient, target: GuildMember) {
    const embeds: EmbedBuilder[] = [];
    let k = numberOfPages;

    for (let i = 0; i < data.length; i += numberOfPages) {
        const current = data.slice(i, k);
        k += numberOfPages;

        const mapped = current.map((warn) => {
            return [
                `**Warn ID:** \`${warn._id}\``,
                `**Moderator:** <@${warn.moderatorId}>`,
                `**Date:** <t:${Math.round(parseInt(warn.timestamp) / 1000)}:R>`,
                `**Reason:** ${warn.reason}`
            ].join("\n");
        }).join("\n\n");

        const embed = new EmbedBuilder()
            .setColor(client.data.color)
            .setThumbnail(target.user.displayAvatarURL())
            .setTitle(`${target.user.tag}'s Warnings (${data.length})`)
            .setDescription(mapped)
            .setTimestamp();
        embeds.push(embed);
    }
    return embeds;
}