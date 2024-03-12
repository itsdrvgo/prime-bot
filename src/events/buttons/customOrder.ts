import { APIActionRowComponent, APIButtonComponent, ActionRowBuilder, BaseGuildTextChannel, ButtonBuilder, ButtonInteraction, ButtonStyle, EmbedBuilder, Events, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { CustomClient, Event, PayPalItem, editReply, reply } from "../../structure/index.js";
import ms from "ms";
import Order from "../../schemas/Order.js";

export default new Event({
    event: Events.InteractionCreate,
    async execute(interaction: ButtonInteraction, client: CustomClient) {
        if (!interaction.isButton()) return;
        if (!["order_ship", "order_deliver", "order_cancel", "order_manage"].includes(interaction.customId)) return;

        const embedData = interaction.message.embeds[0];
        if (!embedData) return editReply(interaction, "❌", "The embed doesn't exist!");

        const orderData = await Order.findOne({ channelId: embedData.footer?.text }).catch(() => { });
        if (!orderData) return reply(interaction, "❌", "The data for the order doesn't exist!");

        if (!client.data.developers.includes(interaction.user.id)) return reply(interaction, "❌", "You can't use this button!");

        switch (interaction.customId) {
            case "order_ship": {
                await interaction.deferReply({ ephemeral: true });
                if (embedData.fields[3].value === "`£0`") return editReply(interaction, "❌", "Item cannot be shipped unless the price is fixed!");

                embedData.fields[5].value = "`Shipped`";
                const embed = EmbedBuilder.from(embedData);

                const restButtons: ButtonBuilder[] = [];
                for (let index = 1; index < interaction.message.components[0].components.length; index++) {
                    restButtons.push(
                        ButtonBuilder.from((interaction.message.components[0] as APIActionRowComponent<APIButtonComponent>).components[index])
                    );
                }

                const messageRow = interaction.message.components[0] as APIActionRowComponent<APIButtonComponent>;
                const buttonData = messageRow.components[0];
                const finalRow = ActionRowBuilder.from<ButtonBuilder>(messageRow).setComponents(
                    ButtonBuilder.from(buttonData).setLabel("Shipped").setDisabled(true),
                    ...restButtons
                );

                const checkoutChannel = await interaction.guild?.channels.fetch(orderData.channelId as string).catch(() => { }) as BaseGuildTextChannel | null;
                if (!checkoutChannel) return editReply(interaction, "❌", "Invoice creation failed, failed to find the channel!");

                const checkoutMessage = await checkoutChannel.messages.fetch(orderData.checkoutMessageId as string).catch(() => { });
                if (!checkoutMessage) return editReply(interaction, "❌", "Invoice creation failed, failed to find the message!");

                const checkoutEmbedData = checkoutMessage.embeds[0];
                checkoutEmbedData.fields[6].value = "`Shipped`";
                const checkoutEmbed = EmbedBuilder.from(checkoutEmbedData);

                const items: PayPalItem[] = [
                    {
                        "name": checkoutEmbedData.fields[1].value.split(" | ")[1],
                        "description": "Custom Item",
                        "quantity": "1",
                        "unit_amount": {
                            "currency_code": "GBP",
                            "value": checkoutEmbedData.fields[4].value.split("`")[1].substring(1)
                        }
                    }
                ];

                client.paypal.getToken().then((token) => {
                    client.paypal.createInvoice(token.access_token, checkoutEmbedData.fields[0].value.substring(2, checkoutEmbedData.fields[0].value.length - 2), interaction.user, items, 0, 0).then((invoice) => {
                        client.paypal.sendInvoice(token.access_token, invoice.href).then(() => {
                            checkoutMessage.edit({ embeds: [checkoutEmbed] });
                            interaction.message.edit({ embeds: [embed], components: [finalRow] });
                            editReply(interaction, "✅", "Order has been shipped");
                        }).catch((err) => {
                            editReply(interaction, "❌", "Error sending the invoice, " + "```" + err + "```");
                            throw err;
                        });
                    }).catch((err) => {
                        editReply(interaction, "❌", "Error creating the invoice, " + "```" + err + "```");
                        throw err;
                    }).catch((err) => {
                        editReply(interaction, "❌", "Error getting the token, " + "```" + err + "```");
                        throw err;
                    });
                });
            }
                break;

            case "order_deliver": {
                await interaction.deferReply({ ephemeral: true });
                embedData.fields[5].value = "`Delivered`";
                const embed = EmbedBuilder.from(embedData);

                const checkoutChannel = await interaction.guild?.channels.fetch(orderData.channelId as string).catch(() => { }) as BaseGuildTextChannel | null;
                if (!checkoutChannel) return editReply(interaction, "❌", "Invoice creation failed, failed to find the channel!");

                const reviewEmbed = new EmbedBuilder()
                    .setColor(client.data.color)
                    .setTitle("`📦` | Thanks for Purchasing")
                    .setDescription(`Thank you <@${orderData.ordererId}> for buying a custom item from us._\n\n**\`Rate us below!\`**`)
                    .setThumbnail(client.user?.displayAvatarURL() as string)
                    .setTimestamp();

                const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];
                const reviewComponents: ButtonBuilder[] = [];

                for (let i = 0; i < 5; i++) {
                    const button = new ButtonBuilder()
                        .setCustomId(`review_${i}`)
                        .setLabel(emojis[i])
                        .setStyle(ButtonStyle.Secondary);

                    reviewComponents.push(button);
                }

                const reviewRow = new ActionRowBuilder<ButtonBuilder>().setComponents(reviewComponents);
                checkoutChannel.send({ content: `<@${orderData.ordererId}>`, embeds: [reviewEmbed], components: [reviewRow] });

                await orderData.deleteOne();
                interaction.message.edit({ embeds: [embed], components: [] });
                editReply(interaction, "✅", "Order has been delivered");
            }
                break;

            case "order_cancel": {
                await interaction.deferReply({ ephemeral: true });
                embedData.fields[5].value = "`Cancelled`";
                const embed = EmbedBuilder.from(embedData);

                await orderData.deleteOne();

                interaction.message.edit({ embeds: [embed], components: [] });
                editReply(interaction, "✅", "Order has been cancelled");
            }
                break;

            case "order_manage": {
                const modal = new ModalBuilder()
                    .setTitle("Manage Order")
                    .setCustomId("order_manage_modal");

                const priceInput = new ActionRowBuilder<TextInputBuilder>().setComponents(
                    new TextInputBuilder()
                        .setCustomId("priceInput")
                        .setLabel("Price")
                        .setPlaceholder("Enter the price (GBP)")
                        .setRequired(true)
                        .setStyle(TextInputStyle.Short)
                );

                const nameInput = new ActionRowBuilder<TextInputBuilder>().setComponents(
                    new TextInputBuilder()
                        .setCustomId("nameInput")
                        .setLabel("Name")
                        .setPlaceholder("Enter the order name")
                        .setRequired(true)
                        .setStyle(TextInputStyle.Short)
                );

                modal.setComponents(priceInput, nameInput);
                await interaction.showModal(modal);

                try {
                    const modalSubmit = await interaction.awaitModalSubmit({ filter: (i) => i.customId === "order_manage_modal", time: ms("10m") });
                    await modalSubmit.deferReply({ ephemeral: true });

                    const price = modalSubmit.fields.getTextInputValue("priceInput");
                    const name = modalSubmit.fields.getTextInputValue("nameInput");

                    embedData.fields[0].value = `\`1\` | ${name} (Custom) | \`£${price}\``;
                    embedData.fields[3].value = `\`£${price}\``;
                    const embed = EmbedBuilder.from(embedData);
                    interaction.message.edit({ embeds: [embed] });

                    orderData.price = price;
                    orderData.items = [name];
                    await orderData.save();

                    const checkoutChannel = await interaction.guild?.channels.fetch(orderData.channelId as string).catch(() => { }) as BaseGuildTextChannel | null;
                    if (!checkoutChannel) return editReply(interaction, "❌", "Invoice creation failed, failed to find the channel!");

                    const checkoutMessage = await checkoutChannel.messages.fetch(orderData.checkoutMessageId as string).catch(() => { });
                    if (!checkoutMessage) return editReply(interaction, "❌", "Invoice creation failed, failed to find the message!");

                    const checkoutEmbedData = checkoutMessage.embeds[0];
                    checkoutEmbedData.fields[1].value = `\`1\` | ${name} (Custom) | \`£${price}\``;
                    checkoutEmbedData.fields[4].value = `\`£${price}\``;
                    const checkoutEmbed = EmbedBuilder.from(checkoutEmbedData);

                    checkoutMessage.edit({ embeds: [checkoutEmbed] });
                    editReply(modalSubmit, "✅", "Order has been updated");
                } catch (err) {
                    return;
                }
            }
                break;
        }
    }
});