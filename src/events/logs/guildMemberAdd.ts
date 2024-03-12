import { Events, EmbedBuilder, BaseGuildTextChannel, GuildMember } from "discord.js";
import { Event, CustomClient } from "../../structure/index.js";

export default new Event({
    event: Events.GuildMemberAdd,
    async execute(member: GuildMember, client: CustomClient) {
        if (!member) return;
        if (member.guild.id !== client.data.guilds.primary) return;
        if (member.user.bot) return;

        const joinRoleIds = ["1024309442113708068", "1024309442113708067", "1024309442017247251", "1024309442017247244", "1024309441853653068", "1024309441778159695"];
        await member.roles.add(joinRoleIds);

        if (member.displayName.match(/[^\x20-\x7E]/g)) {
            const guildMembers = await member.guild.members.fetch();
            const oldUsers = guildMembers.filter((mem) => mem.displayName.startsWith("User"));

            let number;

            if (oldUsers.size !== 0) {
                const countingArray: number[] = [];

                oldUsers.forEach((x) => {
                    const index = parseInt(x.displayName.split(" ")[1]);
                    if (isNaN(index)) return;
                    countingArray.push(index);
                });

                const max = Math.max(...countingArray);
                number = max + 1;
                await member.setNickname(`User ${number}`).catch(() => { return; });
            } else {
                number = 1;
                await member.setNickname(`User ${number}`).catch(() => { return; });
            }
        }

        member.guild.channels.fetch("1024309443699146756").then(async (c) => {
            const channel = c as BaseGuildTextChannel;
            const embed = new EmbedBuilder()
                .setColor(client.data.color)
                .setTitle(`\`🏝\` | Welcome ${member.user.username}`)
                .setDescription(
                    `Hey ${member}, welcome to **${member.guild.name}**. Make sure you read the rules from <#1024309443699146753>. Get your desired roles from <#1024309443699146757>. Get the ping roles to stay updated. Have a great day! :)`
                    + "\n\n" +
                    `Account Created: <t:${Math.round(member.user.createdTimestamp / 1000)}:R>`
                    + "\n" +
                    `Member Count: \`${member.guild.memberCount}\``
                )
                .setThumbnail(member.displayAvatarURL())
                .setFooter({ text: `ID: ${member.user.id}` })
                .setTimestamp();
            channel.send({ content: `${member}`, embeds: [embed] });
        }).catch(() => {
            return;
        });
    }
});