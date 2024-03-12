import { ActivityType, Events } from "discord.js";
import { CustomClient, Event } from "../../structure/index.js";
import ms from "ms";

export default new Event({
    event: Events.ClientReady,
    once: true,
    execute(client: CustomClient) {
        client.logger.info("System", `Successfully Logged into : ${client.logger.highlight(client.user?.tag as string, "success")}`);
        setInterval(() => {
            client.user?.setActivity({
                name: `Ping: ${client.ws.ping} ms`,
                type: ActivityType.Playing
            });
        }, ms("5s"));
    }
});