const Discord = require("discord.js");
const Queue = require("./src/Queue");
const MessageHandler = require("./src/MessageHandler");
const CommandHandler = require("./src/CommandHandler");
const EmbedBuilder = require("./src/EmbedBuilder");

const config = require("./config.json");
const token = config.token;
const activities = config.activities;
const queue = new Queue();

const client = new Discord.Client({
    intents: [Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILDS],
    allowedMentions: {
        repliedUser: false,
    },
});

client.on("messageCreate", MessageHandler.messageCreate);

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);

    MessageHandler.init(queue);

    const clientIcon = client.user.avatar
        ? client.user.avatar
        : "https://cdn.discordapp.com/embed/avatars/0.png";

    EmbedBuilder.setDefault("footer", client.user.username);
    EmbedBuilder.setDefault("footerIcon", clientIcon);

    function newAct() {
        // generate random number between 1 and list length.

        const randomIndex = Math.floor(Math.random() * (activities.length - 1) + 1);
        const newActivity = activities[randomIndex];

        client.user.setActivity(newActivity);
    }
    newAct();
    setInterval(() => {
        newAct();
    }, 60000 * 30);
});

/*
    client.on("messageCreate", (message) => {
        if (message.author.bot || message.author.id == client.user.id || !message) return;

        const mess = message.cleanContent;

        if (mess.length < 6 || !mess.includes(" ")) {
            return;
        } else if (!mess.startsWith(prefix)) {
            const L = LanguageDetect.detect(mess, 1);

            if (L.length > 0 && L[0].length > 0 && L[0][0] == "english") return;

            // Translate message
            translateMessage(message, mess);
        } else {
            const args = mess.trim().split(/ +/g);
            const cmd = args[0].slice(prefix.length).toLowerCase(); // case INsensitive, without prefix
            args.shift();
            if (cmd == "info") {
                return message.lineReplyNoMention(
                    "Thanks you ri1_ for the code used in the translate bot!"
                );
            }
            if (cmd == "help") {
                return message.lineReplyNoMention(
                    prefix +
                        "help: For this menu\n" +
                        prefix +
                        "info: For info about the creator\n" +
                        prefix +
                        "detect: Let me see if I can determine this strange set of data?\n" +
                        prefix +
                        "[language code]: to have me translate your text into that language"
                );
            }
            if (cmd == "detect") {
                const r = LanguageDetect.detect(args.join(" "), 5);
                var res = "Let's see what I think it is\n```\n";

                r.forEach((L) => {
                    res += L[0] + ":" + Math.round(L[1] * 100.0) + "%\n";
                });
                res += "```";
                return message.lineReplyNoMention(res);
            }
            const output = mess.replace(prefix + cmd, "");
            translate(output, { to: cmd })
                .then((res) => {
                    message.lineReplyNoMention(filter.clean(res.text)); // OUTPUT: You are amazing!
                })
                .catch((err) => {
                    console.error(err);
                });
        }
    });
*/

queue.start();
client.login(token);
