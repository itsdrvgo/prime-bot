import { BaseGuildTextChannel, EmbedBuilder, Events, GuildMember, Message } from "discord.js";
import { Event, CustomClient } from "../../structure/index.js";
import DB from "../../schemas/Level.js";

export default new Event({
    event: Events.MessageCreate,
    async execute(message: Message, client: CustomClient) {
        if (!message.guild) return;
        if (message.author.bot) return;
        if (message.guild.id !== "1024309441723650109") return;

        let data = await DB.findOne({ guildId: message.guild.id, userId: message.author.id }).catch(() => { });
        if (!data) {
            data = new DB({
                guildId: message.guild.id,
                userId: message.author.id,
                xp: 0,
                level: 0
            });
            await data.save();
            return;
        }

        const giveXp = Math.floor(Math.random() * 29) + 1;
        const requiredXp = data.level * data.level * 100 + 100;

        if (data.xp + giveXp >= requiredXp) {
            data.xp += giveXp;
            data.level += 1;
            await data.save();

            const channel = await message.guild.channels.fetch("1024309444248608893") as BaseGuildTextChannel;
            if (!channel) return;

            channel.send({
                content: `${message.author}`,
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.data.color)
                        .setDescription(`\`🆙\` | Congratulations! You have now reached **Level ${data.level}** 🥳`)
                ]
            });
        } else {
            data.xp += giveXp;
            await data.save();
        }

        const rewards = [
            {
                level: 1,
                role: "1024309442113708062"
            },
            {
                level: 10,
                role: "1024309442113708063"
            },
            {
                level: 25,
                role: "1024309442113708064"
            },
            {
                level: 40,
                role: "1024309442113708065"
            },
            {
                level: 60,
                role: "1024309442113708066"
            }
        ];

        const rewardData = rewards.find((x) => x.level === data?.level);

        if (rewardData) {
            const levelRole = await message.guild.roles.fetch(rewardData.role);
            if (!levelRole) return;

            const member = message.member as GuildMember;

            if (member.roles.cache.find((r) => r.id === levelRole.id)) return;

            await member.roles.add(levelRole);

            data.role = levelRole.id;
            await data.save();
        }
    }
});