import { ButtonInteraction, Events } from "discord.js";
import { CustomClient, Event, editReply } from "../../structure/index.js";
import ms from "ms";

export default new Event({
    event: Events.InteractionCreate,
    async execute(interaction: ButtonInteraction, client: CustomClient) {
        if (!interaction.isButton()) return;
        if (interaction.customId !== "order_close") return;

        await interaction.deferReply({ ephemeral: true });
        if (!client.data.developers.includes(interaction.user.id)) return editReply(interaction, "❌", "You can't use this button!");
        editReply(interaction, "✅", "Channel has been scheduled to be closed");
        setTimeout(() => {
            interaction.channel?.delete().catch((e) => {
                if (e.code !== 10003) return;
            });
        }, ms("1m"));
    }
});