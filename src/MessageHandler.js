const translate = require("@vitalets/google-translate-api");
const config = require("../config.json");
const Queue = require("./Queue");
const EmbedBuilder = require("./EmbedBuilder");
const doNotTranslate = config.do_not_translate;
const targetLanguage = config.translate_to;
const LanguageDetect = new (require("languagedetect"))();
const filter = new (require("bad-words"))({ placeHolder: "\\*" });

const displayNames = new Intl.DisplayNames(["en"], { type: "language" });
const displayNamesTargetLanguage = new Intl.DisplayNames([targetLanguage], { type: "language" });

/**
 * @type {Queue} This is the queue
 */
var queue = null;

module.exports = {
    /**
     * Init the MessageHandler
     * @param {Queue} _queue The queue
     */
    init(_queue) {
        queue = _queue;
    },

    async messageCreate(message) {
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

            const translatingMessage = EmbedBuilder.loadingMessage();
            const reply = message.reply({ embeds: [translatingMessage] });

            queue.add(async () => {
                console.log("[Message " + message.id + "] Getting translated...");
                const res = await translate(content, { to: targetLanguage });

                await reply.then(async (replyMessage) => {
                    if (
                        doNotTranslate.includes(
                            displayNames.of(res.from.language.iso).toLowerCase()
                        ) ||
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

                    const translatedMessage = EmbedBuilder.translatedMessage(
                        word,
                        displayNamesTargetLanguage.of(res.from.language.iso),
                        displayNamesTargetLanguage.of(targetLanguage)
                    );
                    await replyMessage.edit({ embeds: [translatedMessage] });
                    console.log(
                        "[Message " +
                            message.id +
                            "] Successfully translated from " +
                            displayNames.of(res.from.language.iso)
                    );
                });
            });
        } catch (err) {
            console.error(err);

            const errorMessage = EmbedBuilder.errorMessage();
            message.reply({ embeds: [errorMessage] });

            queue.timeout(1000 * 60);
        }
    },
};
