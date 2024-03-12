import { Events, EmbedBuilder, BaseGuildTextChannel, GuildBan } from "discord.js";
import { Event, CustomClient } from "../../structure/index.js";

export default new Event({
    event: Events.GuildBanAdd,
    async execute(ban: GuildBan, client: CustomClient) {
        if (ban.guild.id !== client.data.guilds.primary) return;
        const logsChannel = await ban.guild.channels.fetch("1024309444932288570") as BaseGuildTextChannel;
        if (!logsChannel) return;

        logsChannel.send({
            embeds: [
                new EmbedBuilder()
                    .setColor(client.data.color)
                    .setTitle("`🔩` | Member Ban")
                    .addFields(
                        { name: "Name:", value: `${ban.user.tag} (${ban.user})` },
                        { name: "ID:", value: ban.user.id },
                        { name: "Reason:", value: `${ban.reason ? ban.reason : "no reason provided"}` }
                    )
                    .setThumbnail(ban.guild.iconURL())
                    .setTimestamp()
            ]
        });
    }
});