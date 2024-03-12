import { ChatInputCommandInteraction, PermissionFlagsBits, ApplicationCommandOptionType, GuildMember, Role } from "discord.js";
import { editReply, SlashCommand } from "../../structure/index.js";
import ms from "ms";

export default new SlashCommand({
    name: "role",
    description: "Manages roles of targets",
    defaultMemberPermissions: PermissionFlagsBits.ManageRoles,
    options: [
        {
            name: "options",
            description: "Choose an option",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "Give", value: "1" },
                { name: "Remove", value: "2" },
                { name: "Give All", value: "3" },
                { name: "Remove All", value: "4" }
            ]
        },
        {
            name: "role",
            description: "Select a role",
            type: ApplicationCommandOptionType.Role,
            required: true
        },
        {
            name: "target",
            description: "Select a target",
            type: ApplicationCommandOptionType.User,
            required: false
        }
    ],
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });

        const role = interaction.options.getRole("role", true) as Role;
        const target = interaction.options.getMember("target") as GuildMember | null;

        switch (interaction.options.getString("options", true)) {
            case "1":
                if (!target) return editReply(interaction, "❌", "Invalid target!");
                if (!target.manageable) return editReply(interaction, "❌", "Target can't be managed!");
                if (target.roles.cache.find((r) => r.id === role.id)) return editReply(interaction, "❌", `${target} already has **${role.name}** role!`);

                await target.roles.add(role);
                editReply(interaction, "✅", `${target} now has **${role.name}** role`);
                break;

            case "2":
                if (!target) return editReply(interaction, "❌", "Invalid target!");
                if (!target.manageable) return editReply(interaction, "❌", "Target can't be managed!");
                if (!target.roles.cache.find((r) => r.id === role.id)) return editReply(interaction, "❌", `${target} doesn't have **${role.name}** role!`);

                await target.roles.remove(role);
                editReply(interaction, "✅", `${target} has lost **${role.name}** role`);
                break;

            case "3":
                interaction.guild?.members.fetch().then((members) => {
                    editReply(interaction, "✅", `Given ${role} to every member on this server`);

                    members.filter((member) => !member.user.bot).forEach((member) => {
                        setTimeout(async () => {
                            if (!member.manageable) return;
                            await member.roles.add(role);
                        }, ms("2s"));
                    });
                }).catch(() => {
                    editReply(interaction, "❌", "Error giving role to all the members!");
                });
                break;

            case "4":
                interaction.guild?.members.fetch().then((members) => {
                    editReply(interaction, "✅", `Removed ${role} from every member on this server`);

                    members.filter((member) => !member.user.bot).forEach((member) => {
                        setTimeout(async () => {
                            if (!member.manageable) return;
                            await member.roles.remove(role);
                        }, ms("2s"));
                    });
                }).catch(() => {
                    editReply(interaction, "❌", "Error removing role from all the members!");
                });
                break;
        }
    }
});