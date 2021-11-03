const config = require("../config.json");
const messageColor = config.message_color;
const messages = config.messages;
const icons = config.icons;

const defaults = {
    color: null,
    icon: null,
    title: null,
    content: null,
    footer: null,
    footerIcon: null,
};

/**
 * Set some default embed values
 * @param {"color" | "icon" | "title" | "content" | "footer" | "footerIcon"} property The property name
 * @param {any} value The value that fits to that property
 */
module.exports.setDefault = (property, value) => {
    defaults[property] = value;
};

module.exports.MessageBuilder = class MessageBuilder {
    /**
     * Create a new embed
     * @param {number} color Color of the embed
     * @param {string} icon URL of the embed author icon
     * @param {string} title Name of the embed author
     * @param {string} content Description of the embed
     * @param {string} footer Text of the embed footer
     * @param {string} footerIcon URL of the embed footer
     */
    constructor(color, icon, title, content, footer, footerIcon) {
        this.color = color;
        this.icon = icon;
        this.title = title;
        this.content = content;
        this.footer = footer;
        this.footerIcon = footerIcon;
        this.fields = [];
    }

    /**
     * Add a field to the embed
     * @param {string} name The field name
     * @param {any} value The field value
     * @param {boolean} [inline] If it should be inline
     */
    addField(name, value, inline = false) {
        this.fields.push({ name: name, value: value, inline: inline });
    }

    /**
     * Build the embed
     * @returns {object} Returns the embed object
     */
    build() {
        return {
            color: this.color ? this.color : defaults.color,
            author: {
                icon_url: this.icon ? this.icon : defaults.icon,
                name: this.title ? this.title : defaults.title,
            },
            description: this.content,
            footer: {
                icon_url: this.footerIcon ? this.footerIcon : defaults.footerIcon,
                text: this.footer ? defaults.footer + " — " + this.footer : defaults.footer,
            },
            fields: this.fields,
        };
    }
};

/**
 * Returns a loading message embed
 * @returns {object} Returns the embed object
 */
module.exports.loadingMessage = () => {
    return new this.MessageBuilder(messageColor, icons.translating, messages.translating).build();
};

/**
 * Returns a translated message embed
 * @param {string} translatedText The translated text
 * @param {string} sourceLanguage The source language
 * @param {string} targetLanguage The target language
 * @returns {object} Returns the embed object
 */
module.exports.translatedMessage = (translatedText, sourceLanguage, targetLanguage) => {
    return new this.MessageBuilder(
        messageColor,
        null,
        null,
        translatedText,
        sourceLanguage + " › " + targetLanguage
    ).build();
};

/**
 * Returns a limit reached message embed
 * @returns {object} Returns the embed object
 */
module.exports.errorMessage = (errorMessage) => {
    return new this.MessageBuilder(
        15208739,
        icons.limit_reached,
        errorMessage ? errorMessage : messages.limit_reached
    ).build();
};
