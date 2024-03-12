import { ClientOptions, ColorResolvable } from "discord.js";

export interface CustomClientOptions extends ClientOptions {
    data: ClientDataOptions;
}

export interface ClientDataOptions {
    dev: {
        id: string;
        secret: string;
        token: string;
        db: string;
        logs: string;
        domain: string;
        port: number;
    };
    prod: {
        id: string;
        secret: string;
        token: string;
        db: string;
        logs: string;
        domain: string;
        port: number;
    };
    handlers: { commands: string, events: string };
    guilds: {
        dev: string[];
        primary: string;
    };
    paypal: {
        dev: {
            id: string;
            secret: string;
            url: string;
            email: string;
        };
        prod: {
            id: string;
            secret: string;
            url: string;
            email: string;
        }
    };
    color: ColorResolvable;
    devBotEnabled: boolean;
    developers: string[]
}