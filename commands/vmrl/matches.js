const Discord = require('discord.js');

const acceptableDays = ['all', 'today', 'tomorrow', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

module.exports = {
	name: 'matches',
    aliases: ['games'],
    usages: [
        {
            syntax: '<>',
            description: `Displays a list of today's VRML matches`,
            args: []
        },
        {
            syntax: '<day>',
            description: 'Displays list of VRML matches for a given day',
            args: [{ name: '<day>', description: 'The day you want matches from.', values: acceptableDays}]
        },
        {
            syntax: '<team>',
            description: `Displays this week's VRML matches of a team`,
            args: [{ name: '<team>', description: 'Name of the team'}]
        },
    ],

    getTime(match) {
        const whenDate = match.when; //DATE
        const when = whenDate.toString();
        const day = when.substring(0,3);

        if(day === 'Inv') return 'TBD'; // if time is invalid it hasnt been set yet

        let timeFormatted = '';
        timeFormatted += `${day}, `;

        //get hour
        timeFormatted += whenDate.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
        return timeFormatted;
    },

    createMatchesEmbed(matches, day, team = null) {
        const embed = new Discord.MessageEmbed();

        const address = 'https://vrmasterleague.com/EchoArena/Matches/2NluW_UsAmhquDWQX-CfFg2'

        if(day) {
            if(day === 'all') {
                if(team) embed.setTitle(`${team}'s Matches`);
                else embed.setTitle(`OCE Matches`);
            }
            else embed.setTitle(`${day.charAt(0).toUpperCase() + day.slice(1)}'s OCE Matches`);
        }
        else embed.setTitle(`Today's OCE Matches`);

        embed.setDescription(`[View the VRML matches page](${address})`);
        embed.setColor('#6be1ff');
        embed.setFooter('Only includes the first 8 matches.')

        let matchesRecorded = 0;

        for (let index = 0; index < matches.length; index++) {  //Foreach Match
            const match = matches[index];

            if(matchesRecorded >= 8) break; // can only do 8 due to embed field limit of 25

            const time = this.getTime(match);

            //deal with day === tomorrow && today
            if(day === 'tomorrow') {
                const today = new Date().getDay();
                const tomorrow = today + 1;

                let tomI = (tomorrow+3)%acceptableDays.length;
                if(tomI < 3) tomI += 3;
                day = acceptableDays[tomI];
            }
            else if(day === 'today')
            {
                const today = new Date().getDay();

                let todI = (today+3)%acceptableDays.length;
                if(todI < 3) todI += 3;
                day = acceptableDays[(today+3)%acceptableDays.length];
            }

            let dayTag = time.split(',')[0].toLowerCase();
            if(day !== 'all' && (day.substring(0,3) != dayTag)) continue;

            matchesRecorded++;
            
            embed.addField(match.orange_team.name, time, true);
            embed.addField('vs', '\u200b', true);
            embed.addField(match.blue_team.name, `[Match Page](https://vrmasterleague.com${match.match_link})`, true);
        }

        return embed;
    },

    async executeTeam(message, args) {
        //combine args to get team name
        const teamName = args.join(' '); //combine arguments to form team name

        //check if team is in database
        const team = message.client.database.getTeam(teamName);
        if(team)
        {           
            const matches = await message.client.scraper.scrape_Matches_team(team.link);//this.scrapeMatchesTeam(body);
            let embed = this.createMatchesEmbed(matches, 'all', team.name);

            message.channel.send(embed);
            message.channel.stopTyping();
        }
        else {
            //get teaminfo from standings pate
            let info = await message.client.scraper.scrape_TeamInfo_standings(teamName);
            let link = null, name = null;
            if(info) {
                link = info.link; 
                name = info.name;
            }
            
            //no such team
            if(link === null) {
                message.reply(`Could not find a team with that name.`);// team doesn't exist
                message.channel.stopTyping();
                return;
            }

            //get list of matches from team page
            const matches = await message.client.scraper.scrape_Matches_team(link);
            let embed = this.createMatchesEmbed(matches, 'all', name);

            message.channel.send(embed);
            message.channel.stopTyping();
        }
    },

    async executeDay(message, args) {

        //get matches and store in array
        const matches = await message.client.scraper.scrape_ScheduledMatches_matches();//this.getScheduledMatches(body);

        let embed = null;
        if(args[0]) //if there was an argument 
        {
            embed = this.createMatchesEmbed(matches, args[0].toLowerCase());
        }
        else { //default to today
            embed = this.createMatchesEmbed(matches, 'today');
        }

        message.channel.send(embed);
        message.channel.stopTyping();
    },

	execute(message, args) {
		
        //provide feedback that the command is running
        message.channel.startTyping();

        //if not a valid arg for <day>, run <team>
        if(args[0] && !acceptableDays.includes(args[0].toLowerCase())) this.executeTeam(message,args);

        //otherwise run <day> / <>
        else this.executeDay(message, args);
	},
};