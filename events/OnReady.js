module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		//add / update slash commands
		const testing = true;
		if(testing)
		{
			const guild = client.homeGuildID;

			for (command of client.commands) 
			{
				if(!command[1].global) //if command structure hasnt already been finalized
				{ 
					client.slashCMDs.AddCommand(command[1], guild); //add command
					if(command[1].permissions) client.slashCMDs.SetCommandPermissions(command[1].permissions, command[1].name, guild);
				}
			}
		}
	},
};