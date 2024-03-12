import { ActionRowBuilder, ApplicationCommandOptionType, BaseGuildTextChannel, ButtonBuilder, ButtonStyle, ChannelType, ChatInputCommandInteraction, EmbedBuilder, Guild, PermissionFlagsBits } from "discord.js";
import { CustomClient, editReply, SlashCommand } from "../../structure/index.js";
import DB, { PollData } from "../../schemas/Poll.js";
import ms from "ms";
import { endPoll } from "../../structure/functions/endPoll.js";

export default new SlashCommand({
    name: "poll",
    description: "Starts or ends a poll",
    defaultMemberPermissions: PermissionFlagsBits.ManageMessages,
    options: [
        {
            name: "start",
            description: "Starts a poll",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "topic",
                    description: "Provide the topic",
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: "type",
                    description: "Select the type",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: [
                        { name: "Yes / No", value: "1" },
                        { name: "Normal", value: "2" },
                        { name: "QnA", value: "3" }
                    ]
                },
                {
                    name: "options",
                    description: "Provide the options, Opt1^Opt2^Opt3 (Max. 9 options)",
                    type: ApplicationCommandOptionType.String,
                    required: false
                },
                {
                    name: "answer",
                    description: "If the poll is a QnA, provide answer position from the options",
                    type: ApplicationCommandOptionType.Integer,
                    required: false
                },
                {
                    name: "channel",
                    description: "Select a channel",
                    type: ApplicationCommandOptionType.Channel,
                    required: false,
                    channelTypes: [ChannelType.GuildText]
                },
                {
                    name: "role",
                    description: "Select a role",
                    type: ApplicationCommandOptionType.Role,
                    required: false,
                },
                {
                    name: "attachment",
                    description: "Upload an attachment",
                    type: ApplicationCommandOptionType.Attachment,
                    required: false,
                }
            ]
        },
        {
            name: "end",
            description: "Ends a poll",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "id",
                    description: "Provide the poll message id",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        }
    ],
    async execute(interaction: ChatInputCommandInteraction, client: CustomClient) {
        await interaction.deferReply({ ephemeral: true });

        switch (interaction.options.getSubcommand()) {
            case "start": {
                const topic = interaction.options.getString("topic", true);
                const type = interaction.options.getString("type", true);
                const answerPosition = interaction.options.getInteger("answer");
                const channel = interaction.options.getChannel("channel") as BaseGuildTextChannel || interaction.channel;
                const role = interaction.options.getRole("role");
                const attachment = interaction.options.getAttachment("attachment");
                const image = attachment ? attachment.proxyURL : null;

                const embed = new EmbedBuilder()
                    .setColor(client.data.color)
                    .setTitle(`\`🎓\` | ${topic}`)
                    .setThumbnail((interaction.guild as Guild).iconURL())
                    .setImage(image)
                    .setTimestamp();

                switch (type) {
                    case "1": {
                        const data = new DB({
                            guildId: interaction.guild?.id,
                            channelId: channel?.id,
                            userId: interaction.user.id,
                            topic,
                            type,
                            endTime: Date.now() + ms("1d"),
                            votes: {
                                pollYes: 0,
                                pollNo: 0,
                                pollNod: 0
                            },
                            users: {
                                pollYes: [],
                                pollNo: [],
                                pollNod: []
                            }
                        });
                        await data.save();

                        embed.setDescription("Click the specific button below to vote,"
                            + "\n\n" +
                            "`✅` ⭢ Yes"
                            + "\n" +
                            "`❌` ⭢ No"
                            + "\n" +
                            "`🤷‍♂️` ⭢ Not Sure"
                        );

                        const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
                            new ButtonBuilder()
                                .setCustomId("poll-yes")
                                .setEmoji("✅")
                                .setStyle(ButtonStyle.Primary),

                            new ButtonBuilder()
                                .setCustomId("poll-no")
                                .setEmoji("❌")
                                .setStyle(ButtonStyle.Primary),

                            new ButtonBuilder()
                                .setCustomId("poll-nod")
                                .setEmoji("🤷‍♂️")
                                .setStyle(ButtonStyle.Primary)
                        );

                        if (role) {
                            const message = await channel.send({
                                content: `${role}, ${interaction.user} has started a poll!`,
                                embeds: [embed],
                                components: [row]
                            });

                            data.messageId = message.id;
                            await data.save();
                        } else {
                            const message = await channel.send({
                                content: `${interaction.user} has started a poll!`,
                                embeds: [embed],
                                components: [row]
                            });

                            data.messageId = message.id;
                            await data.save();
                        }

                        editReply(interaction, "📊", `Started poll in : ${channel}`);
                    }
                        break;

                    case "2": {
                        const rawPollOptions = interaction.options.getString("options");
                        if (!rawPollOptions) return editReply(interaction, "❌", "You must provide some options to create this type of poll!");
                        if (!rawPollOptions.includes("^")) return editReply(interaction, "❌", "The options must be separated using `^`. For example, `Option1^Option2^Option3`!");

                        const splitOptions: string[] = [];
                        const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];

                        const options = rawPollOptions.split("^");
                        options.forEach((option) => {
                            if (option.length > 0) splitOptions.push(option.trim());
                        });

                        if (splitOptions.length < 2) return editReply(interaction, "❌", "At least `2` options are required to start this poll!");
                        if (splitOptions.length > 9) return editReply(interaction, "❌", "Polls can only have `9` options!");

                        let pollOptions = "";
                        for (let i = 0; i < splitOptions.length; i++) {
                            pollOptions = pollOptions + (`\n\`${emojis[i]}\` ⭢ ${splitOptions[i]}`);
                        }

                        const arrayOfButtons: ButtonBuilder[] = [];
                        const dbOptions: string[] = [];
                        const dbVotes: [string, number][] = [];
                        const dbUsers: [string, string[]][] = [];

                        for (let i = 0; i < splitOptions.length; i++) {
                            const button = new ButtonBuilder()
                                .setCustomId(`poll-${i}`)
                                .setEmoji(`${emojis[i]}`)
                                .setStyle(ButtonStyle.Secondary);
                            arrayOfButtons.push(button);

                            dbOptions.push(`poll-${i}`);
                            dbVotes.push([`poll-${i}`, 0]);
                            dbUsers.push([`poll-${i}`, []]);
                        }

                        let components: ActionRowBuilder<ButtonBuilder>[];
                        if (arrayOfButtons.length > 5) components = createRow(arrayOfButtons, 5);
                        else components = [new ActionRowBuilder<ButtonBuilder>().setComponents(arrayOfButtons)];

                        const votesArray = new Map(dbVotes);
                        const votesObj = Object.fromEntries(votesArray);

                        const usersArray = new Map(dbUsers);
                        const usersObj = Object.fromEntries(usersArray);

                        const data = new DB({
                            guildId: interaction.guild?.id,
                            channelId: channel.id,
                            userId: interaction.user.id,
                            topic,
                            type,
                            endTime: Date.now() + ms("1d"),
                            options: dbOptions,
                            votes: votesObj,
                            users: usersObj
                        });
                        await data.save();

                        embed.setDescription("Click the specific button below to vote," + "\n" + pollOptions);

                        if (role) {
                            const message = await channel.send({
                                content: `${role}, ${interaction.user} has started a poll!`,
                                embeds: [embed],
                                components
                            });

                            data.messageId = message.id;
                            await data.save();
                        } else {
                            const message = await channel.send({
                                content: `${interaction.user} has started a poll!`,
                                embeds: [embed],
                                components
                            });

                            data.messageId = message.id;
                            await data.save();
                        }

                        editReply(interaction, "📊", `Started poll in : ${channel}`);
                    }
                        break;

                    case "3": {
                        const rawPollOptions = interaction.options.getString("options");
                        if (!rawPollOptions) return editReply(interaction, "❌", "You must provide some options to create this type of poll!");
                        if (!rawPollOptions.includes("^")) return editReply(interaction, "❌", "The options must be separated using `^`. For example, `Option1^Option2^Option3`!");

                        if (!answerPosition) return editReply(interaction, "❌", "You need to provide the position of the answer!");
                        const answer = answerPosition - 1;

                        const splitOptions: string[] = [];
                        const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];

                        const options = rawPollOptions.split("^");
                        options.forEach((option) => {
                            if (option.length > 0) splitOptions.push(option.trim());
                        });

                        if (splitOptions.length < 2) return editReply(interaction, "❌", "At least `2` options are required to start this poll!");
                        if (splitOptions.length > 9) return editReply(interaction, "❌", "Polls can only have `9` options!");

                        let pollOptions = "";
                        for (let i = 0; i < splitOptions.length; i++) {
                            pollOptions = pollOptions + (`\n\`${emojis[i]}\` ⭢ ${splitOptions[i]}`);
                        }

                        const arrayOfButtons: ButtonBuilder[] = [];
                        const dbOptions: string[] = [];
                        const dbVotes: [string, number][] = [];
                        const dbUsers: [string, string[]][] = [];

                        for (let i = 0; i < splitOptions.length; i++) {
                            const button = new ButtonBuilder()
                                .setCustomId(`poll-${i}`)
                                .setEmoji(`${emojis[i]}`)
                                .setStyle(ButtonStyle.Secondary);
                            arrayOfButtons.push(button);

                            dbOptions.push(`poll-${i}`);
                            dbVotes.push([`poll-${i}`, 0]);
                            dbUsers.push([`poll-${i}`, []]);
                        }

                        let components: ActionRowBuilder<ButtonBuilder>[];
                        if (arrayOfButtons.length > 5) components = createRow(arrayOfButtons, 5);
                        else components = [new ActionRowBuilder<ButtonBuilder>().setComponents(arrayOfButtons)];

                        const votesArray = new Map(dbVotes);
                        const votesObj = Object.fromEntries(votesArray);

                        const usersArray = new Map(dbUsers);
                        const usersObj = Object.fromEntries(usersArray);

                        const data = new DB({
                            guildId: interaction.guild?.id,
                            channelId: channel.id,
                            userId: interaction.user.id,
                            topic,
                            type,
                            endTime: Date.now() + ms("1d"),
                            options: dbOptions,
                            votes: votesObj,
                            users: usersObj,
                            answer
                        });
                        await data.save();

                        embed.setDescription("Click the specific button below to vote," + "\n" + pollOptions);

                        if (role) {
                            const message = await channel.send({
                                content: `${role}, ${interaction.user} has started a poll!`,
                                embeds: [embed],
                                components
                            });

                            data.messageId = message.id;
                            await data.save();
                        } else {
                            const message = await channel.send({
                                content: `${interaction.user} has started a poll!`,
                                embeds: [embed],
                                components
                            });

                            data.messageId = message.id;
                            await data.save();
                        }

                        editReply(interaction, "📊", `Started poll in : ${channel}`);
                    }
                        break;
                }
            }
                break;

            case "end": {
                const pollId = interaction.options.getString("id", true);

                const data = await DB.findOne<PollData>({ messageId: pollId }).catch(() => { });
                if (!data) return editReply(interaction, "❌", "Invalid id!");

                endPoll(data, client);

                editReply(interaction, "✅", "The poll has been ended");
            }
                break;
        }
    }
});

function createRow(array: ButtonBuilder[], numberOfButtonInRow: number) {
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    let k = numberOfButtonInRow;

    for (let i = 0; i < array.length; i += numberOfButtonInRow) {
        const current = array.slice(i, k);
        k += numberOfButtonInRow;
        const rowComponents = [];

        const mapped = current.map((x) => x);
        rowComponents.push(mapped);

        rowComponents.forEach((x) => {
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(x);
            rows.push(row);
        });
    }
    return rows;
}