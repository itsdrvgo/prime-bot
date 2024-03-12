import { ApplicationCommandOptionType, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { SlashCommand, CustomClient, editReply, reply, paginate } from "../../structure/index.js";
import Voucher, { VoucherData } from "../../schemas/Voucher.js";
import ms from "ms";
import { couponValue } from "../../coupon.js";
import crypto from "crypto";

export default new SlashCommand({
    name: "voucher",
    description: "Generate, delete or check vouchers",
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    botOwnerOnly: true,
    options: [
        {
            name: "generate",
            description: "Generate a new voucher code",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "type",
                    description: "Choose the discount type",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: [
                        { name: "5% OFF", value: "1" },
                        { name: "10% OFF", value: "2" },
                        { name: "20% OFF", value: "3" },
                        { name: "30% OFF", value: "4" },
                        { name: "40% OFF", value: "5" }
                    ]
                },
                {
                    name: "max-use",
                    description: "Set the max usage",
                    type: ApplicationCommandOptionType.Integer,
                    required: true
                },
                {
                    name: "code",
                    description: "Provide a custom code",
                    type: ApplicationCommandOptionType.String,
                    required: false
                },
                {
                    name: "expiry",
                    description: "Enter the expiry time",
                    type: ApplicationCommandOptionType.String,
                    required: false
                }
            ]
        },
        {
            name: "list",
            description: "Displays all active voucher codes",
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: "delete",
            description: "Deletes a voucher code",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "code",
                    description: "Provide the code",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        }
    ],
    async execute(interaction: ChatInputCommandInteraction, client: CustomClient) {

        switch (interaction.options.getSubcommand()) {
            case "generate": {
                await interaction.deferReply({ ephemeral: true });

                const typeQuery = interaction.options.getString("type", true);
                const maxUse = interaction.options.getInteger("max-use", true);
                const codeQuery = interaction.options.getString("code");
                const expiryQuery = interaction.options.getString("expiry");
                const type = parseInt(typeQuery);

                let code: string;
                if (!codeQuery) code = getVoucherCode();
                else code = codeQuery;

                let expiry: number;
                if (!expiryQuery) expiry = 0;
                else expiry = Date.now() + ms(expiryQuery);

                const data = new Voucher({ code, expiry, type, maxUse });
                await data.save();

                let expiryDate: string;
                if (expiry === 0) expiryDate = "`Never`";
                else expiryDate = `<t:${Math.round(expiry / 1000)}:R>`;

                const couponType = couponValue.find((coupon) => coupon.type === typeQuery);

                const embed = new EmbedBuilder()
                    .setColor(client.data.color)
                    .setTitle("`🎟` | Voucher Created")
                    .addFields(
                        { name: "Code:", value: "`" + code + "`" },
                        { name: "Expiry:", value: expiryDate, inline: true },
                        { name: "Type:", value: "`" + couponType?.name + "`" },
                        { name: "Max Uses:", value: "`" + maxUse + "`" }
                    )
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setTimestamp();

                interaction.editReply({ embeds: [embed] });
            }
                break;

            case "delete": {
                await interaction.deferReply({ ephemeral: true });

                const code = interaction.options.getString("code", true);
                const data = await Voucher.findOne({ code }).catch(() => { });
                if (!data) return editReply(interaction, "❌", "Invalid code!");

                await data.deleteOne();
                editReply(interaction, "✅", `Deleted voucher : \`${code}\``);
            }
                break;

            case "list": {
                const data = await Voucher.find().catch(() => { });
                if (data?.length === 0) return reply(interaction, "❌", "No codes to show!");

                const pages = pageBuilder(data as VoucherData[], 5, client);
                paginate(interaction, pages);
            }
                break;
        }
    }
});

function getVoucherCode(): string {
    const codeLength = 16;
    const groupLength = 4;
    const numGroups = codeLength / groupLength;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";

    while (code.length < codeLength) {
        const bytes = crypto.getRandomValues(new Uint8Array(numGroups));
        let group = "";

        for (let i = 0; i < numGroups; i++) {
            const index = bytes[i] % chars.length;
            group += chars[index];
        }

        if (code.length > 0) {
            code += "-";
        }

        code += group;
    }

    return code;
}

function pageBuilder(data: VoucherData[], numberOfItems: number, client: CustomClient) {
    const embeds: EmbedBuilder[] = [];
    let k = numberOfItems;

    for (let i = 0; i < data.length; i += numberOfItems) {
        const current = data.slice(i, k);
        k += numberOfItems;

        const mapped = current.map((coupon) => {
            let expiryDate: string;
            if (coupon.expiry === 0) expiryDate = "`Never`";
            else expiryDate = `<t:${Math.round(coupon.expiry / 1000)}:R>`;

            const couponType = couponValue.find((c) => c.type === coupon.type.toString());

            return [
                `**Code :** \`${coupon.code}\``,
                `**Expiry :** ${expiryDate}`,
                `**Type :** \`${couponType?.name}\``,
                `**Max Uses :** \`${coupon.maxUse}\``,
                `**Current Uses :** \`${coupon.uses}\``
            ].join("\n");
        }).join("\n\n");

        const embed = new EmbedBuilder()
            .setColor(client.data.color)
            .setThumbnail(client.user?.displayAvatarURL() as string)
            .setTitle("`🎟` | Vouchers")
            .setDescription(mapped)
            .setTimestamp();
        embeds.push(embed);
    }
    return embeds;
}