const fileSystem = require('fs');

const databasePath = './database/database.json';

module.exports = class Database { //TODO: use MySQL
    tables;

    constructor() {
        this.load();
    }

    getTeam(teamName)
    {
        return this.tables.teams.find(team => team.name.toLowerCase() === teamName.toLowerCase());
    }

    addTeam(team)
    {
        this.tables.teams.push(team);
        this.save();
    }

    getStreamer(name) { return 'Not Implemented'; } //TODO: implement streamer storage

    save()
    {
        const data = JSON.stringify(this.tables, null, 2);
        fileSystem.writeFileSync(databasePath, data); //save back to file
    }

    load()
    {
        if(!fileSystem.existsSync(databasePath)) this.save();
        this.tables = JSON.parse(fileSystem.readFileSync(databasePath)); //load from file
    }
}