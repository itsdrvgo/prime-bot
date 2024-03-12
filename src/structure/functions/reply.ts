import { ButtonInteraction, ChatInputCommandInteraction, Colors, EmbedBuilder, ModalSubmitInteraction } from "discord.js";

export type ValidInteractionTypes =
    ChatInputCommandInteraction |
    ButtonInteraction |
    ModalSubmitInteraction;

export function reply(interaction: ValidInteractionTypes, emoji: string, description: string, ephemeral = true) {
    interaction.reply({
        embeds: [
            new EmbedBuilder()
                .setColor(Colors.Blue)
                .setDescription(`\`${emoji}\` | ${description}`)
        ],
        ephemeral
    });
}