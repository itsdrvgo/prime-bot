import { APIActionRowComponent, APIButtonComponent, ActionRowBuilder, BaseGuildTextChannel, ButtonBuilder, EmbedBuilder, Message } from "discord.js";
import { CustomClient } from "../../structure/index.js";
import Giveaway, { GiveawayData } from "../../schemas/Giveaway.js";

export async function endGiveaway(message: Message, client: CustomClient, type = false) {
    if (!message) return;
    if (!message.guild) return;
    if (!(await client.guilds.fetch(message.guild.id))) return;

    const data = await Giveaway.findOne<GiveawayData>({ guildId: message.guild.id, messageId: message.id }).catch(() => { });
    if (!data) return;

    message.guild.channels.fetch(data.channelId).then(async (c) => {
        const channel = c as BaseGuildTextChannel;
        channel.messages.fetch(data.messageId).then(async () => {
            if (data.ended === true && !type) return;
            if (data.paused === true) return;

            const winnerIdArray: string[] = [];
            if (data.joined.length > data.winnerCount) {
                winnerIdArray.push(...getMultipleRandom(data.joined, data.winnerCount));

                while (winnerIdArray.length < data.winnerCount) winnerIdArray.push(...getMultipleRandom(data.joined, data.winnerCount - winnerIdArray.length));
            } else winnerIdArray.push(...data.joined);

            const messageComponent = message.components[0] as APIActionRowComponent<APIButtonComponent>;
            const messageButtonComponent = messageComponent.components[0] as APIButtonComponent;
            const disableButton = ActionRowBuilder.from<ButtonBuilder>(messageComponent).setComponents(ButtonBuilder.from(messageButtonComponent).setDisabled(true));

            const embed = EmbedBuilder.from(message.embeds[0])
                .setDescription(`${data.description}\n\n**Hosted By:** <@${data.hostId}>\n**Winner(s):** ${winnerIdArray.map((user) => `<@${user}>`).join(", ") || "None"}\n**Ended:** <t:${data.endTimestamp}:R> (<t:${data.endTimestamp}>)`)
                .setFields([
                    { name: "Entries:", value: data.joined.length.toString() }
                ]);

            await Giveaway.findOneAndUpdate({
                guildId: data.guildId,
                channelId: data.channelId,
                messageId: message.id
            }, { ended: true });

            await message.edit({ content: "🎊 **Giveaway Ended** 🎊", embeds: [embed], components: [disableButton] });
            return message.reply({
                content: winnerIdArray.length
                    ? `Congratulations ${winnerIdArray.map((user) => `<@${user}>`).join(", ")}! You won **${data.prize}**`
                    : "No winner was decided because no one entered the giveaway!",

                embeds: [
                    new EmbedBuilder()
                        .setColor(client.data.color)
                        .setDescription(`[Giveaway Link](https://discord.com/channels/${data.guildId}/${data.channelId}/${data.messageId})`)
                ]
            });
        }).catch(() => { return; });
    }).catch(() => { return; });
}

function getMultipleRandom(arr: string[], num: number) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return [...new Set(shuffled.slice(0, num))];
}