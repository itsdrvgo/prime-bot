import { Events, EmbedBuilder, BaseGuildTextChannel, Role } from "discord.js";
import { Event, CustomClient } from "../../structure/index.js";

export default new Event({
    event: Events.GuildRoleCreate,
    async execute(role: Role, client: CustomClient) {
        if (role.guild.id !== client.data.guilds.primary) return;
        const logsChannel = await role.guild.channels.fetch("1024309444932288570") as BaseGuildTextChannel;
        if (!logsChannel) return;
        logsChannel.send({
            embeds: [
                new EmbedBuilder()
                    .setColor(client.data.color)
                    .setTitle("`🔩` | Role Create")
                    .addFields(
                        { name: "Name:", value: `${role.name} (${role})` },
                        { name: "ID:", value: role.id }
                    )
                    .setThumbnail(role.guild.iconURL())
                    .setTimestamp()
            ]
        });
    }
});