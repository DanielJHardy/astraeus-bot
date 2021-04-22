const Discord = require('discord.js');

const {bot_colour} = require('../../config.json');
const divisions = ['master', 'diamond', 'gold', 'silver', 'bronze'];

const DEFAULT_NUM_STANDINGS = 10;

module.exports = {
	name: 'standings',
    aliases: ['ladder'],
    usages: [
        {
            syntax: '<>',
            description: 'Displays the top 10 teams in OCE.',
            args: []
        },
        {
            syntax: '<number>',
            description: 'Displays the top **n** teams, where **n** is the amount of teams to display.',
            args: [{ name: '<number>', description: 'The number of teams to display.'}]
        },
        {
            syntax: '<divison>',
            description: 'Displays the teams of a divison.',
            args: [{name: '<division>', description: 'The division of the teams to display.', values: divisions}]
        }
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

    async executeTopN(message, amount)
    {
        const client = message.client;

        //scrape ladder
        let ladder = await client.scraper.scrape_Ladder_standings();

        //filter list to only include the first <amount> teams
        ladder = ladder.slice(0,amount);

        //create message/embed
        const embed = this.createLadderEmbed(ladder, 'top');
        //reply
        message.channel.send(embed);
        message.channel.stopTyping();
    },

    async executeDivision(message, division)  
    {
        const client = message.client;

        //scrape ladder
        let ladder = await client.scraper.scrape_Ladder_standings();

        //filter list to only include teams in <division>
        ladder = ladder.filter(row => row.division.toLowerCase() == division);

        //create message/embed
        const embed = this.createLadderEmbed(ladder, 'division');
        //reply
        message.channel.send(embed);
        message.channel.stopTyping();
    },

	execute(message, args) {

        message.channel.startTyping();

        //Default Top 10
        if(!args[0]) return this.executeTopN(message, DEFAULT_NUM_STANDINGS);
        
        //Top N
        const n = parseInt(args[0]);
        if(Number.isInteger(n)) return this.executeTopN(message, n);

        //division
        if(divisions.includes(args[0].toLowerCase())) return this.executeDivision(message, args[0].toLowerCase())

        //not a command usage
        message.reply(`That isn't an acceptable argument for that command. Use the **help** command to see usage information.`);
        message.channel.stopTyping();
    }
};