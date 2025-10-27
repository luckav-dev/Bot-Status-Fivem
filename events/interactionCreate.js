const { Events, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction, interaction.client);
            } catch (error) {
                console.error(`Command error: /${interaction.commandName}`, error.message);
                
                try {
                    const errorContainer = new ContainerBuilder();
                    errorContainer.addTextDisplayComponents([
                        new TextDisplayBuilder().setContent(
                            `${interaction.client.emojiManager.getEmoji('error')} **Error**\n\nThere was an error executing this command.`
                        )
                    ]);

                    const reply = {
                        components: [errorContainer],
                        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
                    };
                    
                    if (interaction.replied) {
                        await interaction.followUp(reply);
                    } else if (interaction.deferred) {
                        await interaction.editReply(reply);
                    } else {
                        await interaction.reply(reply);
                    }
                } catch (replyError) {
                    console.error('Failed to send error message', replyError.message);
                }
            }
        } else if (interaction.isButton()) {
            if (interaction.customId === 'connect_fivem') {
                const serverData = interaction.client.fivemStatusManager.getServerData();
                
                const connectContainer = new ContainerBuilder();
                connectContainer.addTextDisplayComponents([
                    new TextDisplayBuilder().setContent(
                        `${interaction.client.emojiManager.getEmoji('connect')} **Connect to Server**\n\n` +
                        `**Server:** ${serverData.serverName}\n` +
                        `**Connect String:** \`${serverData.connectString}\`\n\n` +
                        `Copy the connect string above and paste it in your FiveM console (F8) to connect to the server.`
                    )
                ]);

                await interaction.reply({
                    components: [connectContainer],
                    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
                });
            }
        }
    },
};