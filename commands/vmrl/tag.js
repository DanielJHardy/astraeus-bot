const Discord = require('discord.js');
const { bot_colour } = require('../../config.json');
const { ranks, divisions } = require('../../emojis.json');


module.exports = {
    global: true,
    name: 'tag',
    description: "Use to ping all members of a VRML team",
    options: [
        {
            type: 3,
            name: "team",
            description: "The name of the VRML team",
            required: true
        },
        {
            type: 3,
            name: "message",
            description: "A message to display along with the ping",
            required: false
        }
    ],

    createTagMessage(players, message, client, interaction, team) {

        let content = `<@${interaction.member.user.id}> tagged **${team}**: (`;

        const guild = client.guilds.cache.get(interaction.guild_id);

        for (let i = 0; i < players.length; i++) {
            const player = players[i];

            console.log(player.discordTag);
            //const playerDiscordID = client.users.cache.find(u => u.tag === player.discordTag).id;
            const member = guild.members.cache.find(m => m.user.tag === player.discordTag);
            if(!member)
            {
                content += `\`${player.discordTag}\` `;
                continue;
            }

            const playerDiscordID = member.user.id;
            
            content += `<@${playerDiscordID}> `;
        }

        if(message) content += `)\n\n${message}`;
        else content += `)`;

        return content;
    },

    execute(interaction, args, client) {
        client.slashCMDs.Respond({content: `Pinging: **${args.team}**\nThis could take awhile`, flags: 64}, interaction);

        //get team by teamName
        this.executeByTeam(interaction, args, client);
    },

    async executeByTeam(interaction, args, client) {
        let teamLink = null;
        const teamName = args.team;

        //get team link from storage if have it and use that
        const db_team = await client.database.getTeam(teamName);
        if (db_team) teamLink = db_team.link;
        else {
            //otherwise get from standings page
            const teamInfo = await client.scraper.scrape_TeamInfo_standings(teamName);
            if (teamInfo === null) {
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
        if (!db_team) {
            teamData = {
                name: team.name,
                link: team.page_link,
                discord: team.discord_link,
                members: team.members
            };
            client.database.addTeam(teamData);
        }

        //send reply with team data
        const embed = this.createTagMessage(team.members, args.message, client, interaction, team.name);
        client.slashCMDs.Followup({ content: embed }, interaction);
    }
}