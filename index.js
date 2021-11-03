const Discord = require("discord.js");
const Queue = require("./src/Queue");
const translate = require("@vitalets/google-translate-api");
const LanguageDetect = new (require("languagedetect"))();
const filter = new (require("bad-words"))({ placeHolder: "\\*" });

const config = require("./config.json");
const token = config.token;
const activities = config.activities;
const doNotTranslate = config.do_not_translate;
const targetLanguage = config.translate_to;
const messages = config.messages;
const icons = config.icons;
const queue = new Queue();
const displayNames = new Intl.DisplayNames(["en"], { type: "language" });
const displayNamesTargetLanguage = new Intl.DisplayNames([targetLanguage], { type: "language" });

const client = new Discord.Client({
    intents: [Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILDS],
    allowedMentions: {
        repliedUser: false,
    },
});

const defaultEmbed = {
    color: config.message_color,
    footer: {
        icon_url: "https://imgur.com/VOjELQf.png",
        text: "Could not get bot name",
    },
    description: "Somehow no message was set to this message 😦",
};
const errorEmbed = Object.assign({}, defaultEmbed);
errorEmbed.color = 15208739;

async function messageCreate(message) {
    if (message.author.bot || !message) return;

    const content = message.cleanContent;
    if (content.length < 6 || !content.includes(" ")) return;

    const detectedLanguages = LanguageDetect.detect(content, 1);
    if (
        detectedLanguages.length > 0 &&
        detectedLanguages[0].length > 0 &&
        doNotTranslate.includes(detectedLanguages[0][0])
    )
        return;

    try {
        console.log("[Message " + message.id + "] Added to queue");

        const translatingMessage = Object.assign({}, defaultEmbed);
        translatingMessage.description = null;
        translatingMessage["author"] = {
            icon_url: icons.translating,
            name: messages.translating,
        };
        const reply = message.reply(
            { embeds: [translatingMessage] },
            { allowedMentions: { repliedUser: false } }
        );

        queue.add(async () => {
            console.log("[Message " + message.id + "] Getting translated...");
            const res = await translate(content, { to: targetLanguage });

            await reply.then(async (replyMessage) => {
                if (
                    doNotTranslate.includes(displayNames.of(res.from.language.iso).toLowerCase()) ||
                    res.text.toLocaleLowerCase() == content.toLocaleLowerCase()
                ) {
                    await replyMessage.delete();
                    return;
                }

                const word = filter.clean(res.text);
                if (word.replace(/\\\*/g, "").trim().length < 1) {
                    await replyMessage.delete();
                    return;
                }

                const translatedMessage = JSON.parse(JSON.stringify(defaultEmbed));
                translatedMessage.description = word;
                translatedMessage.footer.text +=
                    " — " +
                    displayNamesTargetLanguage.of(res.from.language.iso) +
                    " › " +
                    displayNamesTargetLanguage.of(targetLanguage);
                await replyMessage.edit(
                    { embeds: [translatedMessage] },
                    { allowedMentions: { repliedUser: false } }
                );
                console.log(
                    "[Message " +
                        message.id +
                        "] Successfully translated from " +
                        displayNames.of(res.from.language.iso)
                );
                //await message.lineReplyNoMention(word);
            });
        });
    } catch (err) {
        console.error(err);
        const errorMessage = Object.assign({}, errorEmbed);
        errorMessage.description = null;
        errorMessage["author"] = {
            icon_url: icons.translating,
            name: messages.translating,
        };
        message.reply(
            { embeds: [errorMessage] },
            {
                allowedMentions: { repliedUser: false },
            }
        );
        queue.timeout(1000 * 60);
    }
}

client.on("messageCreate", messageCreate);

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);

    const image = client.user.avatar
        ? client.user.avatar
        : "https://cdn.discordapp.com/embed/avatars/0.png";
    defaultEmbed.footer.text = client.user.username;
    defaultEmbed.footer.icon_url = image;
    errorEmbed.footer.text = client.user.username;
    errorEmbed.footer.icon_url = image;

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
