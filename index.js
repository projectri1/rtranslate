const Discord = require('discord.js');
require('discord-reply'); //⚠️ IMPORTANT: put this before your discord.Client()
const client = new Discord.Client();
const translate = require('@iamtraction/google-translate');
const prefix = '?'; // just an example, change to whatever you want
const token = "your token"; //replace your token with your real token (discord.dev)

const activities = [
	"with translated stuff",
	"with languages",
	"with 1s and 0s"
];

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

client.on('message', message => {
	if (message.author.bot) return;
	if (message) {
		const mess = message.cleanContent;

		if (!mess.startsWith(prefix)) {
			translate(mess, { to: "en" }).then(res => {
				if (res.from.language.iso == "en") return;
				const word = filter.clean(res.text)
				if (word.replace(/\\\*/g, "").trim().length < 1) return;
				message.lineReplyNoMention(word); // OUTPUT: You are amazing!
			}).catch(err => {
				console.error(err);
			});
		} else {
			const args = mess.trim().split(/ +/g);
			const cmd = args[0].slice(prefix.length).toLowerCase(); // case INsensitive, without prefix

			if (cmd == 'info') {
				return message.lineReplyNoMention('Thanks you ri1_ for the code used in the translate bot!');
			}
			if (cmd == 'help') {
				return message.lineReplyNoMention(
					prefix + 'help: For this menu\n' +
					prefix + 'info: For info about the creator\n' +
					prefix + "[language code]: to have me translate your text into that language"
				);
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

