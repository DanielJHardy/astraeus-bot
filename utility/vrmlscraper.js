const request = require('./await-request');
const cheerio = require('cheerio');
const cheerioModule = require('cheerio');

module.exports = class VRMLscraper {
    
    static domain = 'https://vrmasterleague.com';
    static standingsPage = 'https://vrmasterleague.com/EchoArena/Standings/2NluW_UsAmhquDWQX-CfFg2';
    static matchesPage = 'https://vrmasterleague.com/EchoArena/Matches/2NluW_UsAmhquDWQX-CfFg2';

    constructor()
    {

    };

    async scrape_TeamInfo_standings(team)
    {
        const page = await request(VRMLscraper.standingsPage);
        let $ = cheerio.load(page);

        const teamRowName = '.vrml_table_row';
        const teamName = '.team_name';
        const linkName = '.team_link';

        let info = null;

        const teamRows = $(teamRowName);
        for (let rIndex = 0; rIndex < teamRows.length; rIndex++) {
            const row = teamRows[rIndex];

            if($(row).find(teamName).first().text().toLowerCase() === team.toLowerCase())
            {
                info = { 
                    link: $(row).find(linkName).first().attr('href'),
                    name: $(row).find(teamName).first().text()
                };
                break;
            }
        }

        return info;
    };

    async scrape_Ladder_standings()
    {
        //get page
        const page = await request(VRMLscraper.standingsPage);
        let $ = cheerio.load(page);

        const rows = $('.vrml_table_row');  

        //scrape ladder
        let ladder = [];
        for (let index = 0; index < rows.length; index++) {
            const row = rows[index];
            
            //dont include teams that haven't played a game yet
            if($(row).find('.gp_cell').text() == '0') continue;

            const team = {
                position: parseInt($(row).find('.pos_cell').text()),
                division: $(row).find('.div_cell img').attr('title'),
                teamName: $(row).find('.team_name').text(),
                teamLink: $(row).find('.team_link').attr('href'),
                teamLogo: $(row).find('.team_logo').attr('src'),
                mmr: $(row).find('.mmr_cell span').text()
            };

            ladder.push(team);
        }

        return ladder;
    };

    async scrape_ScheduledMatches_matches()
    {
        const page = await request(VRMLscraper.matchesPage);

        let $ = cheerio.load(page);
        

        const sMatchList = $('.rows-hider-body').first().children();
        const matches = new Array(sMatchList.length);

        for (let index = 0; index < matches.length; index++) {

            const row = sMatchList[index];

            const sOrangeTeam = $(row).find('.home_team_cell').first();
            const sBlueTeam = $(row).find('.away_team_cell').first();

            const whenText = $(row).find('.date_scheduled_info').first().text();
            const whenDate = new Date(`${whenText} UTC`);

            let match = {
                when: whenDate,
                orange_team: {
                    name: $(sOrangeTeam).find('.team_name').first().text(),
                    link: $(sOrangeTeam).find('.team_link').first().attr('href'),
                    logo: $(sOrangeTeam).find('.team_logo').first().attr('src')
                },
                blue_team: {
                    name: $(sBlueTeam).find('.team_name').first().text(),
                    link: $(sBlueTeam).find('.team_link').first().attr('href'),
                    logo: $(sBlueTeam).find('.team_logo').first().attr('src')
                },
                match_link: $(row).find('.match-page-info a').first().attr('href')
            };

            matches[index] = match;
        }

        return matches;
    };

    async scrape_DiscordTag_players(playerLink)
    {
        const page = await request(`${VRMLscraper.domain}${playerLink}`);
        let $ = cheerio.load(page);

        return $('.player-bio-header-table-left tr:last-child > td:last-child').first().text();
    }

    async scrape_Matches_team(teamLink)
    {
        const page = await request(`${VRMLscraper.domain}${teamLink}`);

        //scrape matches from team page
        let $ = cheerio.load(page);

        const matchesContainer = $('.matches');
        const Smatches = $(matchesContainer).find('.matches_team_row');
        const matches = [];
        for (let index = 0; index < Smatches.length; index++) 
        {
            const row = Smatches[index];
            
            const sOrangeTeam = $(row).find('.home_team_cell').first();
            const sBlueTeam = $(row).find('.away_team_cell').first();

            const whenText = $(row).find('.date_scheduled_info').first().text();
            const whenDate = new Date(`${whenText} UTC`);

            let match = {
                when: whenDate,
                orange_team: {
                    name: $(sOrangeTeam).find('.team_name').first().text(),
                    link: $(sOrangeTeam).find('.team_link').first().attr('href'),
                    logo: $(sOrangeTeam).find('.team_logo').first().attr('src')
                },
                blue_team: {
                    name: $(sBlueTeam).find('.team_name').first().text(),
                    link: $(sBlueTeam).find('.team_link').first().attr('href'),
                    logo: $(sBlueTeam).find('.team_logo').first().attr('src')
                },
                match_link: $(row).find('.match-page-info a').first().attr('href')
            };
            matches.push(match);
        }
        return matches;
    };

    async scrape_TeamData_team(teamLink, db)
    {
        const page = await request(`${VRMLscraper.domain}${teamLink}`);
        const $ = cheerio.load(page);

        const statsBox = $('.teams_stats_row').first().children();

        //get discord link if exists
        let discordLink = '';
        let discordInvite = $('.btn-discord-invite').first();
        if(discordInvite.length) { //Button Invite
            discordLink = $(discordInvite).attr('onclick');
            discordLink = discordLink.slice(15, -3);
        }
        else    //server member list
        {
            const widgetCheck = $('.discord-widget').first().length;
            if(widgetCheck) 
            {
                const start = page.search('https://discord.gg/');

                if(start !== -1)
                {
                    const end = page.indexOf('"', start);
                    discordLink = page.substring(start, end);
                }
            }
        }

        //get team members
        const rankMap = { 'Player is the team owner': 'Captain', 'Player is on the main roster': 'Main', 'Player is a team member': 'Sub'};
        const teamMembers = $('.players_container').find('.player_container');
        const players = [];
        for (let index = 0; index < teamMembers.length; index++) {
            const playerSelector = teamMembers[index];

            //get rank
            const rankRaw = $(playerSelector).find('.team_capt').attr('title');
            const rankIndicator = rankMap[rankRaw];

            const playerLink = $(playerSelector).find('a').first().attr('href');
            const playerID = playerLink.substring(19);

            //get player stuff
            const player = {
                rank: rankIndicator,
                name: $(playerSelector).find('.player_name').first().text(),
                location: $(playerSelector).find('.flag').attr('title'),
                link: playerLink,
            };

            //get discordTag from server or vrml page
            let db_player = await db.getPlayer(playerID);

            //add to database
            if(db_player == null)
            {
                const discordTag = await this.scrape_DiscordTag_players(playerLink);

                db_player = {
                    id: playerLink.substring(19),
                    name: player.name,
                    team: teamLink.substring(17),
                    discordTag: discordTag,
                    rank: rankIndicator,
                    location: player.location
                }

                db.addPlayer(db_player);
            }

            player.discordTag = db_player.discordTag;

            players.push(player);
        }

        //compile team
        let teamData = {
            name: $('.team-name').first().text(),
            logo: $('.team_logo').first().attr('src'),
            division: $('.team-division').first().attr('title'),
            mmr: $('.team-mmr').first().text().substring(5),
            members: players,
            stats: {
                games: parseInt($(statsBox[0]).text()),
                wins: parseInt($(statsBox[1]).text()),
                losses: parseInt($(statsBox[2]).text()),
                points: parseInt($(statsBox[3]).text()),
            },
            page_link: teamLink,
            discord_link: discordLink
        };

        return teamData;
    };

}