import { CustomClient } from "./structure/index.js";
import config from "./config.js";
import { GatewayIntentBits, Partials } from "discord.js";

const client = new CustomClient({
    data: {
        ...config,
        devBotEnabled: true
    },
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent
    ],
    partials: [
        Partials.GuildMember,
        Partials.Message,
        Partials.ThreadMember,
        Partials.User
    ]
});

export default client;

client.start();