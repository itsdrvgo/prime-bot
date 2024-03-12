import { Events } from "discord.js";
import { CustomClient, Event } from "../../structure/index.js";
import ms from "ms";

export default new Event({
    event: Events.ClientReady,
    once: true,
    async execute(client: CustomClient) {
        try {
            const guild = await client.guilds.fetch("1024309441723650109");
            if (!guild) return;

            setInterval(async () => {
                const members = await guild.members.fetch();
                const specialRoleIds = ["1024309442193403913", "1024309442193403912", "1024309442193403911", "1024309442193403910", "1024309442193403909", "1024309442193403908", "1024309442193403907", "1024309442193403906", "1024309442193403905", "1024309442193403904"];

                members.forEach((member) => {
                    if (member.premiumSince) return;
                    specialRoleIds.forEach(async (roleId) => {
                        if (member.roles.cache.find((x) => x.id === roleId)) return await member.roles.remove(roleId);
                    });
                });
            }, ms("5m"));
        } catch (err) {
            return;
        }
    }
});