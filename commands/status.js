const {
    SlashCommandBuilder,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MediaGalleryBuilder,
    FileBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Show FiveM server status')
        .addStringOption(option =>
            option
                .setName('language')
                .setDescription('Language for the response')
                .addChoices(
                    { name: 'English', value: 'en' },
                    { name: 'Español', value: 'es' }
                )
                .setRequired(false)
        ),

    async execute(interaction, client) {
        try {
            const language = interaction.options.getString('language') || client.languageManager.getCurrentLanguage();
            
            client.console.logCommandExecution(interaction.user.tag, 'status', language);

            await interaction.deferReply();

            client.fivemStatusManager.reloadConfig();
            
            const serverData = await client.fivemStatusManager.refreshStatus();
            
            const messages = client.languageManager.messages[language];
            const additionalButtons = client.languageManager.getAdditionalButtons();

                const statusContainer = new ContainerBuilder();

                statusContainer.addTextDisplayComponents([
                    new TextDisplayBuilder().setContent(
                        `# ${client.emojiManager.getEmoji('fivem')} ${serverData.serverName}\n\n` +
                        `${client.emojiManager.getEmoji(serverData.online ? 'signal_high' : 'signal_low')} \`\`${messages.status}  ${serverData.online ? messages.online : messages.offline}\`\``
                    )
                ]);

                statusContainer.addTextDisplayComponents([
                    new TextDisplayBuilder().setContent(
                        `${client.emojiManager.getEmoji('people')}\`\`${messages.players}:\`\``
                    )
                ]);

                const playerCountRow = new ActionRowBuilder();
                playerCountRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId('player_count')
                        .setLabel(`${serverData.online ? `${serverData.players}/${serverData.maxPlayers || '?'}` : messages.unknownPlayers}`)
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );

                statusContainer.addActionRowComponents([playerCountRow]);
                statusContainer.addSeparatorComponents([new SeparatorBuilder()]);

            if (serverData.online && client.config.server.image) {
                const mediaGallery = new MediaGalleryBuilder().addItems(
                    f => f.setURL(client.config.server.image)
                );
                statusContainer.addMediaGalleryComponents([mediaGallery]);
                statusContainer.addSeparatorComponents([new SeparatorBuilder()]);
            }

                const connectButtonRow = new ActionRowBuilder();

                if (serverData.online) {
                    if (client.config.server.cfxUrl) {
                        let cfxUrl = client.config.server.cfxUrl;
                        if (!cfxUrl.startsWith('http://') && !cfxUrl.startsWith('https://')) {
                            cfxUrl = `https://${cfxUrl}`;
                        }
                        connectButtonRow.addComponents(
                            new ButtonBuilder()
                                .setURL(cfxUrl)
                                .setLabel(messages.connectFiveM)
                                .setStyle(ButtonStyle.Link)
                                .setEmoji(client.emojiManager.getEmoji('reply'))
                        );
                    } else {
                        connectButtonRow.addComponents(
                            new ButtonBuilder()
                                .setCustomId('connect_fivem')
                                .setLabel(messages.connectFiveM)
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji(client.emojiManager.getEmoji('reply'))
                        );
                    }
                }

                Object.entries(additionalButtons).forEach(([key, button]) => {
                    if (button.enabled && button.url) {
                        connectButtonRow.addComponents(
                            new ButtonBuilder()
                                .setURL(button.url)
                                .setLabel(button.label[language] || button.label.en)
                                .setStyle(ButtonStyle.Link)
                                .setEmoji(client.emojiManager.getEmoji('reply'))
                        );
                    }
                });

                if (connectButtonRow.components.length > 0) {
                    statusContainer.addActionRowComponents([connectButtonRow]);
                }

                statusContainer.addSeparatorComponents([new SeparatorBuilder()]);

                statusContainer.addTextDisplayComponents([
                    new TextDisplayBuilder().setContent(
                        `-# ${client.emojiManager.getEmoji('clock')} ${messages.updatingEvery}`
                    )
                ]);

                const components = [statusContainer];

                await interaction.editReply({
                    components: components,
                    flags: MessageFlags.IsComponentsV2
                });

        } catch (error) {
            client.console.logError(error, 'status command');
            
            try {
                const errorContainer = new ContainerBuilder();
                errorContainer.addTextDisplayComponents([
                    new TextDisplayBuilder().setContent(
                        `${client.emojiManager.getEmoji('error')} **Error**\n\n${client.languageManager.getMessage('errorFetching', 'en')}`
                    )
                ]);

                await interaction.editReply({
                    components: [errorContainer],
                    flags: MessageFlags.IsComponentsV2
                });
                } catch (replyError) {
                    client.console.logError(replyError, 'error reply');
                    try {
                        await interaction.followUp({
                            content: 'An error occurred while executing the command.',
                            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
                        });
                    } catch (followUpError) {
                        client.console.logError(followUpError, 'follow-up');
                    }
                }
        }
    }
};