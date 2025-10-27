const {
    SlashCommandBuilder,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop-status')
        .setDescription('Stop automatic status updates'),

    async execute(interaction, client) {
        try {
            client.console.logCommandExecution(interaction.user.tag, 'stop-status');

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            if (client.statusInterval) {
                clearInterval(client.statusInterval);
                client.statusInterval = null;
            }

            if (client.statusMessage) {
                client.statusMessage = null;
                client.statusChannel = null;
                client.statusLanguage = null;
            }

            client.statusPersistenceManager.clearStatusConfig();

            const successContainer = new ContainerBuilder();
            successContainer.addTextDisplayComponents([
                new TextDisplayBuilder().setContent(
                    `${client.emojiManager.getEmoji('success')} **Status Updates Stopped**\n\n` +
                    `Automatic status updates have been stopped and configuration cleared.`
                )
            ]);

            await interaction.editReply({
                components: [successContainer],
                flags: MessageFlags.IsComponentsV2
            });

            client.console.logPersistence('Cleared', 'status configuration');

        } catch (error) {
            client.console.logError(error, 'stop-status command');
            await interaction.editReply({ 
                content: 'There was an error stopping the status updates.',
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
            });
        }
    }
};
