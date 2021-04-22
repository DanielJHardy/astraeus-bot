const Discord = require('discord.js');
const fs = require('fs');
const dotenv = require('dotenv').config();

const Database = require('./database/database.js');
const VRMLscraper = require('./utility/vrmlscraper');

// create a new Discord client
const client = new Discord.Client();

//load config variables
const { prefix } = require('./config.json');
client.prefix = prefix;

//load events
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args, client));
	} else {
		client.on(event.name, (...args) => event.execute(...args, client));
	}
}

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

// login to Discord with your app's token
client.login(process.env.TOKEN);