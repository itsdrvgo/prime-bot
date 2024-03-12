import { ChatInputCommandInteraction } from "discord.js";
import { CustomClient, reply, SlashCommand } from "../../structure/index.js";

export default new SlashCommand({
    name: "ping",
    description: "Check the bot latency",
    execute(interaction: ChatInputCommandInteraction, client: CustomClient) {
        reply(interaction, "⌛", `Bot latency is \`${client.ws.ping}\`ms`);
    }
});