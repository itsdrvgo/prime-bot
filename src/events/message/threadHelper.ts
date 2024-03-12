import { EmbedBuilder, Events, ThreadChannel } from "discord.js";
import { Event, CustomClient } from "../../structure/index.js";
import ms from "ms";

export default new Event({
    event: Events.ThreadCreate,
    async execute(thread: ThreadChannel, newlyCreated: boolean, client: CustomClient) {
        if (thread.guild.id !== "1024309441723650109") return;
        if (thread.parentId !== "1024697402717900890") return;

        setTimeout(() => {
            thread.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.data.color)
                        .setDescription(
                            "Hello there, before asking more questions, let's see whether you've provided enough information or not!"
                            + "\n\n" +
                            "`•` Provide the exact `discord.js` version along with the `node` version."
                            + "\n" +
                            "`•` You're requested to upload your code along with the error via [SourceBin](https://sourceb.in) and paste the link over here. **DO NOT SEND SCREENSHOT OF YOUR CODE!**"
                            + "\n" +
                            "`•` Explain your issue, and what you actually want to do with the code."
                            + "\n" +
                            "`•` We only provide help for **Discord.JS v14** series."
                            + "\n" +
                            "`•` We expect you to have a solid understanding of JavaScript. **NO KNOWLEDGE IN JS = NO HELP (<#1024309443699146753>)**"
                            + "\n\n" +
                            "**After your issue is solved don't forget to follow these steps,**"
                            + "\n\n" +
                            "`•` Add the `Solved` tag to the post."
                            + "\n" +
                            "`•` Close the post by clicking on **Close Post**."
                            + "\n\n" +
                            "*Any type of violation of these steps will bring you a warning along with a timeout!*"
                        )
                        .setTimestamp()
                ]
            });
        }, ms("5s"));
    }
});