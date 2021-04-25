module.exports = {
	name: 'INTERACTION_CREATE',
	ws: true,
	execute(interaction, client) {
		const commandName = interaction.data.name.toLowerCase();
        
        //get command
        const cmd = client.commands.get(commandName);

        //get args
        const args = this.compileArguments({ options: interaction.data.options });

        //run command
        cmd.execute(interaction, args, client); //temp name for cross-compatability
	},

    compileArguments(opt)
    {
        const args = {};
        if(opt.options)
        {
            for(const option of opt.options)
            {
                if(option.type == 1 || option.type == 2) //sub-command
                {
                    args[option.name] = this.compileArguments(option);
                }
                else {
                    const {name, value} = option;
                    args[name] = value;
                }
            }
        }

        return args;
    }
};