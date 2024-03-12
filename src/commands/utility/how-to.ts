import { ChatInputCommandInteraction, ApplicationCommandOptionType, GuildMember, EmbedBuilder } from "discord.js";
import { CustomClient, SlashCommand } from "../../structure/index.js";

export default new SlashCommand({
    name: "how-to",
    description: "Sends the helper panel",
    options: [
        {
            name: "options",
            description: "Choose an option",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "Ask for Help", value: "1" },
                { name: "Upload Codes", value: "2" },
                { name: "Close A Forum", value: "3" }
            ]
        },
        {
            name: "target",
            description: "Select a target",
            type: ApplicationCommandOptionType.User,
            required: false
        }
    ],
    async execute(interaction: ChatInputCommandInteraction, client: CustomClient) {
        await interaction.deferReply();

        const target = interaction.options.getMember("target") as GuildMember | null;
        const text = target ? `*This suggestion is for you ${target}*` : "*Nothing but a public suggestion*";

        const embed = new EmbedBuilder()
            .setColor(client.data.color)
            .setTimestamp();

        switch (interaction.options.getString("options", true)) {
            case "1":
                embed
                    .setTitle("🔱 | How to Ask for Help?")
                    .setDescription(
                        "`1.` Spoon-feeding is prohibited, so you're not allowed to ask for spoon-feeding in this server. The best we can do is to provide you the Documentation Links and maybe Solution Links.\n" +
                        "`2.` First, go and watch the video from first to last, carefully. Sometimes the video can include some bug-fixes - so it's must that you watch till the end. If it's found that you didn't watch the video and you're just randomly asking for help, we'll not help you.\n" +
                        "`3.` Having a solid understanding of JS is necessary. If you don't have it, go and learn it from <#1024309443959210068>. **No understaning of JS means, no help in this server!**\n" +
                        "`4.` Read the docs and guides carefully, typos can be prevented just by reading the documentations.\n" +
                        "`5.` Use google and other resources first to find solution, before asking for help in here.\n" +
                        "`6.` We don't give you code, or we won't code for you. You yourself have to do it, we'll only guide you.\n" +
                        "`7.` Do not ping or DM owners or staffs unless they have Ping for Help or anything related into their name. If you do so, you'll receive a warning.\n" +
                        "`8.` You must send your error along with the code. Use https://sourceb.in/ to send your codes. Do not send codes as text directly in the channel.\n"
                    );
                interaction.editReply({ content: text, embeds: [embed] });
                break;

            case "2":
                embed
                    .setTitle("🔱 | How to Upload Codes?")
                    .setDescription(
                        "`1.` You must send your error along with the code file where the error is happening. We won't help you, if we see that the error is saying one file and the file you're sending is a different one. That will be treated as lack of JS knowledge.\n" +
                        "`2.` Send your code as link via [SourceBin](https://sourceb.in). Do not send the code as text, directly in message.\n" +
                        "`3.` Do not send the code in the member's DM who is helping you. You're not a VIP, and the code is not confidential.\n" +
                        "`4.` Sending screenshots of your code is not allowed.\n"
                    );
                interaction.editReply({ content: text, embeds: [embed] });
                break;

            case "3":
                embed
                    .setTitle("🔱 | How to Close A Forum?")
                    .setDescription(
                        "`1.` If you've created a forum, it becomes your responsibility to close it properly.\n" +
                        "`2.` Once your issue is solved, put the `Solved` tag to the forum.\n" +
                        "`3.` Go to the three dots, and click on `Close Post` to finally close it.\n" +
                        "`4.` Violation of these steps will lead you to a timeout.\n"
                    );
                interaction.editReply({ content: text, embeds: [embed] });
                break;
        }
    }
});