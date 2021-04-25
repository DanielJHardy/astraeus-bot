const Discord = require('discord.js');

const {bot_colour} = require('../../config.json');
const divisions = ['master', 'diamond', 'gold', 'silver', 'bronze'];

const DEFAULT_NUM_STANDINGS = 10;

module.exports = {
    isSlash: true,
	name: 'standings',
    description: "Displays the OCE standings",
    options: [
      {
        type: 1,
        name: "Top",
        description: "Displays the Top teams",
        options: [
            {
                "name": "Amount",
                "description": "Amount of teams to include",
                "type": 4,
                "required": false,
            },
        ]
      },
      {
        type: 1,
        name: "Division",
        description: "Gets all the teams in a division",
        options: [
            {
                "name": "tier",
                "description": "The division to get",
                "type": 3,
                "required": true,
                "choices": [
                    {
                        "name": "Master",
                        "value": "master"
                    },
                    {
                        "name": "Diamond",
                        "value": "diamond"
                    },
                    {
                        "name": "Gold",
                        "value": "gold"
                    },
                    {
                        "name": "Silver",
                        "value": "silver"
                    },
                    {
                        "name": "Bronze",
                        "value": "bronze"
                    }
                ]
            },
        ]
      },
    ],

    createLadderEmbed(ladder, mode)
    {
        const embed = new Discord.MessageEmbed();
        const standings = 'https://vrmasterleague.com/EchoArena/Standings/2NluW_UsAmhquDWQX-CfFg2';
        const VRMLdomain = 'https://vrmasterleague.com/';

        //set title depending on mode
        if(mode == 'division') embed.setTitle(`OCE Standings - ${ladder[0].division}`);
        else embed.setTitle(`OCE Standings - Top ${ladder.length}`);
        embed.setURL(standings);
        embed.setColor(bot_colour);

        //generate rows
        let col_team = [''], col_division = [''], col_mmr = [''];
        for (let index = 0; index < ladder.length; index++) {
            const row = ladder[index];

            const colIndex = ~~(index / 10); // go up 1 every 10 rows

            if(col_team[colIndex] === undefined) //init new array elements
            {
                col_team[colIndex] = '';
                col_division[colIndex] = '';
                col_mmr[colIndex] = '';
            }
            
            //add rows
            col_team[colIndex] += `**${row.position} |** [${row.teamName}](${VRMLdomain+row.teamLink})\n`;
            col_division[colIndex] += `${row.division}\n`;
            col_mmr[colIndex] += `${row.mmr}\n`;
        }

        //add initial fields
        embed.addField('Pos | Team', col_team[0], true);
        embed.addField('Division', col_division[0], true);
        embed.addField('MMR', col_mmr[0], true);

        //add additional fields if needed
        for (let index = 1; index < col_team.length; index++) {

            embed.addField('\u200b', col_team[index], true);
            embed.addField('\u200b', col_division[index], true);
            embed.addField('\u200b', col_mmr[index], true);
        }

        return embed;
    },

    async executeTopN(interaction, amount, client)
    {
        //scrape ladder
        let ladder = await client.scraper.scrape_Ladder_standings();

        //filter list to only include the first <amount> teams
        ladder = ladder.slice(0,amount);

        //create message/embed and reply
        const embed = this.createLadderEmbed(ladder, 'top');
        client.slashCMDs.EditResponse({ embeds: [embed]}, interaction);
    },

    async executeDivision(interaction, division, client)  
    {
        //scrape ladder
        let ladder = await client.scraper.scrape_Ladder_standings();

        //filter list to only include teams in <division>
        ladder = ladder.filter(row => row.division.toLowerCase() == division);

        //create message/embed and reply
        const embed = this.createLadderEmbed(ladder, 'division');
        client.slashCMDs.EditResponse({ embeds: [embed]}, interaction);
    },

	execute(interaction, args, client) {

        client.slashCMDs.DeferResponse({}, interaction);

        if(args.top) //top sub-command
        {
            if(args.top.amount) //amount specified
            {
                this.executeTopN(interaction, args.top.amount, client);
            }
            else{   //default amount
                this.executeTopN(interaction, DEFAULT_NUM_STANDINGS, client);
            }
        }
        else if(args.division) //division sub-command
        {
            this.executeDivision(interaction, args.division.tier, client)
        }
    }
};