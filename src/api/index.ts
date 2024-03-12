import { Events } from "discord.js";
import { CustomClient } from "../structure/classes/index.js";
import { createApp } from "./utils/createApp.js";

export class DashboardAPI {
    private client: CustomClient;
    constructor(client: CustomClient) {
        this.client = client;
    }

    init() {
        const port = this.client.data.devBotEnabled ? this.client.data.dev.port : this.client.data.prod.port;

        const initialize = () => {
            try {
                const app = createApp(this.client);
                app.listen(port, () => this.client.logger.info("Dashboard", `Initialized Dashboard on Port : ${this.client.logger.highlight(port.toString(), "success")}`));
            } catch (err) {
                this.client.logger.error("Dashboard", `${err}`);
            }
        };
        if (!this.client.isReady()) this.client.once(Events.ClientReady, () => initialize());
        else initialize();
    }
}