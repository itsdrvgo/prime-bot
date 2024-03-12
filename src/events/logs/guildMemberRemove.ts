import { Events, EmbedBuilder, BaseGuildTextChannel, GuildMember } from "discord.js";
import { Event, CustomClient } from "../../structure/index.js";

export default new Event({
    event: Events.GuildMemberRemove,
    async execute(member: GuildMember, client: CustomClient) {
        if (!member) return;
        if (member.guild.id !== client.data.guilds.primary) return;
        const logsChannel = await member.guild.channels.fetch("1024309444932288570") as BaseGuildTextChannel;
        if (!logsChannel) return;

        const embed = new EmbedBuilder()
            .setColor(client.data.color)
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp();

        logsChannel.send({
            embeds: [
                embed
                    .setTitle("`🔩` | Member Left")
                    .addFields(
                        { name: "Name:", value: `${member.user.tag} (${member})` },
                        { name: "ID:", value: member.user.id },
                        { name: "Account Created:", value: `<t:${Math.round(member.user.createdTimestamp / 1000)}:R>` },
                        { name: "Member Count:", value: `${member.guild.memberCount}` }
                    )
            ]
        });
    }
});