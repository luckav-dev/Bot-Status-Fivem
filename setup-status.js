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
    FileBuilder,
    SectionBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-status')
        .setDescription('Setup automatic status updates in a channel')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Channel to send status updates')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('language')
                .setDescription('Language for the status message')
                .addChoices(
                    { name: 'English', value: 'en' },
                    { name: 'Español', value: 'es' }
                )
                .setRequired(false)
        ),

    async execute(interaction, client) {
        try {
            const channel = interaction.options.getChannel('channel');
            const language = interaction.options.getString('language') || client.languageManager.getCurrentLanguage();
            
            client.console.logCommandExecution(interaction.user.tag, 'setup-status', language);

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            client.fivemStatusManager.reloadConfig();

            if (!channel.isTextBased()) {
                const errorContainer = new ContainerBuilder();
                errorContainer.addTextDisplayComponents([
                    new TextDisplayBuilder().setContent(
                        `${client.emojiManager.getEmoji('error')} **Error**\n\nPlease select a text channel.`
                    )
                ]);

                await interaction.editReply({
                    components: [errorContainer],
                    flags: MessageFlags.IsComponentsV2
                });
                return;
            }

            const serverData = await client.fivemStatusManager.refreshStatus();
            const messages = client.languageManager.messages[language];
            const additionalButtons = client.languageManager.getAdditionalButtons();

            const statusContainer = new ContainerBuilder();

            statusContainer.addTextDisplayComponents([
                new TextDisplayBuilder().setContent(
                    `# ${client.emojiManager.getEmoji('fivem')} ${serverData.serverName}\n\n` +
                    `${client.emojiManager.getEmoji(serverData.online ? 'signal_high' : 'signal_low')} \`\`${messages.status}: ${serverData.online ? messages.online : messages.offline}\`\``
                )
            ]);

            const playerSection = new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `${client.emojiManager.getEmoji('people')}\`\`${messages.players}:\`\``
                    )
                )
                .setButtonAccessory(
                    new ButtonBuilder()
                        .setCustomId('player_count')
                        .setLabel(`${serverData.online ? `${serverData.players}/${serverData.maxPlayers || '?'}` : messages.unknownPlayers}`)
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );

            statusContainer.addSectionComponents([playerSection]);
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

            const statusMessage = await channel.send({
                components: components,
                flags: MessageFlags.IsComponentsV2
            });

            client.statusMessage = statusMessage;
            client.statusChannel = channel;
            client.statusLanguage = language;

            client.statusPersistenceManager.saveStatusConfig({
                channelId: channel.id,
                messageId: statusMessage.id,
                language: language,
                guildId: interaction.guild.id
            });

            if (client.statusInterval) {
                clearInterval(client.statusInterval);
            }

            client.statusInterval = setInterval(async () => {
                await updateStatusMessage(client);
            }, client.config.server.updateInterval);

            const successContainer = new ContainerBuilder();
            successContainer.addTextDisplayComponents([
                new TextDisplayBuilder().setContent(
                    `${client.emojiManager.getEmoji('success')} **Status Setup Complete**\n\n` +
                    `Status message created in ${channel}\n` +
                    `Updates every ${client.config.server.updateInterval / 1000} seconds\n` +
                    `Language: ${language === 'en' ? 'English' : 'Español'}`
                )
            ]);

            await interaction.editReply({
                components: [successContainer]
            });
        } catch (error) {
            client.console.logError(error, 'setup-status command');
            try {
                const errorContainer = new ContainerBuilder();
                errorContainer.addTextDisplayComponents([
                    new TextDisplayBuilder().setContent(
                        `${client.emojiManager.getEmoji('error')} **Error**\n\nFailed to setup status message. Please try again.`
                    )
                ]);

                if (interaction.replied) {
                    await interaction.followUp({
                        components: [errorContainer],
                        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
                    });
                } else if (interaction.deferred) {
                    await interaction.editReply({
                        components: [errorContainer],
                        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
                    });
                } else {
                    await interaction.reply({
                        components: [errorContainer],
                        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
                    });
                }
            } catch (replyError) {
                console.error('Failed to send error reply:', replyError);
            }
        }
    },

    async updateStatusMessage(client) {
        if (!client.statusMessage || !client.statusChannel) return;

        try {
            const serverData = await client.fivemStatusManager.refreshStatus();
            const messages = client.languageManager.messages[client.statusLanguage];
            const additionalButtons = client.languageManager.getAdditionalButtons();

            const statusContainer = new ContainerBuilder();

            statusContainer.addTextDisplayComponents([
                new TextDisplayBuilder().setContent(
                    `# ${client.emojiManager.getEmoji('fivem')} ${serverData.serverName}\n\n` +
                    `${client.emojiManager.getEmoji(serverData.online ? 'signal_high' : 'signal_low')} \`\`${messages.status}: ${serverData.online ? messages.online : messages.offline}\`\``
                )
            ]);

            const playerSection = new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `${client.emojiManager.getEmoji('people')}\`\`${messages.players}:\`\``
                    )
                )
                .setButtonAccessory(
                    new ButtonBuilder()
                        .setCustomId('player_count')
                        .setLabel(`${serverData.online ? `${serverData.players}/${serverData.maxPlayers || '?'}` : messages.unknownPlayers}`)
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );

            statusContainer.addSectionComponents([playerSection]);
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
                            .setLabel(button.label[client.statusLanguage] || button.label.en)
                            .setStyle(ButtonStyle.Link)
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

            await client.statusMessage.edit({
                components: components,
                flags: MessageFlags.IsComponentsV2
            });
        } catch (error) {
            console.log('Error updating status message:', error);
        }
    }
};

async function updateStatusMessage(client) {
    if (!client.statusMessage || !client.statusChannel) return;

    try {
        client.fivemStatusManager.reloadConfig();
        
        const serverData = await client.fivemStatusManager.refreshStatus();
        const messages = client.languageManager.messages[client.statusLanguage];
        const additionalButtons = client.languageManager.getAdditionalButtons();

        const statusContainer = new ContainerBuilder();

        statusContainer.addTextDisplayComponents([
            new TextDisplayBuilder().setContent(
                `# ${client.emojiManager.getEmoji('fivem')} ${serverData.serverName}\n\n` +
                `${client.emojiManager.getEmoji(serverData.online ? 'signal_high' : 'signal_low')} \`\`${messages.status}: ${serverData.online ? messages.online : messages.offline}\`\``
            )
        ]);

        const playerSection = new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `${client.emojiManager.getEmoji('people')}\`\`${messages.players}:\`\``
                )
            )
            .setButtonAccessory(
                new ButtonBuilder()
                    .setCustomId('player_count')
                    .setLabel(`${serverData.online ? `${serverData.players}/${serverData.maxPlayers || '?'}` : messages.unknownPlayers}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );

        statusContainer.addSectionComponents([playerSection]);
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
                        .setLabel(button.label[client.statusLanguage] || button.label.en)
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

        await client.statusMessage.edit({
            components: components,
            flags: MessageFlags.IsComponentsV2
        });
        
        client.console.logServerStatus(serverData);
    } catch (error) {
        client.console.logError(error, 'status message update');
    }
}