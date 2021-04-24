module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		//add / update slash commands
		const testing = true;
		if(testing)
		{
			const guild = client.testGuildID;

			for (command of client.commands) {

				if(command[1].isSlash)
				{
					client.slashCMDs.AddCommand(command[1], guild);
				}
				
			}
		}
	},
};