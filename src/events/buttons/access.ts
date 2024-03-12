import { ActionRowBuilder, BaseGuildTextChannel, ButtonInteraction, EmbedBuilder, Events, GuildMember, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { CustomClient, Event, editReply } from "../../structure/index.js";
import ms from "ms";

export default new Event({
    event: Events.InteractionCreate,
    async execute(interaction: ButtonInteraction, client: CustomClient) {
        if (!interaction.isButton()) return;
        if (interaction.customId !== "repo_access") return;

        const modal = new ModalBuilder()
            .setCustomId("repo_access_modal")
            .setTitle("Repository Access");

        const emailInput = new TextInputBuilder()
            .setCustomId("emailInput")
            .setLabel("E-mail")
            .setPlaceholder("Provide your email which is linked with GitHub")
            .setRequired(true)
            .setStyle(TextInputStyle.Short);

        const row = new ActionRowBuilder<TextInputBuilder>().addComponents(emailInput);
        modal.addComponents(row);
        await interaction.showModal(modal);

        try {
            const modalSubmit = await interaction.awaitModalSubmit({ filter: (i) => i.customId === "repo_access_modal", time: ms("10m") });
            await modalSubmit.deferReply({ ephemeral: true });

            const email = modalSubmit.fields.getTextInputValue("emailInput");
            const channel = await modalSubmit.guild?.channels.fetch("1024309444932288566") as BaseGuildTextChannel;
            if (!channel) return editReply(modalSubmit, "❌", "Please contact the owner to manually give you access!");

            channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.data.color)
                        .setTitle("`✨` | New Access Request")
                        .addFields(
                            { name: "Member:", value: `${modalSubmit.member}`, inline: true },
                            { name: "ID:", value: `${(modalSubmit.member as GuildMember).id}`, inline: true },
                            { name: "E-mail:", value: email, inline: false }
                        )
                        .setThumbnail((modalSubmit.member as GuildMember).displayAvatarURL())
                        .setTimestamp()
                ]
            });

            editReply(modalSubmit, "✅", "Your request has been sent");
        } catch (err) {
            return;
        }
    }
});