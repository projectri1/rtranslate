const Discord = require('discord.js');
require('discord-reply');
const {StringUtils} = require('turbocommons-ts');
const client = new Discord.Client();
const translate = require('@vitalets/google-translate-api');
const LanguageDetect = new (require('languagedetect'))();

//config
const prefix = '?'; // just an example, change to whatever you want
const token = "your_token"
const activities = [
    "with translated stuff",
    "with languages",
    "with 1s and 0s"
];
const similaritypurcentage = 90; // if translation is 90% similar, don't send.


//onready
client.on('ready', () => {
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
const filter = new (require('bad-words'))({ placeHolder: "\\*" });

var q = [];

var runner

function starter() {
    runner = setInterval(() => {
        if (q.length > 0) {
            q[0]();
            q.shift();
        }
    }, 500);
}
starter();
client.on('message', message => {
    if (message.author.bot) return;
    if (message) {
        const mess = message.cleanContent;
        if (mess.length < 6 || !mess.includes(' ')) {
            return;
        } else if (!mess.startsWith(prefix)) {


            const L = LanguageDetect.detect(mess, 1);
            console.log(L);
            if (L.length > 0 && L[0].length > 0 && L[0][0] == 'english') return;
            q.push(() => {
                translate(mess, { to: "en" }).then(res => {
                    if (res.from.language.iso == "en" || res.text.toLocaleLowerCase() == mess.toLocaleLowerCase()) return;
                    if (StringUtils.compareSimilarityPercent(res.text.toLocaleLowerCase(), mess.toLocaleLowerCase()) >= similaritypurcentage) return;
                    const word = filter.clean(res.text)
                    if (word.replace(/\\\*/g, "").trim().length < 1) return;
                    message.lineReplyNoMention(word); // OUTPUT: You are amazing!
                }).catch(err => {
                    console.error(err);
                    message.lineReplyNoMention("Transactional limit reached. Translate will be down for a minute"); // OUTPUT: You are amazing!
                    clearInterval(runner)
                    setTimeout(starter, 1000 * 60);
                });
            })

        } else {
            const args = mess.trim().split(/ +/g);
            const cmd = args[0].slice(prefix.length).toLowerCase(); // case INsensitive, without prefix
            args.shift();
            if (cmd == 'info') {
                return message.lineReplyNoMention('Github repo : https://github.com/ri1ongithub/rtranslate/');
            }
            if (cmd == 'help') {
                return message.lineReplyNoMention(
                    prefix + 'help: For this menu\n' +
                    prefix + 'info: For info about the creator\n' +
                    prefix + 'detect: Let me see if I can determine this strange set of data?\n'+
                    prefix + "[language code]: to have me translate your text into that language"
                );
            }
            if (cmd == 'detect') {
                const r = LanguageDetect.detect(args.join(' '), 5);
                var res = "Let's see what I think it is\n```\n";

                r.forEach(L => {
                    res += L[0] + ":" + Math.round(L[1] * 100.0) + "%\n"
                })
                res += "```"
                return message.lineReplyNoMention(res);
            }
            const output = mess.replace(prefix + cmd, '');
            translate(output, { to: cmd }).then(res => {
                message.lineReplyNoMention(filter.clean(res.text)); // OUTPUT: You are amazing!
            }).catch(err => {
                console.error(err);
            });
        }
    }
});



client.login(token);
