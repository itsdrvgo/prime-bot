
import { ApplicationCommandOptionType, ChatInputCommandInteraction, EmbedBuilder, GuildMember, PermissionFlagsBits } from "discord.js";
import { SlashCommand, CustomClient, editReply, PayPalItem } from "../../structure/index.js";
import Customer from "../../schemas/Customer.js";

export default new SlashCommand({
    name: "invoice",
    description: "Create or cancel any invoice",
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    botOwnerOnly: true,
    options: [
        {
            name: "create",
            description: "Creates a paypal invoice",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "target",
                    description: "Select the orderer",
                    type: ApplicationCommandOptionType.User,
                    required: true
                },
                {
                    name: "paypal",
                    description: "Provide the paypal e-mail ID",
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: "item-name",
                    description: "Provide the item name",
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: "item-description",
                    description: "Provide the item description",
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: "item-price",
                    description: "Provide the item price",
                    type: ApplicationCommandOptionType.Integer,
                    required: true
                }
            ]
        },
        {
            name: "delete",
            description: "Deletes or cancels an invoice",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "invoice-id",
                    description: "Provide the invoice ID",
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: "target",
                    description: "Select a target",
                    type: ApplicationCommandOptionType.User,
                    required: true
                }
            ]
        }
    ],
    async execute(interaction: ChatInputCommandInteraction, client: CustomClient) {
        await interaction.deferReply({ ephemeral: true });

        switch (interaction.options.getSubcommand()) {
            case "create": {
                const target = interaction.options.getMember("target") as GuildMember | null;
                if (!target) return editReply(interaction, "❌", "Couldn't create the invoice, the target doesn't exist!");

                const email = interaction.options.getString("paypal", true);
                const itemName = interaction.options.getString("item-name", true);
                const itemDescription = interaction.options.getString("item-description", true);
                const itemPrice = interaction.options.getInteger("item-price", true);

                const items: PayPalItem[] = [
                    {
                        "name": itemName,
                        "description": itemDescription,
                        "quantity": "1",
                        "unit_amount": {
                            "currency_code": "GBP",
                            "value": itemPrice.toString()
                        }
                    }
                ];

                let cancellationFee: number;
                const customerData = await Customer.findOne({ userId: target.id }).catch(() => { });
                if (customerData) cancellationFee = customerData.strikes * 4;
                else cancellationFee = 0;

                client.paypal.getToken().then((token) => {
                    client.paypal.createInvoice(token.access_token, email, target.user, items, 0, cancellationFee).then((invoice) => {
                        client.paypal.sendInvoice(token.access_token, invoice.href).then(() => {
                            const embed = new EmbedBuilder()
                                .setColor(client.data.color)
                                .setTitle("`💲` | Invoice")
                                .setDescription("An invoice has been sent to your provided paypal account. The invoice is only valid for today. If you've paid the invoice, wait for **15 minutes** at least. After that, if you don't recieve your order, create a ticket.\n\nIf you miss the invoice, or cancel the order, on your next order `£4` will be charged.\n\n_Upon cancelling each order after confirmation, `£4` will be charged on the next order!_")
                                .setThumbnail(target.displayAvatarURL())
                                .setTimestamp();

                            interaction.channel?.send({ content: `${target}`, embeds: [embed] });

                            editReply(interaction, "✅", `Invoice sent with the ID : \`${client.paypal.getInvoiceId(invoice.href)}\``);
                        }).catch((err) => {
                            editReply(interaction, "❌", "Error sending the invoice, " + "```" + err + "```");
                            throw err;
                        });
                    }).catch((err) => {
                        editReply(interaction, "❌", "Error creating the invoice, " + "```" + err + "```");
                        throw err;
                    });
                }).catch((err) => {
                    editReply(interaction, "❌", "Error getting the token, " + "```" + err + "```");
                    throw err;
                });
            }
                break;

            case "delete": {
                const invoiceId = interaction.options.getString("invoice-id", true);
                const target = interaction.options.getMember("target") as GuildMember | null;
                if (!target) return editReply(interaction, "❌", "Couldn't cancel the invoice, the target doesn't exist!");

                client.paypal.cancelInvoice(invoiceId).then(async () => {
                    let customerData = await Customer.findOne({ userId: target.id }).catch(() => { });
                    if (!customerData) {
                        customerData = new Customer({
                            userId: target.id,
                            purchased: [],
                            strikes: 1
                        });
                        await customerData.save();
                    } else {
                        customerData.strikes++;
                        await customerData.save();
                    }

                    editReply(interaction, "✅", `Invoice cancelled with the ID : \`${invoiceId}\``);
                }).catch((err) => {
                    editReply(interaction, "❌", "Couldn't cancel the invoice, " + "```" + err + "```");
                    throw err;
                });
            }
                break;
        }
    }
});