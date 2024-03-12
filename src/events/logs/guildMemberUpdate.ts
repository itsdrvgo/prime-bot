import { Events, EmbedBuilder, BaseGuildTextChannel, GuildMember } from "discord.js";
import { Event, CustomClient } from "../../structure/index.js";

export default new Event({
    event: Events.GuildMemberUpdate,
    async execute(oldMember: GuildMember, newMember: GuildMember, client: CustomClient) {
        if (newMember.guild.id !== client.data.guilds.primary) return;
        const logsChannel = await newMember.guild.channels.fetch("1024309444932288570") as BaseGuildTextChannel;
        if (!logsChannel) return;

        const embed = new EmbedBuilder()
            .setColor(client.data.color)
            .setTitle("`🔩` | Member Update")
            .setThumbnail(newMember.user.displayAvatarURL())
            .setTimestamp();

        const oldRoles = oldMember.roles.cache.map((r) => r.id);
        const newRoles = newMember.roles.cache.map((r) => r.id);

        if (oldRoles.length > newRoles.length) {
            const uniqueRoles = getUniqueArray(oldRoles, newRoles);

            uniqueRoles.forEach((roleId) => {
                logsChannel.send({
                    embeds: [
                        embed.setDescription(`**${newMember.user.tag}** has lost the role, <@&${roleId}>`)
                    ]
                });
            });
        } else if (oldRoles.length < newRoles.length) {
            const uniqueRoles = getUniqueArray(newRoles, oldRoles);

            uniqueRoles.forEach((roleId) => {
                logsChannel.send({
                    embeds: [
                        embed.setDescription(`**${newMember.user.tag}** has got the role, <@&${roleId}>`)
                    ]
                });
            });
        } else if (oldMember.nickname !== newMember.nickname) {

            logsChannel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.data.color)
                        .setTitle("`🔩` | Member Update")
                        .addFields(
                            { name: "Name:", value: `${newMember.user.tag} (${newMember})` },
                            { name: "ID:", value: newMember.id },
                            { name: "Changes:", value: "```" + oldMember.nickname + " ⭢ " + newMember.nickname + "```" }
                        )
                        .setThumbnail(newMember.user.displayAvatarURL())
                        .setTimestamp()
                ]
            });
        } else if (oldMember.premiumSince !== newMember.premiumSince) {
            if (!oldMember.premiumSince && newMember.premiumSince) {
                logsChannel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.data.color)
                            .setTitle("`🔩` | Server Boost")
                            .addFields(
                                { name: "Boosted by:", value: `${newMember.user.tag} (${newMember})` },
                                { name: "ID:", value: newMember.id }
                            )
                            .setThumbnail(newMember.user.displayAvatarURL())
                            .setTimestamp()
                    ]
                });

                newMember.guild.channels.fetch("1024309444248608893").then((c) => {
                    const boostChannel = c as BaseGuildTextChannel;
                    boostChannel.send({ content: `<a:booster:1026498772404019251> ${newMember}, thank you for boosting the server! Read about your booster perks in <#1024692674890055730>` });
                }).catch(() => { return; });
            } else if (!newMember.premiumSince && oldMember.premiumSince) {
                logsChannel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.data.color)
                            .setTitle("`🔩` | Server Unboost")
                            .addFields(
                                { name: "Unboosted by:", value: `${newMember.user.tag} (${newMember})` },
                                { name: "ID:", value: newMember.id }
                            )
                            .setThumbnail(newMember.user.displayAvatarURL())
                            .setTimestamp()
                    ]
                });
            }
        }
    }
});

function getUniqueArray(arrayOne: string[], arrayTwo: string[]) {
    const unique1 = arrayOne.filter((o) => arrayTwo.indexOf(o) === -1);
    const unique2 = arrayTwo.filter((o) => arrayOne.indexOf(o) === -1);

    const unique = unique1.concat(unique2);
    return unique;
}