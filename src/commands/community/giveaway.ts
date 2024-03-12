import { APIActionRowComponent, APIButtonComponent, ActionRowBuilder, ApplicationCommandOptionType, BaseGuildTextChannel, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, ModalBuilder, PermissionFlagsBits, TextInputBuilder, TextInputStyle } from "discord.js";
import { CustomClient, SlashCommand, editReply, endGiveaway, paginate, reply } from "../../structure/index.js";
import Giveaway, { GiveawayData } from "../../schemas/Giveaway.js";
import ms from "ms";

export default new SlashCommand({
    name: "giveaway",
    description: "Creates, manages a giveaway and shows a list of all active giveaways",
    defaultMemberPermissions: PermissionFlagsBits.ManageRoles,
    options: [
        {
            name: "create",
            description: "Creates a giveaway",
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: "manage",
            description: "Manages a giveaway",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "options",
                    description: "Choose an option",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: [
                        { name: "End", value: "end" },
                        { name: "Pause", value: "pause" },
                        { name: "Unpause", value: "unpause" },
                        { name: "Reroll", value: "reroll" },
                        { name: "Delete", value: "delete" }
                    ]
                },
                {
                    name: "message-id",
                    description: "Provide the Giveaway Message ID",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        },
        {
            name: "list",
            description: "Lists all giveaways",
            type: ApplicationCommandOptionType.Subcommand
        }
    ],
    async execute(interaction: ChatInputCommandInteraction, client: CustomClient) {
        switch (interaction.options.getSubcommand()) {
            case "create": {
                const prize = new ActionRowBuilder<TextInputBuilder>().setComponents(
                    new TextInputBuilder()
                        .setCustomId("giveaway_prize")
                        .setLabel("Prize")
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(256)
                        .setRequired(true)
                );

                const winners = new ActionRowBuilder<TextInputBuilder>().setComponents(
                    new TextInputBuilder()
                        .setCustomId("giveaway_winners")
                        .setLabel("Winner Count")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                );

                const duration = new ActionRowBuilder<TextInputBuilder>().setComponents(
                    new TextInputBuilder()
                        .setCustomId("giveaway_duration")
                        .setLabel("Duration")
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder("Example: 1 day")
                        .setRequired(true)
                );

                const description = new ActionRowBuilder<TextInputBuilder>().setComponents(
                    new TextInputBuilder()
                        .setCustomId("giveaway_description")
                        .setLabel("Description")
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder("Give a short description about the giveaway")
                        .setMaxLength(1000)
                        .setRequired(true)
                );

                const modal = new ModalBuilder()
                    .setCustomId("giveaway_modal")
                    .setTitle("Create a Giveaway")
                    .setComponents(prize, winners, duration, description);

                await interaction.showModal(modal);

                try {
                    const modalSubmit = await interaction.awaitModalSubmit({ filter: (i) => i.customId === "giveaway_modal", time: ms("10m") });
                    await modalSubmit.deferReply({ ephemeral: true });

                    const prize = modalSubmit.fields.getTextInputValue("giveaway_prize");
                    const winners = Math.round(parseInt(modalSubmit.fields.getTextInputValue("giveaway_winners")));
                    const duration = ms(modalSubmit.fields.getTextInputValue("giveaway_duration"));
                    const description = modalSubmit.fields.getTextInputValue("giveaway_description");

                    if (isNaN(winners) || !isFinite(winners) || winners < 1) return editReply(interaction, "❌", "Please provide a valid winner count!");
                    if (duration === undefined) return editReply(interaction, "❌", "Please provide a valid duration!");

                    const formattedDuration = Math.round((Date.now() + duration) / 1000);
                    const embed = new EmbedBuilder()
                        .setColor(client.data.color)
                        .setTitle(prize)
                        .setDescription(`${description}\n\n**Hosted By:** ${modalSubmit.member}\n**Winner(s):** ${winners}\n**Ends In:** <t:${formattedDuration}:R> (<t:${formattedDuration}>)`)
                        .setFields([
                            { name: "Entries:", value: "0" }
                        ])
                        .setTimestamp(Math.round(Date.now() + duration));

                    const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
                        new ButtonBuilder()
                            .setCustomId("giveaway_join")
                            .setEmoji("🎉")
                            .setStyle(ButtonStyle.Success)
                            .setLabel("Join Here")
                    );

                    editReply(modalSubmit, "✅", `Giveaway has successfully been sent to ${interaction.channel}`);
                    const message = await interaction.channel?.send({ content: "🎉 **Giveaway Started** 🎉", embeds: [embed], components: [row] });
                    await Giveaway.create({
                        guildId: modalSubmit.guild?.id,
                        channelId: modalSubmit.channel?.id,
                        description: description,
                        endTimestamp: formattedDuration,
                        ended: false,
                        hostId: interaction.user.id,
                        prize: prize,
                        winnerCount: winners,
                        paused: false,
                        messageId: message?.id,
                        joined: []
                    });
                } catch (err) {
                    return;
                }
            }
                break;

            case "manage": {
                await interaction.deferReply({ ephemeral: true });

                const messageId = interaction.options.getString("message-id", true);
                const options = interaction.options.getString("options", true);

                const data = await Giveaway.findOne({ guildId: interaction.guild?.id, messageId: messageId }).catch(() => { });
                if (!data) return editReply(interaction, "❌", "Could not find any giveaway with that message ID!");

                interaction.guild?.channels.fetch(data.channelId).then((c) => {
                    const channel = c as BaseGuildTextChannel;

                    channel.messages.fetch(messageId).then(async (message) => {

                        if (["end", "reroll"].includes(options)) {
                            if (data.ended === (options === "end" ? true : false)) return editReply(interaction, "❌", `This giveaway has ${options === "end" ? "already ended" : "not ended"}!`);
                            if (options === "end" && data.paused === true) return editReply(interaction, "❌", "This giveaway is paused; unpause it before ending the giveaway!");

                            endGiveaway(message, client, (options === "end" ? false : true));
                            return editReply(interaction, "✅", `The giveaway has ${options === "end" ? "ended" : "been rerolled"}`);
                        }

                        if (["pause", "unpause"].includes(options)) {
                            if (data.ended) return editReply(interaction, "❌", "This giveaway has already ended!");
                            if (data.paused === (options === "pause" ? true : false)) return editReply(interaction, "❌", `This giveaway is already ${options === "pause" ? "paused" : "unpaused"}!`);

                            const messageComponent = message.components[0] as APIActionRowComponent<APIButtonComponent>;
                            const messageButtonComponent = messageComponent.components[0] as APIButtonComponent;
                            const row = ActionRowBuilder.from<ButtonBuilder>(messageComponent).setComponents(ButtonBuilder.from(messageButtonComponent).setDisabled(options === "pause" ? true : false));
                            const embed = EmbedBuilder.from(message.embeds[0]).setColor(options === "pause" ? "Yellow" : client.data.color);

                            await Giveaway.findOneAndUpdate({
                                guildId: interaction.guild?.id,
                                messageId: message.id
                            }, {
                                paused: options === "pause" ? true : false
                            });
                            await message.edit({ content: `🎉 **Giveaway ${options === "pause" ? "Paused" : "Started"}** 🎉`, embeds: [embed], components: [row] });

                            editReply(interaction, "✅", `The giveaway has been ${options === "pause" ? "paused" : "unpaused"}`);
                            if (options === "unpause" && (data.endTimestamp * 1000) < Date.now()) endGiveaway(message, client);
                        }

                        if (options === "delete") {
                            await Giveaway.deleteOne({ guildId: interaction.guild?.id, messageId: message.id });
                            await message.delete();

                            editReply(interaction, "✅", "The giveaway has been deleted");
                        }
                    }).catch(() => {
                        return editReply(interaction, "❌", "This giveaway doesn't exist!");
                    });
                }).catch(() => {
                    return editReply(interaction, "❌", "This giveaway doesn't exist!");
                });
            }
                break;

            case "list": {
                const data = await Giveaway.find({ guildId: interaction.guild?.id, ended: false }).catch(() => { });
                if (!data || data.length === 0) return reply(interaction, "❌", "There are no active giveaways at this moment!");

                const embeds = createEmbeds(data, 10, client, interaction);
                paginate(interaction, embeds);
            }
                break;
        }
    }
});

function createEmbeds(pages: GiveawayData[], number: number, client: CustomClient, interaction: ChatInputCommandInteraction) {
    const embeds = [];
    let k = number;

    for (let i = 0; i < pages.length; i += number) {
        const current = pages.slice(i, k);
        k += number;
        let index = 1;

        const MappedData = current.map((value) => {
            const link = `[${value.messageId}](https://discord.com/channels/${value.guildId}/${value.channelId}/${value.messageId})`;
            return `\`${index++}.\` **${value.prize}** | <@!${value.hostId}> | <t:${value.endTimestamp}:R> | ${link}`;
        }).join("\n");

        const embed = new EmbedBuilder()
            .setColor(client.data.color)
            .setTitle("`🎉` | Active Giveaways")
            .setThumbnail(interaction.guild?.iconURL() as string)
            .setDescription(MappedData)
            .setTimestamp();
        embeds.push(embed);
    }
    return embeds;
}