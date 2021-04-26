
module.exports = {
	name: 'message',
	execute(message) {
		const client = message.client;

        //commands
        if (!message.content.startsWith(client.prefix) || message.author.bot) return;



        //disable commands
        return;


	    const args = message.content.slice(client.prefix.length).trim().split(/ +/);
	    const commandName = args.shift().toLowerCase();

        //find command
        const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));   //commandName is an alias of a command
        if(!command) return; //command not found

        //check if requires guild
        if(command.guildOnly && message.guild === null)
        {
            message.reply('That command can only be run from within a server.'); 
            return;
        }

        //check for permission
        if(command.permission)
        {
            const memberRoles = message.member.roles.cache;
            if(!memberRoles.some(role => command.permission.includes(role.name.toLowerCase())))
            {
                console.log(`[Command: ${command.name}] access attempted by ${message.author.tag}`);
                message.reply('You dont have access to that command.'); 
                return;
            }
        }

        //execute command
        try {
            command.execute(message, args);
        } catch (error) {
            console.error(error);
            message.reply('there was an error trying to execute that command!');
        }
	},
};