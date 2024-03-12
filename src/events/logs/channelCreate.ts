import { Events, GuildBasedChannel, EmbedBuilder, BaseGuildTextChannel } from "discord.js";
import { Event, CustomClient } from "../../structure/index.js";

export default new Event({
    event: Events.ChannelCreate,
    async execute(channel: GuildBasedChannel, client: CustomClient) {
        if (channel.guild.id !== client.data.guilds.primary) return;
        const logsChannel = await channel.guild.channels.fetch("1024309444932288570") as BaseGuildTextChannel;
        if (!logsChannel) return;

        logsChannel.send({
            embeds: [
                new EmbedBuilder()
                    .setColor(client.data.color)
                    .setTitle("`🔩` | Channel Create")
                    .addFields(
                        { name: "Name:", value: `${channel.name} (${channel})` },
                        { name: "ID:", value: channel.id }
                    )
                    .setThumbnail(channel.guild.iconURL())
                    .setTimestamp()
            ]
        });
    }
});