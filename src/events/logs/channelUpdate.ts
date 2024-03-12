import { Events, EmbedBuilder, BaseGuildTextChannel } from "discord.js";
import { Event, CustomClient } from "../../structure/index.js";

export default new Event({
    event: Events.ChannelUpdate,
    async execute(oldChannel: BaseGuildTextChannel, newChannel: BaseGuildTextChannel, client: CustomClient) {
        if (newChannel.guild.id !== client.data.guilds.primary) return;
        const logsChannel = await newChannel.guild.channels.fetch("1024309444932288570") as BaseGuildTextChannel;
        if (!logsChannel) return;

        if (oldChannel.topic !== newChannel.topic) {
            logsChannel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.data.color)
                        .setTitle("`🔩` | Channel Update")
                        .addFields(
                            { name: "Name:", value: `${newChannel.name} (${newChannel})` },
                            { name: "ID:", value: newChannel.id },
                            { name: "Changes:", value: "```" + oldChannel.topic + " ⭢ " + newChannel.topic + "```" }
                        )
                        .setThumbnail(newChannel.guild.iconURL())
                        .setTimestamp()
                ]
            });
        }
    }
});