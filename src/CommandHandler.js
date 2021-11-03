const Discord = require("discord.js");
const EmbedBuilder = require("./EmbedBuilder");
const config = require("../config.json");
const LanguageDetect = new (require("languagedetect"))();
const translate = require("@vitalets/google-translate-api");
const displayNamesTargetLanguage = new Intl.DisplayNames([config.translate_to], {
    type: "language",
});

const commands = {
    info: {
        description: "Get information about the bot.",
        /**
         * @param {Discord.CommandInteraction} interaction
         */
        executor: async (interaction) => {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder.MessageBuilder(
                        null,
                        config.icons.info,
                        "Thanks you ri1_ for the code used in the translate bot!"
                    ).build(),
                ],
                ephemeral: true,
            });
        },
    },
    help: {
        description: "Help for this bots commands.",
        /**
         * @param {Discord.CommandInteraction} interaction
         */
        executor: async (interaction) => {
            const help = new EmbedBuilder.MessageBuilder(null, config.icons.info, "Help");

            for (let commandName in commands) {
                let command = commands[commandName];

                help.addField("/" + commandName, command.description);
            }

            await interaction.reply({
                embeds: [help.build()],
                ephemeral: true,
            });
        },
    },
    detect: {
        description: "Detect a language.",
        options: [
            {
                name: "text",
                description: "The text that should be detected",
                required: true,
                type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
            },
        ],
        /**
         * @param {Discord.CommandInteraction} interaction
         */
        executor: async (interaction) => {
            const text = interaction.options.getString("text");
            const detection = LanguageDetect.detect(text, 5);

            const embed = new EmbedBuilder.MessageBuilder(
                null,
                config.icons.info,
                "Let's see what I think it is"
            );
            for (let lang of detection) {
                embed.addField(lang[0], Math.round(lang[1] * 100.0) + "%", true);
            }

            await interaction.reply({
                embeds: [embed.build()],
                ephemeral: true,
            });
        },
    },
    translate: {
        description: "Translate to the specified language.",
        options: [
            {
                name: "language",
                description: "The language code of the target language (for example: en, de, nl)",
                required: true,
                type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
            },
            {
                name: "text",
                description: "The text that should be translated.",
                required: true,
                type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
            },
        ],
        /**
         * @param {Discord.CommandInteraction} interaction
         */
        executor: async (interaction) => {
            const targetLang = interaction.options.getString("language");
            const text = interaction.options.getString("text");

            await interaction.deferReply();

            /**
             * @type {translate.ITranslateResponse}
             */
            let res;
            try {
                res = await translate(text, { to: targetLang });
            } catch (err) {
                await interaction.editReply({
                    embeds: [EmbedBuilder.errorMessage(err.message)],
                    ephemeral: true,
                });
                return;
            }
            await interaction.editReply({
                embeds: [
                    EmbedBuilder.translatedMessage(
                        res.text,
                        displayNamesTargetLanguage.of(res.from.language.iso),
                        displayNamesTargetLanguage.of(targetLang)
                    ),
                ],
            });
        },
    },
};

/**
 * Executed when Discord user has interaction with bot
 * @param {Discord.Interaction} interaction The interaction that was made
 */
async function interactionCreate(interaction) {
    if (!interaction.isCommand()) return;
    if (!commands[interaction.commandName]) return;

    console.log("[Command " + interaction.commandName + "/" + interaction.id + "] Executing...");
    await commands[interaction.commandName].executor(interaction);
    console.log("[Command " + interaction.commandName + "/" + interaction.id + "] Executed");
}

module.exports = {
    /**
     * Register all commands
     * @param {Discord.Client} client The Discord.js client
     * @param {number} [testGuild] Specify this if you want to test commands on a guild and not apply globally
     */
    async registerCommands(client, testGuild) {
        const guild = testGuild ? client.guilds.cache.get(testGuild) : null;
        let commandRegistrator;

        if (guild) {
            commandRegistrator = guild.commands;
        } else {
            commandRegistrator = client.application.commands;
        }

        for (let commandName in commands) {
            let command = commands[commandName];

            await commandRegistrator.create({
                name: commandName,
                description: command.description,
                options: command.options,
            });
        }

        client.on("interactionCreate", interactionCreate);
    },
};
