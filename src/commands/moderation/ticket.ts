import { ChatInputCommandInteraction, PermissionFlagsBits, ApplicationCommandOptionType, GuildMember, EmbedBuilder, BaseGuildTextChannel, Guild, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import { CustomClient, editReply, SlashCommand } from "../../structure/index.js";
import DB from "../../schemas/Ticket.js";

export default new SlashCommand({
    name: "ticket",
    description: "Ticket management system",
    defaultMemberPermissions: PermissionFlagsBits.ManageMessages,
    options: [
        {
            name: "setup",
            description: "Sets up the ticket",
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: "manage",
            description: "Manages members inside a ticket",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "target",
                    description: "Select a target",
                    type: ApplicationCommandOptionType.User,
                    required: true
                }
            ]
        }
    ],
    async execute(interaction: ChatInputCommandInteraction, client: CustomClient) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const guild = interaction.guild as Guild;
            const ticketChannel = await interaction.guild?.channels.fetch("1024309444466704415") as BaseGuildTextChannel;

            switch (interaction.options.getSubcommand()) {
                case "setup": {
                    const embed = new EmbedBuilder()
                        .setColor(client.data.color)
                        .setAuthor({ name: guild.name + " | Ticket System", iconURL: guild.iconURL() as string })
                        .setThumbnail(guild.iconURL())
                        .setDescription("Click the button below that suits your problem to create a Private Ticket. Please don't create unnecessary tickets. Also, don't create tickets just because you need help in Coding. We have channel for that. Create the ticket & state your issue, keep patience our staff will be there soon. Any unnecessary tickets will be deleted without any question!\n\n**Do not create ticket if you need help in coding (unless it's asked), ask in <#1024309443959210072> for coding related questions!**")
                        .setTimestamp();

                    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId("tkt_create")
                            .setLabel("Create Ticket")
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji("🎟")
                    );

                    ticketChannel.send({ embeds: [embed], components: [row] });
                    editReply(interaction, "✅", `Ticket sent to : ${ticketChannel}`);
                }
                    break;

                case "manage": {
                    const target = interaction.options.getMember("target") as GuildMember | null;
                    if (!target) return editReply(interaction, "❌", "Invalid target!");

                    const data = await DB.findOne({ guildId: guild.id, channelId: interaction.channel?.id }).catch(() => { });
                    if (!data) return editReply(interaction, "❌", "This channel is not tied with a ticket!");

                    if (data.memberIds.includes(target.id)) {
                        data.memberIds = data.memberIds.filter((x) => x !== target.id);
                        (interaction.channel as BaseGuildTextChannel)?.permissionOverwrites.edit(target.id, {
                            "ViewChannel": false,
                        });

                        await data.save();
                        editReply(interaction, "✅", `Successfully removed ${target} from the ticket`);
                    } else {
                        data.memberIds.push(target.id);
                        (interaction.channel as BaseGuildTextChannel)?.permissionOverwrites.edit(target.id, {
                            "SendMessages": true,
                            "ViewChannel": true,
                            "ReadMessageHistory": true
                        });

                        await data.save();
                        editReply(interaction, "✅", `Successfully added ${target} to the ticket`);
                    }
                }
                    break;
            }
        } catch (err) {
            return editReply(interaction, "❌", "An error occured while managing the ticket" + "```" + err + "```");
        }
    }
});