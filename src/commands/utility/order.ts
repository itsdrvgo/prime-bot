import { ChatInputCommandInteraction, ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ChannelType, PermissionFlagsBits, ClientUser, BaseGuildTextChannel, APIEmbedField, GuildMember } from "discord.js";
import { CustomClient, Items, PayPalItem, SlashCommand, editReply } from "../../structure/index.js";
import { items } from "../../items.js";
import Service from "../../schemas/Service.js";
import Order, { OrderData } from "../../schemas/Order.js";
import ms from "ms";
import Voucher from "../../schemas/Voucher.js";
import { CouponValueData, couponValue } from "../../coupon.js";
import Customer, { CustomerData } from "../../schemas/Customer.js";
const choices = items.sort((a, b) => a.price - b.price).map((item) => {
    return { name: `${item.name} | £${item.price}`, value: item.id.toString() };
});

export default new SlashCommand({
    name: "order",
    description: "Places order for requested items",
    options: [
        {
            name: "paypal",
            description: "Provide e-mail linked with your paypal account",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "first-order",
            description: "Select an item",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices
        },
        {
            name: "second-order",
            description: "Select an item (optional)",
            type: ApplicationCommandOptionType.String,
            required: false,
            choices
        },
        {
            name: "third-order",
            description: "Select an item (optional)",
            type: ApplicationCommandOptionType.String,
            required: false,
            choices
        },
        {
            name: "voucher-code",
            description: "Provide the voucher code (if any)",
            type: ApplicationCommandOptionType.String,
            required: false
        }
    ],
    async execute(interaction: ChatInputCommandInteraction, client: CustomClient) {
        await interaction.deferReply({ ephemeral: true });

        const email = interaction.options.getString("paypal", true);
        const firstOrder = interaction.options.getString("first-order", true);
        const secondOrder = interaction.options.getString("second-order");
        const thirdOrder = interaction.options.getString("third-order");
        const voucher = interaction.options.getString("voucher-code");

        const basicItems = findMatch([firstOrder, secondOrder, thirdOrder], ["1", "2", "3", "4"]);
        const supItems = findMatch([firstOrder, secondOrder, thirdOrder], createArrayFromFiveToX(items.length - 5));

        if (basicItems.length !== 0 && supItems.length !== 0) return editReply(interaction, "❌", "The orders you're purchasing has similar type of systems in common, for example, if you're buying any item which is after the `Starter Bot Template` in the store page, it will already include the items before the template along with the template!");

        if ([firstOrder, secondOrder, thirdOrder].includes("0") && firstOrder !== "0") return editReply(interaction, "❌", "If you're ordering a custom item, the custom item must be the `first-order`!");
        if (firstOrder === "0" && (secondOrder || thirdOrder)) return editReply(interaction, "❌", "You're not allowed to order a custom item along with normal item(s), remove the second and third order and put custom item as first order!");

        if ([firstOrder, secondOrder, thirdOrder].includes("0")) return await placeCustomOrder();

        const customerData = await Customer.findOne<CustomerData>({ userId: interaction.user.id }).catch(() => { });
        if (!customerData) return await placeNewOrder();

        const purchasedItemIds: string[] = [];
        customerData.purchased.forEach((item) => purchasedItemIds.push(item.itemId.toString()));

        const orderedItemIds: string[] = [];
        if (firstOrder && secondOrder && thirdOrder) orderedItemIds.push(firstOrder, secondOrder, thirdOrder);
        else if (firstOrder && secondOrder && !thirdOrder) orderedItemIds.push(firstOrder, secondOrder);
        else if (firstOrder && !secondOrder && thirdOrder) orderedItemIds.push(firstOrder, thirdOrder);
        else orderedItemIds.push(firstOrder);

        const finalOrdereredItemIds = orderedItemIds.filter((x) => x !== null);
        const similarItemIds = findMatch(purchasedItemIds, orderedItemIds);

        if (similarItemIds.length === 0) return await placeNewOrder();
        else return await placeOldOrder();

        async function placeCustomOrder() {
            let orderData = await Order.findOne({ ordererId: interaction.user.id }).catch(() => { });
            if (orderData) return editReply(interaction, "❌", "Your previous order is pending, please finish your previous order and try again!");

            const orderedItem = items.find((item) => item.id.toString() === firstOrder);
            if (!orderedItem) return editReply(interaction, "❌", "Cannot place the order at the moment, try again later!");

            const orderChannel = await interaction.guild?.channels.fetch(client.data.devBotEnabled ? "936944928053927957" : "1087028908043542548").catch(() => { }) as BaseGuildTextChannel | null;
            if (!orderChannel) return editReply(interaction, "❌", "An error occured while placing the order, please try again later!");

            orderData = new Order({
                ordererId: interaction.user.id,
                items: [orderedItem.name],
                timestamp: Date.now(),
                price: orderedItem.price,
            });
            await orderData.save();

            const randomId = Math.floor(Math.random() * 90000) + 10000;

            const checkoutChannel = await interaction.guild?.channels.create({
                name: `${interaction.user.username + "-" + randomId}`,
                type: ChannelType.GuildText,
                parent: client.data.devBotEnabled ? "936585040668815410" : "1087028438277304390",
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.AddReactions, PermissionFlagsBits.SendMessages]
                    },
                    {
                        id: (client.user as ClientUser).id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AddReactions]
                    }
                ]
            });

            const fields: APIEmbedField[] = [
                { name: "Items:", value: `\`1\` | ${orderedItem.name} | \`£${orderedItem.price}\``, inline: false },
                { name: "Time of Order:", value: `<t:${Math.round(Date.now() / 1000)}:R>`, inline: false },
                { name: "Orderer:", value: `${interaction.user} (${interaction.user.tag})`, inline: true },
                { name: "Total:", value: `\`£${orderedItem.price}\``, inline: true },
                { name: "Channel:", value: `${checkoutChannel}`, inline: true },
                { name: "Status:", value: "`Ordered`", inline: false }
            ];

            const orderEmbed = new EmbedBuilder()
                .setColor(client.data.color)
                .setTitle("`⭐` | New Order")
                .setThumbnail(interaction.user.displayAvatarURL())
                .addFields(...fields)
                .setFooter({ text: checkoutChannel?.id as string })
                .setTimestamp();

            const orderRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("Ship")
                    .setCustomId("order_ship"),

                new ButtonBuilder()
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("Deliver")
                    .setCustomId("order_deliver"),

                new ButtonBuilder()
                    .setStyle(ButtonStyle.Danger)
                    .setLabel("Cancel")
                    .setCustomId("order_cancel"),

                new ButtonBuilder()
                    .setStyle(ButtonStyle.Primary)
                    .setLabel("Manage")
                    .setCustomId("order_manage"),
            );

            const checkoutEmbed = new EmbedBuilder()
                .setColor(client.data.color)
                .setTitle("`💫` | Your Order")
                .setDescription(`Hey there ${interaction.user}, please provide what type of item would you like to order. It would really help us if you would explain how you want the item to work, like functions, applications etc. We'll be in touch soon!`)
                .addFields(
                    { name: "E-mail:", value: `||${email}||`, inline: false },
                    ...fields
                )
                .setTimestamp();

            const checkoutRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
                new ButtonBuilder()
                    .setCustomId("order_close")
                    .setLabel("Close")
                    .setStyle(ButtonStyle.Danger)
            );

            const orderMessage = await orderChannel.send({ embeds: [orderEmbed], components: [orderRow] });
            const checkoutMessage = await checkoutChannel?.send({ embeds: [checkoutEmbed], components: [checkoutRow] });

            (orderData as OrderData).checkoutMessageId = checkoutMessage?.id;
            (orderData as OrderData).channelId = checkoutChannel?.id;
            (orderData as OrderData).orderMessageId = orderMessage.id;
            await orderData.save();

            editReply(interaction, "✅", `Your order has been placed in : ${checkoutChannel}`);
        }

        async function placeOldOrder() {
            if (similarItemIds.length !== finalOrdereredItemIds.length) return editReply(interaction, "❌", "You can't order already purchased items with a new item, if you want to get the already purchased items, place the orders separately!");

            const similarItemFiles: string[] = [];
            similarItemIds.forEach((item) => {
                const foundItem = items.find((x) => x.id.toString() === item);
                if (!foundItem || !foundItem.file) return;
                similarItemFiles.push(foundItem.file);
            });

            const channel = await interaction.guild?.channels.create({
                name: `${interaction.user.username + "-" + (Math.floor(Math.random() * 90000) + 10000)}`,
                type: ChannelType.GuildText,
                parent: client.data.devBotEnabled ? "936585040668815410" : "1087028438277304390",
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.AddReactions],
                        deny: [PermissionFlagsBits.SendMessages]
                    },
                    {
                        id: (client.user as ClientUser).id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AddReactions]
                    }
                ]
            });

            const embed = new EmbedBuilder()
                .setColor(client.data.color)
                .setTitle("`📦` | Your Delivery")
                .setDescription(`Hey there <@${interaction.user.id}>, seems like you've placed some purchased orders. Here you go! Download the zip and save it on your local machine. Unzip the package to see all the files.\n\n_This channel will be closed <t:${Math.round((Date.now() + ms("15m")) / 1000)}:R>. Thank you!_`)
                .setThumbnail(client.user?.displayAvatarURL() as string)
                .setTimestamp();

            const files = similarItemFiles.map((file) => `./items/${file}`);
            channel?.send({ content: `<@${interaction.user.id}>`, embeds: [embed], files });

            setTimeout(() => {
                channel?.delete().catch((e) => {
                    if (e.code !== 10003) return;
                });
            }, ms("15m"));

            return editReply(interaction, "✅", `Your orders have been replaced in : ${channel}`);
        }

        async function placeNewOrder() {
            const serviceData = await Service.findOne({ guildId: client.data.guilds.primary, state: false }).catch(() => { });
            if (serviceData) return editReply(interaction, "❌", "We're not currently accepting any new orders, please try again later!");

            let orderData = await Order.findOne({ ordererId: interaction.user.id }).catch(() => { });
            if (orderData) return editReply(interaction, "❌", "Your previous order is pending, please finish your previous order and try again!");

            const orderChannel = await interaction.guild?.channels.fetch(client.data.devBotEnabled ? "936944928053927957" : "1087028908043542548") as BaseGuildTextChannel;
            if (!orderChannel) return editReply(interaction, "❌", "An error occured while placing the order, please try again later!");

            const strikeCount = customerData ? customerData.strikes : 0;
            const cancellationFee = 4 * strikeCount;

            const arrayOfItems: Items[] = [];

            const firstItem = items.find((item) => item.id.toString() === firstOrder);
            if (!firstItem) return editReply(interaction, "❌", "The first item doesn't exist!");
            arrayOfItems.push(firstItem);

            if (secondOrder !== null) {
                if (secondOrder !== firstOrder) {
                    const secondItem = items.find((item) => item.id.toString() === secondOrder);
                    if (!secondItem) return editReply(interaction, "❌", "The second item doesn't exist!");
                    arrayOfItems.push(secondItem);
                }
            }
            if (thirdOrder !== null) {
                if (![secondOrder, firstOrder].includes(thirdOrder)) {
                    const thirdItem = items.find((item) => item.id.toString() === thirdOrder);
                    if (!thirdItem) return editReply(interaction, "❌", "The third item doesn't exist!");
                    arrayOfItems.push(thirdItem);
                }
            }

            const mappedItemNames = arrayOfItems.map((item) => item.name);
            const mappedItemFiles = arrayOfItems.map((item) => item.file);
            const rawOrderTotal = arrayOfItems.map((item) => item.price).reduce((a, b) => a + b, 0).toString();

            let orderTotal: string;
            let discount: number;
            let note: string;

            if (voucher) {
                const voucherData = await Voucher.findOne({ code: voucher }).catch(() => { });
                if (!voucherData) orderTotal = rawOrderTotal, discount = 0, note = "Invalid Voucher Code";
                else {
                    if (voucherData.userIds?.includes(interaction.user.id)) {
                        orderTotal = rawOrderTotal;
                        discount = 0;
                        note = "`•` **Coupon :** Coupon cannot be applied (already redeemed by you)";
                    } else if (voucherData.expiry !== 0 && voucherData.expiry < Date.now()) {
                        orderTotal = rawOrderTotal;
                        discount = 0;
                        note = "`•` **Coupon :** Coupon cannot be applied (coupon expired)";

                        await voucherData.deleteOne();
                    } else if ((voucherData.uses as number) >= voucherData.maxUse) {
                        orderTotal = rawOrderTotal;
                        discount = 0;
                        note = "`•` **Coupon :** Coupon cannot be applied (maximum coupon usage reached)";

                        await voucherData.deleteOne();
                    } else {
                        const validVoucher = couponValue.find((coupon) => coupon.type === voucherData.type.toString()) as CouponValueData;
                        orderTotal = (parseInt(rawOrderTotal) - ((parseInt(rawOrderTotal) * validVoucher?.discount) / 100)).toFixed(2);
                        discount = validVoucher?.discount;
                        note = "`•` **Coupon :** Coupon Applied";

                        (voucherData.uses as number)++;
                        voucherData.userIds?.push(interaction.user.id);
                        await voucherData.save();
                    }
                }
            } else if ((interaction.member as GuildMember).premiumSince !== null) {
                orderTotal = (parseInt(rawOrderTotal) - ((parseInt(rawOrderTotal) * 10) / 100)).toFixed(2);
                discount = 10;
                note = "`•` **Coupon :** None";
            } else orderTotal = rawOrderTotal, discount = 0, note = "`•` **Coupon :** None\n`•` **Booster Discount :** `10%`";

            if (cancellationFee !== 0) note = note + "\n" + `\`•\` **Fee :** \`£${cancellationFee}\` has been charged as cancellation fees as you've cancelled your previous orders \`${customerData?.strikes}\` times`;
            const price = (parseFloat(orderTotal) + cancellationFee).toString();

            orderData = new Order({
                ordererId: interaction.user.id,
                items: mappedItemNames,
                timestamp: Date.now(),
                price,
                files: mappedItemFiles
            });
            await orderData.save();

            const cartEmbed = new EmbedBuilder()
                .setColor(client.data.color)
                .setTitle("`🛒` | Your Cart")
                .setDescription(`Verify your order, before you place it! Click on \`Checkout\` to place the order and \`Cancel\` to cancel it. The verify page will expire <t:${Math.round((Date.now() + ms("1m")) / 1000)}:R>.\n\n_By purchasing items from us, you also agree to our **[Privacy Policy](https://discord.com/channels/1024309441723650109/1087028805618630716/1087043936943624292)** & **[Terms of Services](https://discord.com/channels/1024309441723650109/1087028805618630716/1087043936943624292)**._`)
                .addFields(
                    { name: "Items Ordered:", value: arrayOfItems.map((item, index) => { return `\`${index + 1}\` | ${item.name} | \`£${item.price}\``; }).join("\n"), inline: false },
                    { name: "Time of Order:", value: `<t:${Math.round(Date.now() / 1000)}:R>`, inline: true },
                    { name: "Orderer:", value: `${interaction.user} (${interaction.user.tag})`, inline: true },
                    { name: "Order Total:", value: `\`£${price}\``, inline: false },
                    { name: "Note:", value: note, inline: false }
                )
                .setThumbnail(interaction.user.displayAvatarURL())
                .setTimestamp();

            const cartRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
                new ButtonBuilder()
                    .setCustomId("cart_cancel")
                    .setLabel("Cancel")
                    .setStyle(ButtonStyle.Danger),

                new ButtonBuilder()
                    .setCustomId("cart_checkout")
                    .setLabel("Checkout")
                    .setStyle(ButtonStyle.Success)
            );

            const checkoutPage = await interaction.editReply({ embeds: [cartEmbed], components: [cartRow] });
            const collector = checkoutPage.createMessageComponentCollector({ componentType: ComponentType.Button, time: ms("1m") });

            collector.on("collect", async (i) => {
                await i.deferReply({ ephemeral: true });
                if (i.user.id !== interaction.user.id) return editReply(i, "❌", "You can't use this button!");

                switch (i.customId) {
                    case "cart_cancel": {
                        editReply(i, "✅", "Processing request...");
                        await orderData?.deleteOne();

                        interaction.editReply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client.data.color)
                                    .setDescription("`✅` | Your order has been cancelled")
                            ],
                            components: []
                        });
                    }
                        break;

                    case "cart_checkout": {
                        editReply(i, "✅", "Processing request...");

                        interaction.editReply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client.data.color)
                                    .setDescription("`✅` | Your order has been placed")
                            ],
                            components: []
                        });

                        handleCheckout();
                    }
                        break;
                }
            });

            collector.on("end", async (collected) => {
                if (collected.size === 0) {
                    await orderData?.deleteOne();

                    interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(client.data.color)
                                .setDescription("`❌` | You didn't confirm your order in time!")
                        ],
                        components: []
                    });
                }
            });

            async function handleCheckout() {
                const randomId = Math.floor(Math.random() * 90000) + 10000;

                const checkoutChannel = await interaction.guild?.channels.create({
                    name: `${interaction.user.username + "-" + randomId}`,
                    type: ChannelType.GuildText,
                    parent: client.data.devBotEnabled ? "936585040668815410" : "1087028438277304390",
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionFlagsBits.ViewChannel]
                        },
                        {
                            id: interaction.user.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.AddReactions],
                            deny: [PermissionFlagsBits.SendMessages]
                        },
                        {
                            id: (client.user as ClientUser).id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AddReactions]
                        }
                    ]
                });

                (orderData as OrderData).channelId = checkoutChannel?.id;
                await orderData?.save();

                async function handleError(err: Error) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(client.data.color)
                        .setTitle("`💲` | Invoice")
                        .setDescription("An error occcured while sending you the invoice, please re-check your e-mail address. Remember it must be the e-mail address which is linked with your paypal. The issue has been reported, if it was found to be an issue from our end, we'll surely try to fix it ASAP.\n\n**Possible Issues**\n`1.` The e-mail you provided is not correct.\n`2.` PayPal doesn't allow to send or receive invoices inside India. If you're Indian, or trying to pay via an Indian PayPal Account, contact Drago personally.\n\n_This channel will be deleted soon!_")
                        .setThumbnail(interaction.user.displayAvatarURL())
                        .setTimestamp();

                    checkoutChannel?.send({ content: `${interaction.user}`, embeds: [errorEmbed] });
                    await orderData?.deleteOne();

                    setTimeout(async () => {
                        checkoutChannel?.delete().catch((e) => {
                            if (e.code !== 10003) return;
                        });
                    }, ms("1m"));

                    throw err;
                }

                const items: PayPalItem[] = arrayOfItems.map((item) => {
                    return {
                        "name": item.name,
                        "description": item.description,
                        "quantity": "1",
                        "unit_amount": {
                            "currency_code": "GBP",
                            "value": item.price.toString()
                        }
                    };
                });

                client.paypal.getToken().then(async (token) => {
                    const orderEmbed = new EmbedBuilder()
                        .setColor(client.data.color)
                        .setTitle("`⭐` | New Order")
                        .setThumbnail(interaction.user.displayAvatarURL())
                        .addFields(
                            { name: "Items:", value: arrayOfItems.map((item, index) => { return `\`${index + 1}\` | ${item.name} | \`£${item.price}\``; }).join("\n"), inline: false },
                            { name: "Time of Order:", value: `<t:${Math.round(Date.now() / 1000)}:R>`, inline: false },
                            { name: "Orderer:", value: `${interaction.user} (${interaction.user.tag})`, inline: true },
                            { name: "Total:", value: `\`£${price}\``, inline: true },
                            { name: "Channel:", value: `${checkoutChannel}`, inline: true },
                            { name: "Status:", value: "`Ordered`", inline: false }
                        )
                        .setTimestamp();

                    const orderMessage = await orderChannel.send({ embeds: [orderEmbed] });
                    (orderData as OrderData).orderMessageId = orderMessage.id;
                    await orderData?.save();

                    client.paypal.createInvoice(token.access_token, email, interaction.user, items, discount, cancellationFee).then((invoice) => {
                        client.paypal.sendInvoice(token.access_token, invoice.href).then(async () => {
                            (orderData as OrderData).invoiceId = client.paypal.getInvoiceId(invoice.href);
                            await orderData?.save();

                            const checkoutEmbed = new EmbedBuilder()
                                .setColor(client.data.color)
                                .setTitle("`💲` | Invoice")
                                .setDescription("An invoice has been sent to your provided paypal account. The invoice is only valid for today. If you've paid the invoice, wait for **15 minutes** at least. After that, if you don't recieve your order, create a ticket.\n\nIf you miss the invoice, or cancel the order, on your next order `£4` will be charged.\n\n_Upon cancelling each order after confirmation, `£4` will be charged on the next order!_")
                                .setThumbnail(interaction.user.displayAvatarURL())
                                .setFooter({ text: `${orderData?._id}` })
                                .setTimestamp();

                            const invoiceRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
                                new ButtonBuilder()
                                    .setCustomId("cancel_order")
                                    .setLabel("Cancel")
                                    .setStyle(ButtonStyle.Danger)
                            );

                            const invoiceMessage = await checkoutChannel?.send({ content: `${interaction.user}`, embeds: [checkoutEmbed], components: [invoiceRow] });
                            (orderData as OrderData).checkoutMessageId = invoiceMessage?.id;
                            await orderData?.save();

                            setTimeout(() => {
                                const orderEmbedData = orderMessage.embeds[0];
                                if (orderEmbedData.fields[5].value === "`Delivered`") return;
                                orderEmbedData.fields[5] = { name: "Status:", value: "`Shipped`", inline: false };
                                orderMessage.edit({ embeds: [EmbedBuilder.from(orderEmbedData)] });
                            }, ms("30s"));
                        }).catch((err) => {
                            handleError(err);
                        });
                    }).catch((err) => {
                        handleError(err);
                    });
                }).catch((err) => {
                    handleError(err);
                });
            }
        }
    }
});

function findMatch(arrayOne: (string | null)[], arrayTwo: (string | null)[]) {
    const matchElements = arrayOne.filter((element) => arrayTwo.includes(element));
    return matchElements;
}

function createArrayFromFiveToX(x: number) {
    const result: string[] = [];
    for (let i = 5; i <= x; i++) {
        result.push(i.toString());
    }
    return result;
}