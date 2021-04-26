const Discord = require('discord.js');

module.exports = class SlashCommandsHandler {
    
    //properties
    client;

    //functions
    constructor(client)
    {
        this.client = client;
    }

    AddCommand(commandData ,guild = null)
    {
        //guild command
        if(guild) this.client.api.applications(this.client.user.id).guilds(guild).commands.post({ data: commandData});
        //global command
        else this.client.api.applications(this.client.user.id).commands.post({ data: commandData });
    }

    DeferResponse(response, interaction)
    {
        this.client.api.interactions(interaction.id, interaction.token).callback.post({data: {
            type: 5,
            data: response
          }});
    }

    Respond(response, interaction)
    {
        this.client.api.interactions(interaction.id, interaction.token).callback.post({data: {
            type: 4,
            data: response
          }});
    }

    EditResponse(response, interaction)
    {
        //let data = await this.createAPIMessage(interaction, response);

        this.client.api.webhooks(this.client.user.id, interaction.token).messages('@original').patch({ data: response});
    }

    Followup(response, interaction)
    {
        //new Discord.WebhookClient(client.user.id, interaction.token).send(response);
        this.client.api.webhooks(this.client.user.id, interaction.token).post(
            {
                type: 4,
                data: response
            }
        );
    }

    async SetCommandPermissions(permissions, commandName, guild = null)
    {
        const cmdID = await this.GetCommandID(commandName, guild);

        const packet = {
            data: { permissions: permissions },
            headers: { Authorization: `Bot ${process.env.TOKEN}`}
        };

        if(guild) this.client.api.applications(this.client.user.id).guilds(guild).commands(cmdID).permissions.put(packet);
        else this.client.api.applications(this.client.user.id).commands(cmdID).permissions.put(packet);
    }

    async GetCommandID(commandName, guild)
    {
        //get slash commands
        let commands;
        if(guild) {
            commands = await this.client.api.applications(this.client.user.id).guilds(guild).commands.get(); //guild commands
        }
        else commands = await this.client.api.applications(this.client.user.id).commands.get(); //global commands

        //look for command
        for(const cmd of commands)
        {
            if(cmd.name == commandName)    //found command
                return cmd.id;
        }
    }
}