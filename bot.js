const Discord = require('discord.js');
const fs = require('fs');
const dotenv = require('dotenv').config();
const http = require('http');

const Database = require('./database/database.js');
const VRMLscraper = require('./utility/vrmlscraper');
const SlashCommandsHandler = require('./utility/slashcommandshandler');

//create http server. just so that it works on heroku??
http.createServer().listen(3000);

// create a new Discord client
const client = new Discord.Client();

//load config variables
const { prefix, homeGuild } = require('./config.json');
client.prefix = prefix;
client.homeGuildID = homeGuild;

//load events
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args, client));
	} else if (event.ws) {
		client.ws.on(event.name, async (interaction) => event.execute(interaction, client));
	} else {
		client.on(event.name, (...args) => event.execute(...args, client));
	}
}

//log errors instead of crashing
client.on('error', (error) => console.error(error));

//load commands
client.commands = new Discord.Collection();
const commandFolders = fs.readdirSync('./commands');

for (const folder of commandFolders) {
	const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const command = require(`./commands/${folder}/${file}`);
		client.commands.set(command.name, command);
	}
}

//setup "database"
client.database = new Database();

//setup scraper
client.scraper = new VRMLscraper();

//setup slash commands handler
client.slashCMDs = new SlashCommandsHandler(client);


// login to Discord with your app's token
client.login(process.env.TOKEN);