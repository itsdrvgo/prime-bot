import { ApplicationCommandOptionType, ChatInputCommandInteraction, EmbedBuilder, Guild, GuildMember } from "discord.js";
import { CustomClient, SlashCommand } from "../../structure/index.js";
import DB, { LevelData } from "../../schemas/Level.js";

export default new SlashCommand({
    name: "rank",
    description: "Displays the rank card",
    options: [
        {
            name: "target",
            description: "Select a target",
            type: ApplicationCommandOptionType.User,
            required: false
        }
    ],
    async execute(interaction: ChatInputCommandInteraction, client: CustomClient) {
        await interaction.deferReply();

        const target = interaction.options.getMember("target") as GuildMember || interaction.member as GuildMember;

        const data = await DB.findOne<LevelData>({ guildId: interaction.guild?.id, userId: target.id }).catch(() => { });
        const allData = await DB.find<LevelData>({ guildId: interaction.guild?.id })
            .sort({
                xp: -1,
                level: -1
            })
            .limit(10)
            .catch(() => { });

        const currentLevel = data?.level ? data.level : 0;
        const requiredXp = (currentLevel * currentLevel * 100 + 100);

        let leaderboard = "";

        for (let counter = 0; counter < (allData as LevelData[]).length; ++counter) {
            const { userId, xp, level = 0 } = (allData as LevelData[])[counter];

            leaderboard += `\`${counter + 1}.\` **Name:** <@${userId}>\n**XP:** \`${shortener(xp)}\`\n**Level:** \`${level}\`\n\n`;
        }

        const embed = new EmbedBuilder()
            .setColor(client.data.color)
            .setTitle("`🧬` | Rank Board")
            .setThumbnail((interaction.guild as Guild).iconURL())
            .addFields(
                { name: `${target.user.username}'s Rank:`, value: "```" + `XP: ${shortener(data?.xp || 0)} / ${shortener(requiredXp)} | Level: ${data?.level || 0}` + "```" },
                { name: "Leaderboard:", value: leaderboard }
            );
        interaction.editReply({ embeds: [embed] });
    }
});

function shortener(count: number) {
    const COUNT_ABBRS = ["", "k", "M", "T"];

    const i = 0 === count ? count : Math.floor(Math.log(count) / Math.log(1000));

    let result = parseFloat((count / Math.pow(1000, i)).toFixed(2)).toString();
    result += `${COUNT_ABBRS[i]}`;

    return result;
}