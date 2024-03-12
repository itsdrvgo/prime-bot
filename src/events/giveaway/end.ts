import { BaseGuildTextChannel, Events } from "discord.js";
import { Event, CustomClient, endGiveaway } from "../../structure/index.js";
import ms from "ms";
import Giveaway from "../../schemas/Giveaway.js";

export default new Event({
    event: Events.ClientReady,
    execute(client: CustomClient) {
        setInterval(() => {
            Giveaway.find().then((dataArray) => {
                if (!dataArray || dataArray.length === 0) return;
                dataArray.forEach(async (data) => {
                    if (!data) return;
                    if (data.ended === true) return;
                    if (data.paused === true) return;

                    client.guilds.fetch(data.guildId).then((guild) => {
                        guild.channels.fetch(data.channelId).then((c) => {
                            const channel = c as BaseGuildTextChannel;
                            channel.messages.fetch(data.messageId).then((message) => {
                                if ((data.endTimestamp * 1000) <= Date.now()) return endGiveaway(message, client);
                            }).catch(async () => {
                                if (data.$isDeleted()) return;
                                await data.deleteOne();
                                return;
                            });
                        }).catch(async () => {
                            if (data.$isDeleted()) return;
                            await data.deleteOne();
                            return;
                        });
                    }).catch(async () => {
                        if (data.$isDeleted()) return;
                        await data.deleteOne();
                        return;
                    });
                });
            });
        }, ms("15s"));
    }
});