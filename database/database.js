const { time } = require('console');
const fileSystem = require('fs');
const { Pool } = require('pg');

const databasePath = './database/database.json';

const databaseTeplate = {
    guilds: [],
    teams: [],
    streamers: []
}

module.exports = class Database { //TODO: use MySQL
    tables;
    pool;

    constructor() {
        this.load();
    }

    async getTeam(teamName)
    {
        const team_result = await this.pool.query(`SELECT * FROM Teams WHERE name ILIKE '${teamName}';`).catch(err => console.error(err));
        //return this.tables.teams.find(team => team.name.toLowerCase() === teamName.toLowerCase());

        let team = null;
        if(team_result.rowCount == 0) console.error(`db.getTeam(${teamName}) returned null`);
        else {
            const team_row = team_result.rows[0];
            team = { name: team_row.name, link: "/EchoArena/Teams/"+team_row.id , discord: team_row.discord };
        }

        console.log(`getTeam: ${team}`);

        return team;
    }

    async addPlayer(player)
    {

        this.pool.query(`INSERT INTO players(id,name,team,discordTag,rank,location,updated)VALUES($1,$2,$3,$4,$5,$6,to_timestamp($7));`, 
        [player.id, player.name, player.team, player.discordTag, player.rank, player.location, Date.now()/1000.0]).catch(err => console.error(err));
    }

    async getPlayer(playerID)
    {
        const result = await this.pool.query(`SELECT * FROM players WHERE id='${playerID}';`).catch(err => console.error(err));

        if(result.rowCount > 0) return result.rows[0];  //found player

        return null;    //no player found
    }

    async addTeam(team)
    {
        //this.tables.teams.push(team);
        //this.save();
        const teamID = team.link.substring(17);

        await this.pool.query(`INSERT INTO teams(id,name,discord,updated)VALUES($1,$2,$3,to_timestamp($4));`, [teamID, team.name, team.discord, Date.now()/1000.0]).catch(err => console.error(err));
    }

    getStreamer(name) { return 'Not Implemented'; } //TODO: implement streamer storage

    save()
    {
        const data = JSON.stringify(this.tables, null, 2);
        fileSystem.writeFileSync(databasePath, data); //save back to file
    }

    load()
    {
        if(!fileSystem.existsSync(databasePath)) fileSystem.writeFileSync(databasePath, JSON.stringify(databaseTeplate)); //create file if doesn't exist
        this.tables = JSON.parse(fileSystem.readFileSync(databasePath)); //load from file

        //setup connection to database
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URI,
            ssl: {rejectUnauthorized: false}
        });
    }
}