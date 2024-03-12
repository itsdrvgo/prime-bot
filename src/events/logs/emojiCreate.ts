import { Events, EmbedBuilder, BaseGuildTextChannel, GuildEmoji } from "discord.js";
import { Event, CustomClient } from "../../structure/index.js";

export default new Event({
    event: Events.GuildEmojiCreate,
    async execute(emoji: GuildEmoji, client: CustomClient) {
        if (emoji.guild.id !== client.data.guilds.primary) return;
        const logsChannel = await emoji.guild.channels.fetch("1024309444932288570") as BaseGuildTextChannel;
        if (!logsChannel) return;

        logsChannel.send({
            embeds: [
                new EmbedBuilder()
                    .setColor(client.data.color)
                    .setTitle("`🔩` | Emoji Create")
                    .addFields(
                        { name: "Name:", value: `${emoji.name} (${emoji})` },
                        { name: "ID:", value: emoji.id }
                    )
                    .setThumbnail(emoji.guild.iconURL())
                    .setTimestamp()
            ]
        });
    }
});