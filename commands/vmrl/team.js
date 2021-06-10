const Discord = require('discord.js');
const {bot_colour} = require('../../config.json');
const {ranks, divisions} = require('../../emojis.json');


module.exports = {
    global: true,
	name: 'team',
    description: "Gets a VRML team's information",
    options: [
      {
            type: 3,
            name: "name",
            description: "The name of the VRML team",
            required: true
      }
    ],

    createTeamEmbed(team, client) {

        const embed = new Discord.MessageEmbed();

        const divisionEmoji = client.emojis.cache.get(divisions[team.division.toLowerCase()]);

        embed.setTitle(team.name);
        embed.setDescription(`**Division:** ${divisionEmoji} | **MMR:** ${team.mmr}`);
        embed.setURL(`https://vrmasterleague.com${team.page_link}`);
        embed.setThumbnail(`https://vrmasterleague.com${team.logo}`);
        embed.setColor(bot_colour);

        const indent = '   ';

        //members
        let playersText = '';
        for (let mi = 0; mi < team.members.length; mi++) {
            const player = team.members[mi];

            //location flag emoji
            let flagEmoji = '';
            if(player.location !== undefined) flagEmoji = `:flag_${player.location.toLowerCase()}:`;

            //rank emoji
            const rankEmoji = client.emojis.cache.get(ranks[player.rank.toLowerCase()]);

            playersText += `${indent}${rankEmoji} [${player.name}](https://vrmasterleague.com${player.link}) ${flagEmoji}\n`;
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

        //get team by teamName
        this.executeByName(interaction, args, client);
    },

    async executeByName(interaction, args, client)
    {
        let teamLink = null;
        const teamName = args.name;

        //get team link from storage if have it and use that
        const db_team = await client.database.getTeam(teamName);
        if(db_team) teamLink = db_team.link;
        else
        {
            //otherwise get from standings page
            const teamInfo = await client.scraper.scrape_TeamInfo_standings(teamName);
            if(teamInfo === null) {
                client.slashCMDs.EditResponse(
                    {
                        embeds: [new Discord.MessageEmbed().setDescription(`Couldn't find team **${teamName}**`).setColor('#d92121')]
                    }, interaction);
                return;
            }

            teamLink = teamInfo.link;
        }

        console.log(`teamLink: ${teamLink}`);
        //get team data from team page
        const team = await client.scraper.scrape_TeamData_team(teamLink, client.database);

        //add to database if doesnt exist
        //let teamData = await client.database.getTeam(team.name);
        if (!db_team)
        {
            teamData = {
                name: team.name,
                link: team.page_link,
                discord: team.discord_link,
                members: team.members
            };
            client.database.addTeam(teamData);
        }

        //send reply with team data
        const embed = this.createTeamEmbed(team, client);
        client.slashCMDs.EditResponse({ embeds: [embed]}, interaction);
    }
}