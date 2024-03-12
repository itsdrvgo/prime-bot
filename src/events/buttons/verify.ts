import { ButtonInteraction, Events, GuildMember } from "discord.js";
import { Event, editReply } from "../../structure/index.js";

export default new Event({
    event: Events.InteractionCreate,
    async execute(interaction: ButtonInteraction) {
        if (!interaction.isButton()) return;
        if (interaction.customId !== "verify") return;
        await interaction.deferReply({ ephemeral: true });

        const member = interaction.member as GuildMember;
        const embed = interaction.message.embeds[0];
        if (!embed) return editReply(interaction, "❌", "You can't be verified at this moment, please contact any staff or the owner!");

        const roleId = embed.footer?.text;
        if (!roleId) return editReply(interaction, "❌", "You can't be verified at this moment, please contact any staff or the owner!");

        try {
            const role = await interaction.guild?.roles.fetch(roleId);
            if (!role) return editReply(interaction, "❌", "You can't be verified at this moment, please contact any staff or the owner!");
            if (member.roles.cache.has(role.id)) return editReply(interaction, "❌", "You've already been verified!");

            await member.roles.add(role);
            editReply(interaction, "✅", `You're now verified as a member of **${interaction.guild?.name}**`);
        } catch (err) {
            editReply(interaction, "❌", "You can't be verified at this moment, please contact any staff or the owner!");
            throw err;
        }
    }
});