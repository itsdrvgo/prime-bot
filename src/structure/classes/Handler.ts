/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChannelType, Colors, EmbedBuilder, Events } from "discord.js";
import { getAllFiles } from "../functions/index.js";
import { SlashCommand, Event, ContextCommand, MessageCommand } from "../interfaces/index.js";
import { CustomClient } from "./index.js";

export class Handler {
    private client: CustomClient;
    constructor(client: CustomClient) {
        this.client = client;
    }

    async loadCommands(directory: string) {
        const files = getAllFiles(directory);
        if (!files.length) return;
        const publicCommands: any[] = [];
        const developerCommands: any[] = [];
        let loadedCommands = 0;

        for await (const file of files) {
            const command: SlashCommand | ContextCommand | MessageCommand = (await import("file://" + file)).default;

            if (command.data?.developerGuild) developerCommands.push(command.data);
            else publicCommands.push(command.data);

            this.client.commands.set(command.data.name, command.data);
            loadedCommands++;

            if (command instanceof SlashCommand && command.data?.autcomplete) this.client.autocomplete.set(command.data.name, command);
        }

        if (loadedCommands !== 0) this.client.logger.info("System", `Commands Loaded : ${this.client.logger.highlight(loadedCommands.toString(), "success")}`);

        const pushCommands = async () => {
            if (!this.client.data.devBotEnabled) {
                await this.client.application?.commands.set(publicCommands);
                this.client.data.guilds.dev?.forEach(async (id: string) => {
                    const guild = await this.client.guilds.fetch(id);
                    if (!guild) return;

                    await guild.commands.set([]);
                });
                this.client.logger.info("System", `Current Mode : ${this.client.logger.highlight(this.client.data.devBotEnabled ? "Dev" : "Live", "error")}`);
            } else {
                await this.client.application?.commands.set([]);
                this.client.data.guilds.dev?.forEach(async (id: string) => {
                    const guild = await this.client.guilds.fetch(id);
                    if (!guild) return;

                    await guild.commands.set(Array.from(this.client.commands.values()) as []);
                    this.client.logger.info("System", `Current Mode : ${this.client.logger.highlight(this.client.data.devBotEnabled ? "Dev" : "Live", "success")}`);
                    this.client.logger.info("System", `Deployed Commands to : ${this.client.logger.highlight(guild.name, "success")}`);
                });
            }
        };

        if (!this.client.isReady()) this.client.once(Events.ClientReady, () => pushCommands());
        else pushCommands();
    }

    async loadEvents(directory: string) {
        const files = getAllFiles(directory);
        if (!files.length) return;
        let loadedEvents = 0;

        for await (const file of files) {
            const { data: event }: Event = (await import("file://" + file)).default;

            const execute = (...args: unknown[]) => event?.execute(...args, this.client);

            if (event?.event !== null) event?.once ? this.client.once(event?.event, execute) : this.client.on(event?.event, execute);
            else if (event?.event === null && event?.restEvent) event?.once ? this.client.rest.once(event?.restEvent, execute) : this.client.rest.on(event?.restEvent, execute);
            else throw new TypeError(`Event ${file.split("/").at(-2)}/${file.split("/").at(-1)} has no event name`);
            loadedEvents++;
        }

        if (loadedEvents !== 0) this.client.logger.info("System", `Events Loaded : ${this.client.logger.highlight(loadedEvents.toString(), "success")}`);
    }

    catchErrors() {
        const embed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setTimestamp();

        const logsChannelId = this.client.data.devBotEnabled ? this.client.data.dev.logs : this.client.data.prod.logs;

        process
            .on("uncaughtException", async (err) => {
                this.client.logger.error("System", `Uncaught Exception : ${err}`);
                const channel = await this.client.channels.fetch(logsChannelId);
                if (!channel || channel.type !== ChannelType.GuildText) return;

                channel.send({
                    embeds: [
                        embed
                            .setTitle("`⚠` | Uncaught Exception/Catch")
                            .setDescription([
                                "```" + err.stack + "```"
                            ].join("\n"))
                    ]
                });
            })
            .on("uncaughtExceptionMonitor", async (err) => {
                this.client.logger.error("System", `Uncaught Exception (Monitor) : ${err}`);
                const channel = await this.client.channels.fetch(logsChannelId);
                if (!channel || channel.type !== ChannelType.GuildText) return;

                channel.send({
                    embeds: [
                        embed
                            .setTitle("`⚠` | Uncaught Exception/Catch (MONITOR)")
                            .setDescription([
                                "```" + err.stack + "```"
                            ].join("\n"))
                    ]
                });
            })
            .on("unhandledRejection", async (reason: Error) => {
                this.client.logger.error("System", `Unhandled Rejection/Catch : ${reason}`);
                const channel = await this.client.channels.fetch(logsChannelId);
                if (!channel || channel.type !== ChannelType.GuildText) return;

                channel.send({
                    embeds: [
                        embed
                            .setTitle("`⚠` | Unhandled Rejection/Catch")
                            .setDescription([
                                "```" + reason.stack + "```"
                            ].join("\n"))
                    ]
                });
            });
    }
}