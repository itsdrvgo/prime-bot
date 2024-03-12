import { ChatInputCommandInteraction, ApplicationCommandOptionType, GuildMember, EmbedBuilder, BaseGuildTextChannel } from "discord.js";
import { CustomClient, SlashCommand, editReply } from "../../structure/index.js";
import { DiscordUser } from "../../structure/interfaces/index.js";
import axios from "axios";

export default new SlashCommand({
    name: "add-bot",
    description: "Sends a request of adding your bot to the server (Boosters only)",
    options: [
        {
            name: "id",
            description: "Provide the Bot ID",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "link",
            description: "Provide the Bot Invite Link",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    async execute(interaction: ChatInputCommandInteraction, client: CustomClient) {
        await interaction.deferReply({ ephemeral: true });

        const member = interaction.member as GuildMember | null;
        if (!member) return editReply(interaction, "❌", "Error finding the command user!");
        if (!member.premiumSince) return editReply(interaction, "❌", "Only boosters can add their bot to this server!");

        const botID = interaction.options.getString("id", true);
        const botLink = interaction.options.getString("link", true);

        interaction.guild?.channels.fetch("1024309444932288566").then((channel) => {
            if (!channel) return;
            const botChannel = channel as BaseGuildTextChannel;

            const inviteLinks = ["https://discord.com/", "https://dsc.gg/", "https://top.gg/bot/",];
            if (!inviteLinks.some((link) => botLink.toLowerCase().includes(link))) return editReply(interaction, "❌", "We only accept invite links starting with `https://discord.com/` or `https://dsc.gg/` or `https://top.gg/bot/`!");

            axios.get<DiscordUser>(`https://discord.com/api/v10/users/${botID}`, {
                headers: {
                    Authorization: `Bot ${client.data.devBotEnabled ? client.data.dev.token : client.data.prod.token}`
                }
            }).then((res) => {
                const { data } = res;

                const embed = new EmbedBuilder()
                    .setColor(client.data.color)
                    .setTitle("`🤖` | New Bot Request")
                    .addFields(
                        { name: "Name", value: `${data.username}#${data.discriminator}` },
                        { name: "ID", value: data.id, inline: true },
                        { name: "Invite Link", value: `[Click Here](${botLink})` },
                        { name: "Requested by", value: `${member}` },
                    )
                    .setThumbnail(`https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.webp`)
                    .setTimestamp();

                editReply(interaction, "✅", "Your request has been submitted");
                botChannel.send({ embeds: [embed] });
            }).catch((err) => {
                return editReply(interaction, "❌", "Unexpected error occurred : " + "```" + err + "```");
            });
        }).catch((err) => {
            return editReply(interaction, "❌", "Unexpected error occurred : " + "```" + err + "```");
        });
    }
});