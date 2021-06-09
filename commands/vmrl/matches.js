const Discord = require('discord.js');

const acceptableDays = ['all', 'today', 'tomorrow', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const {bot_colour, fail_colour} = require('../../config.json');

module.exports = {
    global: true,
	name: 'matches',
    description: "Displays a list of upcoming OCE matches",
    options: [
      {
        type: 1,
        name: "Day",
        description: "Displays upcoming matches for a particular day. Defaults to Today",
        options: [
            {
                "name": "when",
                "description": "The day to get matches for",
                "type": 3,
                "required": false,
                "choices": [
                    { "name": "All", "value": "all" },
                    { "name": "Today", "value": "today" },
                    { "name": "Tomorrow", "value": "tomorrow" },
                    { "name": "Sunday", "value": "sunday" },
                    { "name": "Monday", "value": "monday" },
                    { "name": "Tuesday", "value": "tuesday" },
                    { "name": "Wednesday", "value": "wednesday" },
                    { "name": "Thursday", "value": "thursday" },
                    { "name": "Friday", "value": "friday" },
                    { "name": "Saturday", "value": "saturday" },
                ]
            },
        ]
      },
      {
        type: 1,
        name: "Team",
        description: "Displays a team's upcoming matches",
        options: [
            {
                "name": "name",
                "description": "Name of the team",
                "type": 3,
                "required": true,
            },
        ]
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
        embed.setColor(bot_colour);
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

        //if no matches
        if(embed.fields.length == 0)
        {
            embed.addField('\u200b','```diff\n- No matches found -\n```');
            embed.setColor(fail_colour);
        }

        return embed;
    },

    async executeTeam(interaction, teamName, client) {

        //check if team is in database
        const team = await client.database.getTeam(teamName);
        if(team)    //no need to scrape team link
        {           
            const matches = await client.scraper.scrape_Matches_team(team.link);

            //reply embed
            let embed = this.createMatchesEmbed(matches, 'all', team.name);
            client.slashCMDs.EditResponse({embeds: [embed]},interaction);        
        }
        else //not in database
        { 
            //get teaminfo from standings page
            let info = await client.scraper.scrape_TeamInfo_standings(teamName);
            let link = null, name = null;
            if(info) {
                link = info.link; 
                name = info.name;
            }
            
            //no such team
            if(link === null)  return client.slashCMDs.EditResponse({embeds: [new Discord.MessageEmbed().setDescription(`Couldn't find team **${teamName}**`).setColor('#d92121')]},interaction);

            //get list of matches from team page
            const matches = await client.scraper.scrape_Matches_team(link);

            // create embed and return
            let embed = this.createMatchesEmbed(matches, 'all', name);
            client.slashCMDs.EditResponse({embeds: [embed]},interaction);
        }
    },

    async executeDay(interaction, when, client) {

        //get matches and store in array
        const matches = await client.scraper.scrape_ScheduledMatches_matches();//this.getScheduledMatches(body);

        //create embed and return
        embed = this.createMatchesEmbed(matches, when);
        client.slashCMDs.EditResponse({embeds: [embed]},interaction);
    },

	execute(interaction, args, client) {
		
        client.slashCMDs.DeferResponse({}, interaction);

        //if not a valid arg for <day>, run <team>
        if(args.team) this.executeTeam(interaction, args.team.name, client);

        //otherwise run <day> / <>
        else if(args.day)
        {
            if(args.day.when) this.executeDay(interaction, args.day.when, client);
            else this.executeDay(interaction, 'today', client);
        }
	},
};