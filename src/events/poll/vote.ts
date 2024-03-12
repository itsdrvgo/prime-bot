import { ButtonInteraction, EmbedBuilder, Events } from "discord.js";
import { Event, CustomClient, editReply } from "../../structure/index.js";
import DB, { PollData } from "../../schemas/Poll.js";
import { getPercentage, getProgressBar, getSum } from "../../structure/functions/endPoll.js";

export default new Event({
    event: Events.InteractionCreate,
    async execute(interaction: ButtonInteraction, client: CustomClient) {
        if (!interaction.isButton()) return;
        if (!interaction.guild) return;
        if (!interaction.customId.startsWith("poll-")) return;
        await interaction.deferReply({ ephemeral: true });

        const oldEmbed = interaction.message.embeds[0];
        if (!oldEmbed) return;

        const data = await DB.findOne<PollData>({ messageId: interaction.message.id }).catch(() => { });
        if (!data) return editReply(interaction, "❌", "No data was found related to this poll!");
        if (data.voters.includes(interaction.user.id)) return editReply(interaction, "❌", "You already have voted once!");

        data.voters.push(interaction.user.id);
        await data.save();

        const embed = new EmbedBuilder()
            .setColor(client.data.color)
            .setTitle("`📊` | Votes")
            .setThumbnail(interaction.guild.iconURL())
            .setTimestamp();

        switch (data.type) {
            case "1": {
                switch (interaction.customId) {
                    case "poll-yes": {
                        data.votes.pollYes++;
                        data.markModified("votes");
                        data.users.pollYes.push(interaction.user.tag);
                        data.markModified("users");

                        await data.save();
                    }
                        break;

                    case "poll-no": {
                        data.votes.pollNo++;
                        data.markModified("votes");
                        data.users.pollNo.push(interaction.user.tag);
                        data.markModified("users");

                        await data.save();
                    }
                        break;

                    case "poll-nod": {
                        data.votes.pollNod++;
                        data.markModified("votes");
                        data.users.pollNod.push(interaction.user.tag);
                        data.markModified("users");

                        await data.save();
                    }
                        break;
                }

                embed.setDescription(
                    "Current voting stats,"
                    + "\n\n" +
                    `\`✅\` | ${getProgressBar(getPercentage(data.votes.pollYes, getSum(data.votes)))} | \`${Math.round(getPercentage(data.votes.pollYes, getSum(data.votes)))}%\``
                    + "\n" +
                    `\`❌\` | ${getProgressBar(getPercentage(data.votes.pollNo, getSum(data.votes)))} | \`${Math.round(getPercentage(data.votes.pollNo, getSum(data.votes)))}%\``
                    + "\n" +
                    `\`🤷‍♂️\` | ${getProgressBar(getPercentage(data.votes.pollNod, getSum(data.votes)))} | \`${Math.round(getPercentage(data.votes.pollNod, getSum(data.votes)))}%\``
                    + "\n\n" +
                    `_Total Votes: ${getSum(data.votes)}_`
                );
                interaction.editReply({ embeds: [embed] });
            }
                break;

            case "2": {
                const pollOptions = data.options;
                const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];
                let options = "";

                for (let i = 0; i < pollOptions.length; i++) {
                    const current = pollOptions[i];

                    if (interaction.customId === current) {
                        data.votes[current]++;
                        data.markModified("votes");
                        data.users[current].push(interaction.user.tag);
                        data.markModified("users");

                        await data.save();
                    }
                }

                for (let i = 0; i < pollOptions.length; i++) {
                    const current = pollOptions[i];
                    options += `\n\`${emojis[i]}\` | ${getProgressBar(getPercentage(data.votes[current], getSum(data.votes)))} | \`${Math.round(getPercentage(data.votes[current], getSum(data.votes)))}%\``;
                }

                embed.setDescription(
                    "Current voting stats,"
                    + "\n" +
                    options
                    + "\n\n" +
                    `_Total Votes: ${getSum(data.votes)}_`
                );
                interaction.editReply({ embeds: [embed] });
            }
                break;

            case "3": {
                const pollOptions = data.options;
                const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];
                let options = "";
                let answer;

                for (let i = 0; i < pollOptions.length; i++) {
                    const current = pollOptions[i];

                    if (interaction.customId === current) {
                        data.votes[current]++;
                        data.markModified("votes");
                        data.users[current].push(interaction.user.tag);
                        data.markModified("users");

                        await data.save();
                    }
                }

                for (let i = 0; i < pollOptions.length; i++) {
                    const current = pollOptions[i];
                    const answerPosition = pollOptions[data.answer];

                    options += `\n\`${emojis[i]}\` | ${getProgressBar(getPercentage(data.votes[current], getSum(data.votes)))} | \`${Math.round(getPercentage(data.votes[current], getSum(data.votes)))}%\``;

                    if (answerPosition === current) answer = emojis[i];
                }

                embed.setDescription(
                    `Correct option: \`${answer}\``
                    + "\n" +
                    options
                    + "\n\n" +
                    `_Total Votes: ${getSum(data.votes)}_`
                );
                interaction.editReply({ embeds: [embed] });
            }
                break;
        }
    }
});