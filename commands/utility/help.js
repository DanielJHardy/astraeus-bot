module.exports = {
	name: 'help',
    aliases: ['commands'],
    usages: [
        {
            syntax: '<>',
            description: 'Displays a list of commands.',
            args: []
        },
        {
            syntax: '<command>',
            description: 'Displays information on a command.',
            args: [{ name: '<command>', description: 'The name of the command'}]
        }
    ],

	async execute(message, args) {
	
        const prefix = message.client.prefix;

        const data = [];
        const { commands } = message.client;

        if (!args.length) { //no arguments
            data.push('Here\'s a list of all my commands you have access to:');
            if(message.guild === null) data.push(`Run command from within a server to see server specific commands.`); //sent via DM
            
            data.push('`'+commands.filter(command => {

                if(!command.guildOnly) return true;
                else if(message.guild === null) return false;

                const memberRoles = message.member.roles.cache;
                return memberRoles.some(role => { 
                    if (!command.permission) return true;
                    return command.permission.includes(role.name.toLowerCase())
                });
            }).map(command => command.name).join(', ')+'`');
            
            data.push(`\nYou can send \`${prefix}help <command name>\` to get info on a specific command!`);

            return message.author.send(data, { split: true })
                .then(() => {
                    if (message.channel.type === 'dm') return;
                    message.reply('I\'ve sent you a DM with all my commands!');
                })
                .catch(error => {
                    console.error(`Could not send help DM to ${message.author.tag}.\n`, error);
                    message.reply('it seems like I can\'t DM you! Do you have DMs disabled?');
                });
        }

        //command specified
        const name = args[0].toLowerCase();
        const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));
        if (!command) return message.reply('that\'s not a valid command!');

        //Display command help
        data.push(`**Name:** ${command.name}`);

        if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(', ')}`);
        if (command.description) data.push(`**Description:** ${command.description}`);
        if (command.usages) {

            //indent spacings
            const INDENT_FIRST = '     ';
            const INDENT_SECOND = `${INDENT_FIRST}     `;
            const INDENT_THIRD = `${INDENT_SECOND}     `;

            let usageText = '**Usages:**\n';

            for(i = 0; i < command.usages.length; i++) {    // Usages
                const usage = command.usages[i];
                usageText += `${INDENT_FIRST}**- ${prefix}${command.name} *${usage.syntax}*** ${usage.description}\n`; //syntax + description

                for(a = 0; a < usage.args.length; a++) {   //Usage arguments
                    const usageArg = usage.args[a];

                    usageText += `${INDENT_SECOND}*${usageArg.name}* :\n`;
                    usageText += `${INDENT_THIRD}**description:** \`${usageArg.description}\`\n`;   //description of argument
                    if(usageArg.values) usageText += `${INDENT_THIRD}**values:** \`${usageArg.values.join(', ')}\`\n`; //show values if they exist
                }

                usageText += '\n'; //gap between usages
            }
            data.push(usageText);
            
        }

        //data.push(`**Cooldown:** ${command.cooldown || 3} second(s)`);

        message.author.send(data, { split: true });
    }
};