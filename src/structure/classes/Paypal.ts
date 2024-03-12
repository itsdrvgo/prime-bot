import axios from "axios";
import qs from "qs";
import { CustomClient } from "./index.js";
import { InvoiceOptions, PayPalInvoiceNumber, PayPalInvoiceResponse, PayPalItem, PayPalToken } from "../interfaces/index.js";
import { ActionRowBuilder, BaseGuildTextChannel, ButtonBuilder, ButtonStyle, EmbedBuilder, User } from "discord.js";
import Order from "../../schemas/Order.js";
import ms from "ms";
import Customer, { PurchaseData } from "../../schemas/Customer.js";
import { items } from "../../items.js";

export class PayPal {
    private client: CustomClient;
    constructor(client: CustomClient) {
        this.client = client;
    }

    async getToken() {
        const { data } = await axios.post<PayPalToken>(`${this.client.data.devBotEnabled ? this.client.data.paypal.dev.url : this.client.data.paypal.prod.url}/v1/oauth2/token`, qs.stringify({ "grant_type": "client_credentials" }), {
            headers: {
                "Accept": "application/json",
                "Accept-Language": "en_US",
                "Content-type": "application/x-www-form-urlencoded"
            },
            auth: {
                "username": this.client.data.devBotEnabled ? this.client.data.paypal.dev.id : this.client.data.paypal.prod.id,
                "password": this.client.data.devBotEnabled ? this.client.data.paypal.dev.secret : this.client.data.paypal.prod.secret
            }
        });

        return data;
    }

    async getInvoiceNumber(accessToken: string) {
        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`
        };

        const { data } = await axios.post<PayPalInvoiceNumber>(`${this.client.data.devBotEnabled ? this.client.data.paypal.dev.url : this.client.data.paypal.prod.url}/v2/invoicing/generate-next-invoice-number`, {}, { headers });

        return data;
    }

    async createInvoice(accessToken: string, email: string, user: User, items: PayPalItem[], discount: number, cancellationFee: number) {
        const invoiceNumber = (await this.getInvoiceNumber(accessToken)).invoice_number;
        const date = new Date();
        const invoiceDate = date.getFullYear() + "-" + (((date.getMonth() + 1) < 10) ? `0${date.getMonth() + 1}` : (date.getMonth() + 1)) + "-" + ((date.getDate() < 10) ? `0${date.getDate()}` : date.getDate());

        const invoice = {
            "detail": {
                "invoice_number": invoiceNumber,
                "reference": Date.now().toString(),
                "invoice_date": invoiceDate,
                "currency_code": "GBP",
                "note": "Thank you for purchasing items from us. Come back again!",
                "payment_term": {
                    "term_type": "NET_30"
                }
            },
            "invoicer": {
                "name": {
                    "given_name": "Sarthak",
                    "surname": "Kundu"
                },
                "email_address": this.client.data.devBotEnabled ? this.client.data.paypal.dev.email : this.client.data.paypal.prod.email
            },
            "primary_recipients": [
                {
                    "billing_info": {
                        "name": {
                            "given_name": user.username,
                            "surname": user.discriminator
                        },
                        "email_address": email,
                    },
                    "shipping_info": {
                        "name": {
                            "given_name": user.username,
                            "surname": user.discriminator
                        }
                    }
                }
            ],
            "items": items,
            "amount": {
                "breakdown": {
                    "custom": {
                        "label": "Cancellation Fee",
                        "amount": {
                            "currency_code": "GBP",
                            "value": cancellationFee.toString()
                        }
                    },
                    "discount": {
                        "invoice_discount": {
                            "percent": discount.toString()
                        }
                    }
                }
            }
        };

        const { data } = await axios.post<PayPalInvoiceResponse>(`${this.client.data.devBotEnabled ? this.client.data.paypal.dev.url : this.client.data.paypal.prod.url}/v2/invoicing/invoices`, invoice, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            }
        });
        return data;
    }

    getInvoiceId(invoiceUrl: string) {
        const id = invoiceUrl.split("/").pop() as string;
        return id;
    }

    async sendInvoice(accessToken: string, invoiceUrl: string) {
        const invoiceId = this.getInvoiceId(invoiceUrl);
        const { data } = await axios.post(`${this.client.data.devBotEnabled ? this.client.data.paypal.dev.url : this.client.data.paypal.prod.url}/v2/invoicing/invoices/${invoiceId}/send`, {
            "send_to_invoicer": true
        }, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
                "PayPal-Request-Id": Date.now().toString(),
                "Accept": "application/json"
            }
        });

        return data;
    }

    async cancelInvoice(invoiceId: string) {
        const accessToken = (await this.client.paypal.getToken()).access_token;
        const { data } = await axios.post(`${this.client.data.devBotEnabled ? this.client.data.paypal.dev.url : this.client.data.paypal.prod.url}/v2/invoicing/invoices/${invoiceId}/cancel`, {
            "subject": "Invoice Cancelled",
            "send_to_recipient": true
        }, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            }
        });

        return data;
    }

    async handlePaidInvoice(options: InvoiceOptions) {
        const invoiceId = options.payload?.resource.invoice.id || options.paidInvoiceId;

        const orderData = await Order.findOne({ invoiceId }).catch(() => { });
        if (!orderData) return;
        if (!orderData.channelId) return;
        if (!orderData.checkoutMessageId) return;

        const channel = await this.client.channels.fetch(orderData.channelId) as BaseGuildTextChannel;
        if (!channel) return;

        const invoiceMessage = await channel.messages.fetch(orderData.checkoutMessageId);
        if (!invoiceMessage) return;
        invoiceMessage.edit({ components: [] });

        const boughtItems = orderData.items.map((name) => `\`${name}\``).join(", ");
        const embed = new EmbedBuilder()
            .setColor(this.client.data.color)
            .setTitle("`📦` | Your Delivery")
            .setDescription(`Thank you <@${orderData.ordererId}> for buying ${boughtItems} from us. Here's your delivery. Download the zip and save it on your local machine. Unzip the package to see all the files.\n\n_This channel will be closed <t:${Math.round((Date.now() + ms("15m")) / 1000)}:R>. Thank you!_\n\n**\`Rate us below!\`**`)
            .setThumbnail(this.client.user?.displayAvatarURL() as string)
            .setTimestamp();

