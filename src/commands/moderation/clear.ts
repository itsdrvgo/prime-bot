/* eslint-disable camelcase */
import { ChatInputCommandInteraction, PermissionFlagsBits, ApplicationCommandOptionType, GuildMember, BaseGuildTextChannel, Message } from "discord.js";
import { editReply, SlashCommand } from "../../structure/index.js";

export default new SlashCommand({
    name: "clear",
    description: "Deletes messages from a channel or of a target",
    defaultMemberPermissions: PermissionFlagsBits.ManageMessages,
    options: [
        {
            name: "amount",
            description: "Enter the amount of messages to be deleted",
            type: ApplicationCommandOptionType.Integer,
            required: true,
            max_value: 100,
            min_value: 1
        },
        {
            name: "target",
            description: "Select a target",
            type: ApplicationCommandOptionType.User,
            required: false
        }
    ],
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });

        const amount = interaction.options.getInteger("amount", true);
        const target = interaction.options.getMember("target") as GuildMember | null;
        const channel = interaction.channel as BaseGuildTextChannel;

        channel.messages.fetch().then(async (messages) => {
            if (target) {
                let i = 0;
                const filtered: Message[] = [];

                messages.filter((message) => {
                    if (message.author.id === target.id && amount > i) {
                        filtered.push(message);
                        i++;
                    }
                });

                await channel.bulkDelete(filtered, true)
                    .then((deletedMessages) => {
                        return editReply(interaction, "🧹", `Cleared \`${deletedMessages.size}\` messages of ${target}`);
                    }).catch((err) => {
                        return editReply(interaction, "❌", `Unexpected error occurred : \`\`\`${err}\`\`\``);
                    });
            } else {
                await channel.bulkDelete(amount, true)
                    .then((deletedMessages) => {
                        return editReply(interaction, "🧹", `Cleared \`${deletedMessages.size}\` messages from this channel`);
                    }).catch((err) => {
                        return editReply(interaction, "❌", `Unexpected error occurred : \`\`\`${err}\`\`\``);
                    });
            }
        }).catch((err) => {
            return editReply(interaction, "❌", `Unexpected error occurred : \`\`\`${err}\`\`\``);
        });
    }
});