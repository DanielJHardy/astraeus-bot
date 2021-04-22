const request = require('request');
const cheerio = require('cheerio');
const Discord = require('discord.js');
const {bot_colour} = require('../../config.json');
const { executeTeam } = require('./matches');

const acceptableDays = ['all', 'today', 'tomorrow', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

module.exports = {
	name: 'team',
    usages: [
        {
            syntax: '<name>',
            description: `Gets a VRML team's information`,
            args: [{ name: '<name>', description: 'The name of the VRML team'}]
        }
    ],

    createTeamEmbed(team) {

        const embed = new Discord.MessageEmbed();

        embed.setTitle(team.name);
        embed.setDescription(`**Division:** ${team.division} | **MMR:** ${team.mmr}`);
        embed.setURL(`https://vrmasterleague.com${team.page_link}`);
        embed.setThumbnail(`https://vrmasterleague.com${team.logo}`);
        embed.setColor(bot_colour);

        const indent = '   ';

        //members
        let playersText = '';
        for (let mi = 0; mi < team.members.length; mi++) {
            const player = team.members[mi];

            let flagEmoji = '';
            if(player.location !== undefined) flagEmoji = `:flag_${player.location.toLowerCase()}:`;

            playersText += `${indent}*[${player.rank}]* [${player.name}](https://vrmasterleague.com${player.link}) ${flagEmoji}\n`;
        }
        embed.addField('Members:', playersText);

        //stats
        embed.addField('Team Stats:',`${indent}*Games Played:* **${team.stats.games}**\n` +
            `${indent}*Games Won:* **${team.stats.wins}**\n` +
            `${indent}*Games Lossed:* **${team.stats.losses}**\n` +
            `${indent}*Winrate:* **${(team.stats.wins / team.stats.games).toFixed(2)}**\n` +
            `${indent}*Points Scored:* **${team.stats.points}**`);

        //discord
        if(team.discord_link) embed.addField('\u200b', `[Join the Team Discord](${team.discord_link})`);

        return embed;
    },

    async executeTeamName(message, args)
    {
        const teamName = args.join(' '); //combine arguments to form team name
        const client = message.client;
        let teamLink = null;

        //get team link from storage if have it and use that
        const db_team = client.database.getTeam(teamName);
        if(db_team) teamLink = db_team.link;
        else
        {
            //otherwise get from standings page
            const teamInfo = await client.scraper.scrape_TeamInfo_standings(teamName)//this.scrapeTeamLink(body, teamName);
            if(teamInfo === null) {
                message.reply(`Could not find a team with that name.`);// team doesn't exist
                message.channel.stopTyping();
                return;
            }

            teamLink = teamInfo.link;
        }

        //get team data from team page
        const team = await client.scraper.scrape_TeamData_team(teamLink);

        //add to database if doesnt exist
        let teamData = client.database.getTeam(team.name);
        if (!teamData)
        {
            teamData = {
                name: team.name,
                link: team.page_link,
                discord: team.discord_link
            };
            client.database.addTeam(teamData);
        }

        //send reply with team data
        const embed = this.createTeamEmbed(team);
        message.channel.send(embed);
        message.channel.stopTyping();
    },

	execute(message, args) {
		
        //const standings = 'https://vrmasterleague.com/EchoArena/Standings/2NluW_UsAmhquDWQX-CfFg2';
        const client = message.client;

        //make sure a team name is included
        if(!args[0]) return message.reply(`Missing team identifier. Usage: ${client.prefix}${this.name} ${this.usages[0].syntax}`);

        //provide feedback to the user that the command is processing
        message.channel.startTyping()

        // execute teamname version
        this.executeTeamName(message, args);
	},
};