import { ButtonInteraction, Events, GuildMember } from "discord.js";
import { Event, editReply } from "../../structure/index.js";
import DB, { SelfRoleData } from "../../schemas/SelfRole.js";

export default new Event({
    event: Events.InteractionCreate,
    async execute(interaction: ButtonInteraction) {
        if (!interaction.isButton()) return;

        const member = interaction.member as GuildMember;
        const embed = interaction.message.embeds[0];
        if (!embed) return editReply(interaction, "❌", "Try again later!");

        let name = embed.title;
        if (!name) return;
        name = name.toLowerCase();

        const data = await DB.findOne<SelfRoleData>({ guildId: interaction.guild?.id, name: name }).catch(() => { });
        if (!data) return;

        const ids = data.roleIds.map((x) => x.roleId);
        if (!ids.includes(interaction.customId)) return;

        await interaction.deferReply({ ephemeral: true });

        const roleId = interaction.customId;
        const role = await interaction.guild?.roles.fetch(roleId);
        if (!role) return editReply(interaction, "❌", "Error fetching your role, contact the staff!");
        const hasRole = member.roles.cache.find((r) => r.id === roleId);

        if (data.requiredRoleId) {
            const requiredRole = await interaction.guild?.roles.fetch(data.requiredRoleId);
            if (!requiredRole) return;

            const reqRoleHas = member.roles.cache.find((r) => r.id === requiredRole.id);
            if (!reqRoleHas) return editReply(interaction, "❌", `You need ${requiredRole} to get roles from this panel`);

            hasRole ? await member.roles.remove(roleId) : await member.roles.add(roleId);
            editReply(interaction, "✅", hasRole ? `You've lost the role: ${role}` : `You've obtained the role: ${role}`);
        } else {
            hasRole ? await member.roles.remove(roleId) : await member.roles.add(roleId);
            editReply(interaction, "✅", hasRole ? `You've lost the role: ${role}` : `You've obtained the role: ${role}`);
        }
    }
});