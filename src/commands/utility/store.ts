import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { CustomClient, Items, SlashCommand, paginate } from "../../structure/index.js";
import { items } from "../../items.js";

export default new SlashCommand({
    name: "store",
    description: "Displays all the items available in the store",
    async execute(interaction: ChatInputCommandInteraction, client: CustomClient) {
        const sortedItems = items.sort((a, b) => a.price - b.price);
        const pages = pageBuilder(sortedItems, client);
        paginate(interaction, pages);
    }
});

function pageBuilder(data: Items[], client: CustomClient) {
    const embeds: EmbedBuilder[] = [];

    const title = data.map((x) => x.name);
    const price = data.map((x) => x.price);
    const description = data.map((x) => x.description);
    const guide = data.map((x) => {
        if (!x.link) return "`Not available`";
        else return `[Click Here](${x.link})`;
    });
    const image = data.map((x) => {
        if (!x.thumbnail) return null;
        else return x.thumbnail;
    });

    for (let i = 0; i < data.length; i++) {
        const embed = new EmbedBuilder()
            .setColor(client.data.color)
            .setThumbnail(client.user?.displayAvatarURL() as string)
            .setTitle("`🛒` | Store")
            .setDescription(
                `**Name :** ${title[i]}` + "\n" +
                `**Price :** \`£${price[i]}\`` + "\n" +
                `**Description :** \`\`\`${description[i]}\`\`\`` + "\n" +
                `**Guide :** ${guide[i]}`
            )
            .setImage(image[i])
            .setFooter({ text: `Page ${i + 1}/${data.length}` })
            .setTimestamp();
        embeds.push(embed);
    }
    return embeds;
}