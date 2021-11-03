const Discord = require("discord.js");
const Queue = require("./src/Queue");
const MessageHandler = require("./src/MessageHandler");
const CommandHandler = require("./src/CommandHandler");
const EmbedBuilder = require("./src/EmbedBuilder");

const config = require("./config.json");
const token = config.token;
const activities = config.activities;
const testGuild = config._test_guild;
const queue = new Queue();

const client = new Discord.Client({
    intents: [Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILDS],
    allowedMentions: {
        repliedUser: false,
    },
});

client.on("messageCreate", MessageHandler.messageCreate);

client.on("ready", async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    const clientIcon = client.user.avatar
        ? client.user.avatar
        : "https://cdn.discordapp.com/embed/avatars/0.png";

    EmbedBuilder.setDefault("footer", client.user.username);
    EmbedBuilder.setDefault("footerIcon", clientIcon);
    EmbedBuilder.setDefault("color", config.message_color);

    MessageHandler.init(queue);

    console.log("Registering commands...");
    await CommandHandler.registerCommands(client, testGuild);
    console.log("Commands registered");

    function newAct() {
        const randomIndex = Math.floor(Math.random() * (activities.length - 1) + 1);
        const newActivity = activities[randomIndex];

        client.user.setActivity(newActivity);
    }
    newAct();
    setInterval(() => {
        newAct();
    }, 60000 * 30);
});

queue.start();

console.log("Logging in...");
client.login(token);
