const Discord = require("discord.js");
const translate = require("@vitalets/google-translate-api");
const Queue = require("./src/queue");

const LanguageDetect = new (require("languagedetect"))();
const filter = new (require("bad-words"))({ placeHolder: "\\*" });

const config = require("./config.json");
const token = config.token;
const prefix = config.prefix;
const activities = config.activities;
const client = new Discord.Client({
    intents: [Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILDS],
});
const queue = new Queue();

/**
 *
 * @param {Discord.Message} message The message to be translated
 * @param {string} content The parsed message content
 */
function translateMessage(message, content) {
    queue.add(async () => {
        try {
            console.log("[Message " + message.id + "] Message is being translated...");

            const reply = message.reply("⌛ Translating...");
            const res = await translate(content, { to: "en" });

            if (
                res.from.language.iso == "en" ||
                res.text.toLocaleLowerCase() == content.toLocaleLowerCase()
            )
                return;

            const word = filter.clean(res.text);
            if (word.replace(/\\\*/g, "").trim().length < 1) return;

            await reply.then(async (replyMessage) => {
                await replyMessage.edit(word);
                console.log("[Message " + message.id + "] Successfully translated message");
                //await message.lineReplyNoMention(word);
            });
        } catch (err) {
            console.error(err);
            message.lineReplyNoMention(
                "Transactional limit reached. Translate will be down for a minute"
            );
            queue.timeout(1000 * 60);
        }
    });
}

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);

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

queue.start();
client.login(token);
