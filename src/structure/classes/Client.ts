import { Client, Collection } from "discord.js";
import mongoose from "mongoose";
import { ClientDataOptions, CustomClientOptions, SlashCommand, BaseApplicationCommand } from "../interfaces/index.js";
import { Handler, PayPal } from "./index.js";
import { Logger } from "./Logger.js";
import { DashboardAPI } from "../../api/index.js";

export class CustomClient extends Client {
    public commands: Collection<string, BaseApplicationCommand> = new Collection();
    public autocomplete: Collection<string, SlashCommand> = new Collection();
    public data: ClientDataOptions;
    public handlers: Handler = new Handler(this);
    public logger: Logger = new Logger();
    public paypal: PayPal = new PayPal(this);
    public api: DashboardAPI = new DashboardAPI(this);
    constructor(options: CustomClientOptions) {
        super(options);
        this.data = options.data;
        this.setMaxListeners(20);
    }

    async start() {
        this.handlers.catchErrors();
        this.handlers.loadEvents(this.data.handlers.events);
        this.handlers.loadCommands(this.data.handlers.commands);
        this.api.init();

        this.login(this.data.devBotEnabled ? this.data.dev.token : this.data.prod.token);

        mongoose.set("strictQuery", false);
        mongoose.connect(this.data.devBotEnabled ? this.data.dev.db : this.data.prod.db)
            .then((data) => {
                this.logger.info("Database", "Connected to : " + this.logger.highlight(data.connection.name, "success"));
            })
            .catch(() => {
                this.logger.error("Database", "Error Connecting to Database!");
            });
    }
}