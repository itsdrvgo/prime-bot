import { ActionRowBuilder, BaseGuildTextChannel, ButtonInteraction, EmbedBuilder, Events, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { CustomClient, Event, editReply } from "../../structure/index.js";
import ms from "ms";
import Review from "../../schemas/Review.js";

export default new Event({
    event: Events.InteractionCreate,
    async execute(interaction: ButtonInteraction, client: CustomClient) {
        if (!interaction.isButton()) return;
        if (!interaction.customId.startsWith("review_")) return;

        const modal = new ModalBuilder()
            .setTitle("Review")
            .setCustomId("review_modal");

        const reviewInput = new TextInputBuilder()
            .setCustomId("reviewInput")
            .setLabel("Review")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Enter your review here")
            .setRequired(false);

        const row = new ActionRowBuilder<TextInputBuilder>().addComponents(reviewInput);
        modal.addComponents(row);
        await interaction.showModal(modal);

        try {
            const modalSubmit = await interaction.awaitModalSubmit({ filter: (i) => i.customId === "review_modal", time: ms("5m") });
            await modalSubmit.deferReply({ ephemeral: true });

            let data = await Review.findOne({ userId: modalSubmit.user.id, channelId: modalSubmit.channel?.id }).catch(() => { });
            if (data) return editReply(modalSubmit, "❌", "You've already voted once!");

            const channel = await client.channels.fetch(client.data.devBotEnabled ? "936944928053927957" : "1087028987206828105") as BaseGuildTextChannel;
            if (!channel) return;

            const star = "⭐";

            const embed = new EmbedBuilder()
                .setColor(client.data.color)
                .setTitle("`💞` | New Review")
                .addFields(
                    { name: "Reviewer:", value: `${modalSubmit.user}` },
                    { name: "Stars:", value: `\`${star.repeat(parseInt(interaction.customId.split("_")[1]) + 1)}\`` },
                    { name: "Note:", value: modalSubmit.fields.getTextInputValue("reviewInput") || "None" },
                )
                .setThumbnail(modalSubmit.user.displayAvatarURL())
                .setTimestamp();

            const message = await channel.send({ embeds: [embed] });
            await message.react("💞");

            data = new Review({
                userId: modalSubmit.user.id,
                starCount: parseInt(interaction.customId.split("_")[1]) + 1,
                review: modalSubmit.fields.getTextInputValue("reviewInput") || "None",
                channelId: modalSubmit.channel?.id
            });
            await data.save();

            editReply(modalSubmit, "✅", "Your review has been submitted");
        } catch (err) {
            return;
        }
    }
});