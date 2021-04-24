module.exports = {
	name: 'INTERACTION_CREATE',
	ws: true,
	execute(interaction, client) {
		const commandName = interaction.data.name.toLowerCase();
        
        //get command
        const cmd = client.commands.get(commandName);

        //get args
        const args = {};
        for (const option of interaction.data.options) {
            const {name, value} = option;
            args[name] = value;
        }

        //run command
        cmd.execute(interaction, args, client); //temp name for cross-compatability
	},
};