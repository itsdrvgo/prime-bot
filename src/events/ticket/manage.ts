import { createTranscript, ExportReturnType } from "discord-html-transcripts";
import { BaseGuildTextChannel, ButtonInteraction, EmbedBuilder, Events, GuildMember, TextBasedChannel } from "discord.js";
import { Event, CustomClient, editReply, reply } from "../../structure/index.js";
import DB, { TicketData } from "../../schemas/Ticket.js";
import ms from "ms";

export default new Event({
    event: Events.InteractionCreate,
    async execute(interaction: ButtonInteraction, client: CustomClient) {
        if (!interaction.isButton()) return;
        if (!interaction.guild) return;
        if (!["tkt_close", "tkt_lock", "tkt_unlock"].includes(interaction.customId)) return;

        const data = await DB.findOne<TicketData>({ guildId: interaction.guild.id, type: interaction.user.id }).catch(() => { });
        if (!data) return reply(interaction, "❌", "The data for the ticket is outdated!");

        const embed = interaction.message.embeds[0];
        if (!embed) return reply(interaction, "❌", "This button can't be used anymore!");

        const handlerRole = await interaction.guild?.roles.fetch("1024309442226954371");
        if (!handlerRole) return reply(interaction, "❌", "An error occured while managing the ticket, seems like a role or channel is missing!");
        if (!(interaction.member as GuildMember).roles.cache.find((r) => r.id === handlerRole.id)) return reply(interaction, "❌", "You're not allowed to use these buttons!");

        switch (interaction.customId) {
            case "tkt_lock": {
                if (data.locked === true) return reply(interaction, "❌", "The ticket is already locked!");

                await interaction.deferReply();
                await DB.updateOne({ channelId: interaction.channel?.id }, { locked: true });

                data.memberIds.forEach((m) => {
                    (interaction.channel as BaseGuildTextChannel)?.permissionOverwrites.edit(m, {
                        "SendMessages": false
                    });
                });

                editReply(interaction, "🔒", "The ticket has been locked for reviewing");
            }
                break;

            case "tkt_unlock": {
                if (data.locked === false) return reply(interaction, "❌", "The ticket is already unlocked!");

                await interaction.deferReply();
                await DB.updateOne({ channelId: interaction.channel?.id }, { locked: false });

                data.memberIds.forEach((m) => {
                    (interaction.channel as BaseGuildTextChannel)?.permissionOverwrites.edit(m, {
                        "SendMessages": true
                    });
                });

                editReply(interaction, "🔓", "The ticket has been unlocked");
            }
                break;

            case "tkt_close": {
                if (data.closed === true) return reply(interaction, "❌", "The ticket is already closed, please wait for it to get deleted!");

                await interaction.deferReply();

                const attachment = await createTranscript(interaction.channel as TextBasedChannel, {
                    limit: -1,
                    returnType: ExportReturnType.Attachment,
                    filename: `${data.type} | ${data.ticketId}.html`
                });

                await DB.updateOne({ channelId: interaction.channel?.id }, { closed: true });
                const transcriptsChannel = await interaction.guild?.channels.fetch("1024309444932288569") as BaseGuildTextChannel | null;
                if (!transcriptsChannel) return editReply(interaction, "❌", "Couldn't find the transcript channel!");

                const message = await transcriptsChannel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.data.color)
                            .setTitle("`🎫` | Transcript")
                            .addFields([
                                { name: "Ticket ID", value: `${data.ticketId}`, inline: true },
                                { name: "Type", value: `${data.type}`, inline: true },
                                { name: "Opened By", value: `<@!${data.memberIds[0]}>`, inline: true },
                                { name: "Open Time", value: `<t:${data.openTime}:R>`, inline: true },
                                { name: "Close Time", value: `<t:${Math.round(Date.now() / 1000)}:R>`, inline: true }
                            ])
                            .setTimestamp()
                    ],
                    files: [attachment]
                });
                editReply(interaction, "✅", `The transcript is now saved as [TRANSCRIPT](${message.url})`);

                setTimeout(async () => {
                    await interaction.channel?.delete();
                    await data.deleteOne();
                }, ms("10s"));
            }
                break;
        }

    }
});