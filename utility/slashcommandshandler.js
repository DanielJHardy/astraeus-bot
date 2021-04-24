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

    Respond(responseData, interaction)
    {
        this.client.api.interactions(interaction.id, interaction.token).callback.post({data: {
            type: 4,
            data: responseData
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
}