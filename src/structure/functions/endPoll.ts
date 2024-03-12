import { BaseGuildTextChannel, EmbedBuilder } from "discord.js";
import { CustomClient } from "../../structure/index.js";
import { PollData, VotesObject } from "../../schemas/Poll.js";

export async function endPoll(data: PollData, client: CustomClient) {
    client.channels.fetch(data.channelId).then((c) => {
        const channel = c as BaseGuildTextChannel;

        channel.messages.fetch(data.messageId).then(async (message) => {
            const embedData = message.embeds[0];
            if (!embedData) return await data.deleteOne();
            const embed = EmbedBuilder.from(embedData);

            switch (data.type) {
                case "1": {
                    embed.setDescription(
                        embedData.description
                        + "\n\n" +
                        "The poll has ended,"
                        + "\n\n" +
                        `\`✅\` | ${getProgressBar(getPercentage(data.votes.pollYes, getSum(data.votes)))} | \`${Math.round(getPercentage(data.votes.pollYes, getSum(data.votes)))}%\``
                        + "\n" +
                        `\`❌\` | ${getProgressBar(getPercentage(data.votes.pollNo, getSum(data.votes)))} | \`${Math.round(getPercentage(data.votes.pollNo, getSum(data.votes)))}%\``
                        + "\n" +
                        `\`🤷‍♂️\` | ${getProgressBar(getPercentage(data.votes.pollNod, getSum(data.votes)))} | \`${Math.round(getPercentage(data.votes.pollNod, getSum(data.votes)))}%\``
                        + "\n\n" +
                        `_Total Votes: ${getSum(data.votes)}_`
                    );

                    message.edit({ embeds: [embed], components: [] });
                    await data.deleteOne();
                }
                    break;

                case "2": {
                    const pollOptions = data.options;
                    const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];
                    let options = "";

                    for (let i = 0; i < pollOptions.length; i++) {
                        const current = pollOptions[i];
                        options += `\n\`${emojis[i]}\` | ${getProgressBar(getPercentage(data.votes[current], getSum(data.votes)))} | \`${Math.round(getPercentage(data.votes[current], getSum(data.votes)))}%\``;
                    }

                    embed.setDescription(
                        embedData.description
                        + "\n\n" +
                        "The poll has ended,"
                        + "\n" +
                        options
                        + "\n\n" +
                        `_Total Votes: ${getSum(data.votes)}_`
                    );
                    message.edit({ embeds: [embed], components: [] });
                    await data.deleteOne();
                }
                    break;

                case "3": {
                    const pollOptions = data.options;
                    const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];
                    let options = "";
                    let answer;

                    for (let i = 0; i < pollOptions.length; i++) {
                        const current = pollOptions[i];
                        const answerPosition = pollOptions[data.answer];

                        options += `\n\`${emojis[i]}\` | ${getProgressBar(getPercentage(data.votes[current], getSum(data.votes)))} | \`${Math.round(getPercentage(data.votes[current], getSum(data.votes)))}%\``;

                        if (answerPosition === current) answer = emojis[i];
                    }

                    embed.setDescription(
                        embedData.description
                        + "\n\n" +
                        `The poll has ended, & the correct option is \`${answer}\``
                        + "\n" +
                        options
                        + "\n\n" +
                        `_Total Votes: ${getSum(data.votes)}_`
                    );
                    message.edit({ embeds: [embed], components: [] });
                    await data.deleteOne();
                }
                    break;
            }
        }).catch(async () => {
            await data.deleteOne();
            return;
        });
    }).catch(async (err) => {
        await data.deleteOne();
        throw err;
    });
}

export function getProgressBar(percent: number) {
    if (isNaN(percent)) percent = 0;
    const thick = Math.floor(percent / 10);
    const thin = Math.ceil((100 - percent) / 10) * 2 / 2;
    let str = "";

    for (let i = 0; i < thick; i++) str += "▰";
    for (let i = 0; i < thin; i++) str += "▱";
    str += "";

    return str;
}

export function getSum(object: VotesObject) {
    let sum = 0;
    for (const key in object) {
        sum += object[key];
    }
    return sum;
}

export function getPercentage(number: number, total: number) {
    let percent = (number / total) * 100;
    if (isNaN(percent)) percent = 0;
    return percent;
}