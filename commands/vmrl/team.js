const Discord = require('discord.js');
const {bot_colour} = require('../../config.json');

const acceptableDays = ['all', 'today', 'tomorrow', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

module.exports = {
    isSlash: true,
	name: 'team',
    description: "Gets a VRML team's information",
    options: [
      {
        type: 3,
        name: "name",
        description: "The name of the VRML team",
        default: false,
        required: true
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

    execute(interaction, args, client)
    {
        client.slashCMDs.DeferResponse({}, interaction);

        this.executeTeamName(interaction, args, client);
    },

    async executeTeamName(interaction, args, client)
    {
        let teamLink = null;
        const teamName = args.name;

        //get team link from storage if have it and use that
        const db_team = client.database.getTeam(teamName);
        if(db_team) teamLink = db_team.link;
        else
        {
            //otherwise get from standings page
            const teamInfo = await client.scraper.scrape_TeamInfo_standings(teamName)//this.scrapeTeamLink(body, teamName);
            if(teamInfo === null) {
                client.slashCMDs.EditResponse(
                    {
                        embeds: [new Discord.MessageEmbed().setDescription(`Couldn't find team **${teamName}**`).setColor('#d92121')]
                    }, interaction);
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
        client.slashCMDs.EditResponse({ embeds: [embed]}, interaction);
    }
};