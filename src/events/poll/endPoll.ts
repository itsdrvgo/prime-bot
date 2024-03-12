import { Events } from "discord.js";
import { Event, CustomClient } from "../../structure/index.js";
import ms from "ms";
import { endPoll } from "../../structure/functions/endPoll.js";
import DB, { PollData } from "../../schemas/Poll.js";

export default new Event({
    event: Events.ClientReady,
    execute(client: CustomClient) {
        setInterval(() => {
            const { guilds } = client;

            guilds.fetch().then((allGuilds) => {
                allGuilds.forEach(async (guild) => {
                    const allData = await DB.find({ guildId: guild.id }).catch(() => { });
                    if (allData?.length === 0) return;

                    allData?.forEach(async (data) => {
                        if (data.endTime > Date.now()) return;
                        endPoll(data as PollData, client);
                    });
                });
            }).catch(() => {
                return;
            });

        }, ms("15s"));
    }
});