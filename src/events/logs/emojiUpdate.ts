import { Events, EmbedBuilder, BaseGuildTextChannel, GuildEmoji } from "discord.js";
import { Event, CustomClient } from "../../structure/index.js";

export default new Event({
    event: Events.GuildEmojiUpdate,
    async execute(oldEmoji: GuildEmoji, newEmoji: GuildEmoji, client: CustomClient) {
        if (newEmoji.guild.id !== client.data.guilds.primary) return;
        const logsChannel = await newEmoji.guild.channels.fetch("1024309444932288570") as BaseGuildTextChannel;
        if (!logsChannel) return;

        logsChannel.send({
            embeds: [
                new EmbedBuilder()
                    .setColor(client.data.color)
                    .setTitle("`🔩` | Emoji Update")
                    .addFields(
                        { name: "Name:", value: `${newEmoji.name} (${newEmoji})` },
                        { name: "ID:", value: newEmoji.id },
                        { name: "Changes:", value: "```" + oldEmoji.name + " ⭢ " + newEmoji.name + "```" }
                    )
                    .setThumbnail(newEmoji.guild.iconURL())
                    .setTimestamp()
            ]
        });
    }
});