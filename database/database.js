const { time } = require('console');
const fileSystem = require('fs');
const { Pool } = require('pg');

const databasePath = './database/database.json';

const databaseTeplate = {
    guilds: [],
    teams: [],
    streamers: []
}

const TEAM_LIFESPAN = 168;  //week
const PLAYER_LIFESPAN = 24; //day

module.exports = class Database { //TODO: use MySQL
    tables;
    pool;

    constructor() {
        this.load();
    }

    async getTeam(teamName) {
        const team_result = await this.pool.query(`SELECT * FROM Teams WHERE name ILIKE '${teamName}';`).catch(err => console.error(err));
        //return this.tables.teams.find(team => team.name.toLowerCase() === teamName.toLowerCase());

        let team = null;
        if (team_result.rowCount > 0) {
            const team_row = team_result.rows[0];

            //check if data is outdated
            const lastUpdated = new Date(team_row.updated);
            const now = new Date();
            const deltaHours = (now.getTime() - lastUpdated.getTime()) / 3600000;
            if (deltaHours >= TEAM_LIFESPAN) {
                console.log(`old team data for ${teamName}`);
                //delete from database to update
                this.pool.query(`DELETE FROM teams WHERE id='${team_row.id}';`).catch(err => console.error(err));;
            }
            else {

                //setup return object
                team = { name: team_row.name, link: "/EchoArena/Teams/" + team_row.id, discord: team_row.discord };
            }
        }



        return team;
    }

    async addPlayer(player) {

        const now = new Date().toString();
        this.pool.query(`INSERT INTO players(id,name,team,discordTag,rank,location,updated)VALUES($1,$2,$3,$4,$5,$6,$7);`,
            [player.id, player.name, player.team, player.discordtag, player.rank, player.location, now]).catch(err => console.error(err));
    }

    async getPlayer(playerID) {
        const result = await this.pool.query(`SELECT * FROM players WHERE id='${playerID}';`).catch(err => console.error(err));
        if (result.rowCount == 0) return null;  //not found player

        const player = result.rows[0];

        //check if player data is too old
        const lastUpdated = new Date(player.updated);
        const now = new Date();
        const deltaHours = (now.getTime() - lastUpdated.getTime()) / 3600000;
        if(deltaHours >= PLAYER_LIFESPAN)
        {
            console.log(`old player data for ${player.name}`);
            //delete from database to update
            this.pool.query(`DELETE FROM players WHERE id='${player.id}';`).catch(err => console.error(err));;
            return null;
        }

        return player;    //no player found
    }

    async addTeam(team) {
        //this.tables.teams.push(team);
        //this.save();
        const teamID = team.link.substring(17);

        const now = new Date().toString();
        await this.pool.query(`INSERT INTO teams(id,name,discord,updated)VALUES($1,$2,$3,$4);`, [teamID, team.name, team.discord, now]).catch(err => console.error(err));
    }

    getStreamer(name) { return 'Not Implemented'; } //TODO: implement streamer storage

    save() {
        const data = JSON.stringify(this.tables, null, 2);
        fileSystem.writeFileSync(databasePath, data); //save back to file
    }

    load() {
        if (!fileSystem.existsSync(databasePath)) fileSystem.writeFileSync(databasePath, JSON.stringify(databaseTeplate)); //create file if doesn't exist
        this.tables = JSON.parse(fileSystem.readFileSync(databasePath)); //load from file

        //setup connection to database
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URI,
            ssl: { rejectUnauthorized: false }
        });
    }
}