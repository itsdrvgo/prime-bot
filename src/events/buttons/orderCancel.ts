import { BaseGuildTextChannel, ButtonInteraction, EmbedBuilder, Events } from "discord.js";
import { CustomClient, Event, editReply } from "../../structure/index.js";
import Order from "../../schemas/Order.js";
import ms from "ms";
import Customer from "../../schemas/Customer.js";

export default new Event({
    event: Events.InteractionCreate,
    async execute(interaction: ButtonInteraction, client: CustomClient) {
        if (!interaction.isButton()) return;
        if (interaction.customId !== "cancel_order") return;
        await interaction.deferReply({ ephemeral: true });

        const orderId = interaction.message.embeds[0].footer?.text;
        if (!orderId) return editReply(interaction, "❌", "This order cannot be cancelled, please contact the seller!");

        const orderData = await Order.findOne({ _id: orderId }).catch(() => { });
        if (!orderData) return editReply(interaction, "❌", "This order cannot be cancelled, please contact the seller!");
        if (orderData.ordererId !== interaction.user.id) return editReply(interaction, "❌", "You can't cancel the order!");

        const orderChannel = await client.channels.fetch(client.data.devBotEnabled ? "936944928053927957" : "1087028908043542548") as BaseGuildTextChannel;
        if (!orderChannel) return editReply(interaction, "❌", "This order cannot be cancelled, please contact the seller!");

        const orderMessage = await orderChannel.messages.fetch(orderData.orderMessageId as string);
        if (!orderMessage) return editReply(interaction, "❌", "This order cannot be cancelled, please contact the seller!");
        if (orderMessage.embeds[0].fields[5].value === "`Shipped`") return editReply(interaction, "❌", "The order has been shipped and cannot be cancelled anymore!");

        client.paypal.cancelInvoice(orderData.invoiceId as string).then(async () => {
            await interaction.message.edit({ components: [] });
            await orderData.deleteOne();

            let customerData = await Customer.findOne({ userId: interaction.user.id }).catch(() => { });
            if (!customerData) {
                customerData = new Customer({
                    userId: interaction.user.id,
                    purchased: [],
                    strikes: 1
                });
                await customerData.save();
            } else {
                customerData.strikes++;
                await customerData.save();
            }

            editReply(interaction, "✅", "Your order has been cancelled, this channel will be deleted soon");

            setTimeout(() => {
                interaction.channel?.delete().catch((e) => {
                    if (e.code !== 10003) return;
                });
            }, ms("15s"));

            const orderEmbedData = orderMessage.embeds[0];
            orderEmbedData.fields[5] = { name: "Status:", value: "`Cancelled`", inline: false };
            orderMessage.edit({ embeds: [EmbedBuilder.from(orderEmbedData)] });
        }).catch((err) => {
            editReply(interaction, "❌", "This order cannot be cancelled, please contact the seller!");
            throw err;
        });
    }
});