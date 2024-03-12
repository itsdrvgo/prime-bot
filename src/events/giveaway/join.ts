import { ButtonInteraction, EmbedBuilder, Events } from "discord.js";
import { Event, editReply } from "../../structure/index.js";
import Giveaway from "../../schemas/Giveaway.js";

export default new Event({
    event: Events.InteractionCreate,
    async execute(interaction: ButtonInteraction) {
        if (!interaction.isButton()) return;
        if (interaction.customId !== "giveaway_join") return;
        await interaction.deferReply({ ephemeral: true });

        const data = await Giveaway.findOne({ guildId: interaction.guild?.id, channelId: interaction.channel?.id, messageId: interaction.message.id }).catch(() => { });
        if (!data) return editReply(interaction, "❌", "Couldn't find any data regarding this giveaway!");
        if (data.joined.includes(interaction.user.id)) return editReply(interaction, "❌", "You have already joined the giveaway!");
        if (data.paused === true) return editReply(interaction, "❌", "This giveaway is currently paused!");
        if (data.ended === true) return editReply(interaction, "❌", "This giveaway has been ended!");

        await Giveaway.findOneAndUpdate({
            guildId: interaction.guild?.id,
            channelId: interaction.channel?.id,
            messageId: interaction.message.id
        }, {
            $push: { joined: interaction.user.id }
        }, {
            returnDocument: "after"
        }).then(async (document) => {
            if (!document) return editReply(interaction, "✅", "You've joined the giveaway, but we couldn't update the count at this moment!");
            const embed = EmbedBuilder.from(interaction.message.embeds[0]);
            await interaction.message.edit({ embeds: [embed.setFields([{ name: "Entries:", value: document.joined.length.toString() }])] });
            return editReply(interaction, "✅", "You have joined the giveaway!");
        });
    }
});