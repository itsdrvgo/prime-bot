import { ChatInputCommandInteraction, Events, PermissionsBitField } from "discord.js";
import { Event, CustomClient, reply } from "../../structure/index.js";

export default new Event({
    event: Events.InteractionCreate,
    async execute(interaction: ChatInputCommandInteraction, client: CustomClient) {
        if (!interaction.isCommand()) return;
        const command = client.commands.get(interaction.commandName);
        await client.application?.fetch();

        if (!command) {
            reply(interaction, "❌", "This command does not exist");

            return client.commands.delete(interaction.commandName);
        }

        if (command.botOwnerOnly && !client.data.developers.includes(interaction.user.id)) return reply(interaction, "❌", "This command is only available for bot developers");

        if (interaction.commandName === "reload") return command.execute(interaction, client);

        if (!interaction.guild?.members?.me?.permissions.has(PermissionsBitField.Flags.Administrator)) {
            if (!command.botPermissions?.length) return;

            let invalidBotPerms = [];
            invalidBotPerms = command.botPermissions.filter((perm) => !interaction.guild?.members?.me?.permissions.has(perm));

            if (invalidBotPerms.length > 0) return reply(interaction, "❌", `I need the \`${invalidBotPerms.join(", ")}\` permission(s) to run this command`);
        }

        command.execute(interaction, client);
    }
});