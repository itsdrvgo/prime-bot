import { ChatInputCommandInteraction, PermissionFlagsBits, ApplicationCommandOptionType, GuildMember } from "discord.js";
import { editReply, SlashCommand } from "../../structure/index.js";
import ms from "ms";

export default new SlashCommand({
    name: "timeout",
    description: "Manages a target's timeout",
    defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
    options: [
        {
            name: "add",
            description: "Adds timeout to a target",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "target",
                    description: "Select a target",
                    type: ApplicationCommandOptionType.User,
                    required: true
                },
                {
                    name: "duration",
                    description: "Choose a duration",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: [
                        { name: "60 SEC", value: "1" },
                        { name: "5 MIN", value: "2" },
                        { name: "10 MIN", value: "3" },
                        { name: "1 HOUR", value: "4" },
                        { name: "1 DAY", value: "5" },
                        { name: "1 WEEK", value: "6" }
                    ]
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
            description: "Removes timeout from a target",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "target",
                    description: "Select a target",
                    type: ApplicationCommandOptionType.User,
                    required: true
                }
            ]
        }
    ],
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });

        switch (interaction.options.getSubcommand(true)) {
            case "add": {
                const target = interaction.options.getMember("target") as GuildMember | null;
                const duration = interaction.options.getString("duration", true);
                const reason = interaction.options.getString("reason") || "no reason provided";

                if (!target) return editReply(interaction, "❌", "Invalid target!");
                if (target.id === interaction.user.id) return editReply(interaction, "❌", "You can't timeout yourself!");
                if (interaction.guild?.ownerId === target.id) return editReply(interaction, "❌", "You can't timeout the server's owner!");
                if (!target.moderatable) return editReply(interaction, "❌", "Target can't be moderated!");

                switch (duration) {
                    case "1":
                        await target.timeout(ms("60s"), reason);
                        editReply(interaction, "⏳", `${target} has been timed out for **60 Seconds** for : **${reason}**`);
                        break;

                    case "2":
                        await target.timeout(ms("5m"), reason);
                        editReply(interaction, "⏳", `${target} has been timed out for **5 Minutes** for : **${reason}**`);
                        break;

                    case "3":
                        await target.timeout(ms("10m"), reason);
                        editReply(interaction, "⏳", `${target} has been timed out for **10 Minutes** for : **${reason}**`);
                        break;

                    case "4":
                        await target.timeout(ms("1h"), reason);
                        editReply(interaction, "⏳", `${target} has been timed out for **1 Hour** for : **${reason}**`);
                        break;

                    case "5":
                        await target.timeout(ms("1d"), reason);
                        editReply(interaction, "⏳", `${target} has been timed out for **1 Day** for : **${reason}**`);
                        break;

                    case "6":
                        await target.timeout(ms("7d"), reason);
                        editReply(interaction, "⏳", `${target} has been timed out for **1 Week** for : **${reason}**`);
                        break;
                }
            }
                break;

            case "remove": {
                const target = interaction.options.getMember("target") as GuildMember | null;

                if (!target) return editReply(interaction, "❌", "Invalid target!");
                if (target.id === interaction.user.id) return editReply(interaction, "❌", "You can't remove timeout from yourself!");
                if (!target.moderatable) return editReply(interaction, "❌", "Target can't be moderated!");
                if (!target.isCommunicationDisabled()) return editReply(interaction, "❌", `${target} is not having a time-out!`);

                await target.timeout(null);
                editReply(interaction, "✅", `Timeout has been removed from ${target}`);
            }
                break;
        }
    }
});