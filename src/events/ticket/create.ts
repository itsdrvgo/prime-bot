import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, CategoryChannelResolvable, ChannelType, ClientUser, EmbedBuilder, Events, ModalBuilder, PermissionFlagsBits, Role, TextInputBuilder, TextInputStyle } from "discord.js";
import { Event, CustomClient, editReply, reply } from "../../structure/index.js";
import DB, { TicketData } from "../../schemas/Ticket.js";
import ms from "ms";

export default new Event({
    event: Events.InteractionCreate,
    async execute(interaction: ButtonInteraction, client: CustomClient) {
        if (!interaction.isButton()) return;
        if (!interaction.guild) return;
        if (interaction.customId !== "tkt_create") return;

        const data = await DB.findOne<TicketData>({ guildId: interaction.guild.id, type: interaction.user.id }).catch(() => { });
        if (data) return reply(interaction, "❌", "You already have an ticket open, you can't create any more!");

        const embed = interaction.message.embeds[0];
        if (!embed) return reply(interaction, "❌", "This button can't be used anymore!");

        const modal = new ModalBuilder()
            .setTitle("Ticket")
            .setCustomId("tkt_create_modal");

        const reasonInput = new TextInputBuilder()
            .setCustomId("reasonInput")
            .setLabel("Reason")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Enter your issue here")
            .setRequired(true);

        const row = new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput);
        modal.addComponents(row);
        await interaction.showModal(modal);

        try {
            const modalSubmit = await interaction.awaitModalSubmit({ filter: (i) => i.customId === "tkt_create_modal", time: ms("10m") });
            await modalSubmit.deferReply({ ephemeral: true });

            const reason = modalSubmit.fields.getTextInputValue("reasonInput");
            const ticketId = Math.floor(Math.random() * 90000) + 10000;
            const ticketCategory = await interaction.guild?.channels.fetch("1024309444466704421") as CategoryChannelResolvable;
            const handlerRole = await interaction.guild?.roles.fetch("1024309442226954371") as Role;

            const ticketChannel = await interaction.guild.channels.create({
                name: `${interaction.user.tag + "-" + ticketId}`,
                type: ChannelType.GuildText,
                parent: ticketCategory,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: handlerRole.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AddReactions]
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AddReactions]
                    },
                    {
                        id: (client.user as ClientUser).id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AddReactions]
                    },
                ]
            });

            await DB.create({
                guildId: interaction.guild.id,
                memberIds: [interaction.user.id],
                ticketId,
                channelId: ticketChannel.id,
                closed: false,
                locked: false,
                type: interaction.user.id,
                openTime: Math.round(ticketChannel.createdTimestamp / 1000)
            });

            const embed = new EmbedBuilder()
                .setColor(client.data.color)
                .setAuthor({ name: `${interaction.guild.name} | Ticket: ${ticketId}`, iconURL: interaction.guild.iconURL() as string })
                .setDescription(reason)
                .setTimestamp();

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId("tkt_close")
                    .setLabel("Close")
                    .setStyle(ButtonStyle.Danger),

                new ButtonBuilder()
                    .setCustomId("tkt_lock")
                    .setLabel("Lock")
                    .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                    .setCustomId("tkt_unlock")
                    .setLabel("Unlock")
                    .setStyle(ButtonStyle.Success)
            );

            ticketChannel.send({ content: `${handlerRole}`, embeds: [embed], components: [row] });
            ticketChannel.send({ content: `${interaction.user}, here is your ticket!` }).then((message) => {
                setTimeout(() => {
                    message.delete().catch(() => { });
                }, ms("5s"));
            });

            editReply(modalSubmit, "✅", `${interaction.user}, your ticket has been created in ${ticketChannel}`);
        } catch (err) {
            return;
        }
    }
});