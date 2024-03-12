import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { SlashCommand, editReply } from "../../structure/index.js";

export default new SlashCommand({
    name: "change",
    description: "Changes the members' nickname to readable characters",
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    botOwnerOnly: true,
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });

        const fetchedMembers = await interaction.guild?.members.fetch();
        if (!fetchedMembers) return;

        const members = fetchedMembers.filter((member) => member.displayName.match(/[^\x20-\x7E]/g));
        const oldUsers = fetchedMembers.filter((member) => member.displayName.startsWith("User"));

        let count = 1;

        if (oldUsers.size === 0) {
            members.forEach((member) => {
                member.setNickname("User " + count++).catch(() => { return; });
            });
        } else {
            const counterArray: number[] = [];

            oldUsers.forEach((user) => {
                const index = parseInt(user.displayName.split(" ")[1]);
                if (isNaN(index)) return;
                counterArray.push(index);
            });
            const Max = Math.max(...counterArray);
            count = Max + 1;

            members.forEach((member) => {
                member.setNickname("User " + count++).catch(() => { return; });
            });
        }

        editReply(interaction, "✅", `Successfully changed nicknames of \`${members.size}\` members`);
    }
});