        const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];
        const components: ButtonBuilder[] = [];

        for (let i = 0; i < 5; i++) {
            const button = new ButtonBuilder()
                .setCustomId(`review_${i}`)
                .setLabel(emojis[i])
                .setStyle(ButtonStyle.Secondary);

            components.push(button);
        }

        const row = new ActionRowBuilder<ButtonBuilder>().setComponents(components);

        const files = orderData.files?.map((file) => `./items/${file}`);
        channel.send({ content: `<@${orderData.ordererId}>`, embeds: [embed], components: [row], files });
        await orderData.deleteOne();

        const purchased: PurchaseData[] = [];

        orderData.items.forEach((item) => {
            const itemInfo = items.find((x) => x.name === item);
            if (itemInfo) {
                const purchasedItem: PurchaseData = {
                    itemId: itemInfo.id,
                    timestamp: Date.now()
                };
                purchased.push(purchasedItem);
            }
        });

        let customerData = await Customer.findOne({ userId: orderData.ordererId }).catch(() => { });
        if (!customerData) {
            customerData = new Customer({
                userId: orderData.ordererId,
                purchased,
                strikes: 0
            });

            await customerData.save();
        } else {
            customerData.purchased.push(...purchased);
            customerData.strikes = 0;
            await customerData.save();
        }

        setTimeout(() => {
            channel?.delete().catch((e) => {
                if (e.code !== 10003) return;
            });
        }, ms("15m"));

        const orderChannel = await this.client.channels.fetch(this.client.data.devBotEnabled ? "936944928053927957" : "1087028908043542548") as BaseGuildTextChannel;
        if (!orderChannel) return;

        const orderMessage = await orderChannel.messages.fetch(orderData.orderMessageId as string);
        if (!orderMessage) return;

        const orderEmbedData = orderMessage.embeds[0];
        orderEmbedData.fields[5] = { name: "Status:", value: "`Delivered`", inline: false };
        orderMessage.edit({ embeds: [EmbedBuilder.from(orderEmbedData)] });
    }
}