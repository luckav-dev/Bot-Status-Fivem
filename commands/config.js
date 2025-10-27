const {
    SlashCommandBuilder,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configure server settings')
        .addSubcommand(subcommand =>
            subcommand
                .setName('server')
                .setDescription('Configure server connection settings')
                .addStringOption(option =>
                    option
                        .setName('ip')
                        .setDescription('Server IP address')
                        .setRequired(false)
                )
                .addIntegerOption(option =>
                    option
                        .setName('port')
                        .setDescription('Server port (default: 30120)')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('Server name')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option
                        .setName('cfx-url')
                        .setDescription('CFX URL (cfx.re/join/...)')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option
                        .setName('image')
                        .setDescription('Server banner image URL')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('language')
                .setDescription('Set bot language')
                .addStringOption(option =>
                    option
                        .setName('lang')
                        .setDescription('Language to use')
                        .addChoices(
                            { name: 'English', value: 'en' },
                            { name: 'Español', value: 'es' }
                        )
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('buttons')
                .setDescription('Configure additional buttons')
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Button type to configure')
                        .addChoices(
                            { name: 'Website', value: 'website' },
                            { name: 'Discord', value: 'discord' },
                            { name: 'Twitter', value: 'twitter' },
                            { name: 'TikTok', value: 'tiktok' }
                        )
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('url')
                        .setDescription('Button URL')
                        .setRequired(false)
                )
                .addBooleanOption(option =>
                    option
                        .setName('enabled')
                        .setDescription('Enable or disable this button')
                        .setRequired(false)
                )
        ),

    async execute(interaction, client) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            
            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'server') {
                await this.handleServerConfig(interaction, client);
            } else if (subcommand === 'language') {
                await this.handleLanguageConfig(interaction, client);
            } else if (subcommand === 'buttons') {
                await this.handleButtonsConfig(interaction, client);
            }
        } catch (error) {
            console.error(`Command error: /${interaction.commandName}`, error.message);
            
            try {
                const errorContainer = new ContainerBuilder();
                errorContainer.addTextDisplayComponents([
                    new TextDisplayBuilder().setContent(
                        `${client.emojiManager.getEmoji('error')} **Error**\n\nThere was an error executing this command.`
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
                        flags: MessageFlags.IsComponentsV2
                    });
                } else {
                    await interaction.reply({
                        components: [errorContainer],
                        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
                    });
                }
            } catch (replyError) {
                console.error('Failed to send error message', replyError.message);
            }
        }
    },

    async handleServerConfig(interaction, client) {
        const ip = interaction.options.getString('ip');
        const port = interaction.options.getInteger('port');
        const name = interaction.options.getString('name');
        const cfxUrl = interaction.options.getString('cfx-url');
        const image = interaction.options.getString('image');

        const config = require('../config.json');
        let updated = false;

        if (ip) {
            config.server.ip = ip;
            updated = true;
        }
        if (port) {
            config.server.port = port;
            updated = true;
        }
        if (name) {
            config.server.name = name;
            updated = true;
        }
        if (cfxUrl) {
            config.server.cfxUrl = cfxUrl;
            updated = true;
        }
        if (image) {
            config.server.image = image;
            updated = true;
        }

        if (updated) {
            const fs = require('fs');
            fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
            
            await client.fivemStatusManager.initialize();

            const configContainer = new ContainerBuilder();
            configContainer.addTextDisplayComponents([
                new TextDisplayBuilder().setContent(
                    `${client.emojiManager.getEmoji('success')} **Server Configuration Updated**\n\n` +
                    `**IP:** ${config.server.ip}\n` +
                    `**Port:** ${config.server.port}\n` +
                    `**Name:** ${config.server.name}\n` +
                    `**CFX URL:** ${config.server.cfxUrl || 'Not set'}\n` +
                    `**Image:** ${config.server.image || 'Not set'}`
                )
            ]);

            await interaction.editReply({
                components: [configContainer],
                flags: MessageFlags.IsComponentsV2
            });
        } else {
            await interaction.editReply({
                content: 'No changes made to server configuration.'
            });
        }
    },

    async handleLanguageConfig(interaction, client) {
        const language = interaction.options.getString('lang');
        
        if (client.languageManager.setLanguage(language)) {
            const config = require('../config.json');
            config.language = language;
            
            const fs = require('fs');
            fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

            const langContainer = new ContainerBuilder();
            langContainer.addTextDisplayComponents([
                new TextDisplayBuilder().setContent(
                    `${client.emojiManager.getEmoji('success')} **Language Updated**\n\n` +
                    `Bot language changed to: **${language === 'en' ? 'English' : 'Español'}**`
                )
            ]);

            await interaction.editReply({
                components: [langContainer],
                flags: MessageFlags.IsComponentsV2
            });
        } else {
            await interaction.editReply({
                content: 'Invalid language selected.'
            });
        }
    },

    async handleButtonsConfig(interaction, client) {
        const type = interaction.options.getString('type');
        const url = interaction.options.getString('url');
        const enabled = interaction.options.getBoolean('enabled');

        const config = require('../config.json');
        let updated = false;

        if (url !== null) {
            config.server.additionalButtons[type].url = url;
            updated = true;
        }
        if (enabled !== null) {
            config.server.additionalButtons[type].enabled = enabled;
            updated = true;
        }

        if (updated) {
            const fs = require('fs');
            fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

            const buttonContainer = new ContainerBuilder();
            buttonContainer.addTextDisplayComponents([
                new TextDisplayBuilder().setContent(
                    `${client.emojiManager.getEmoji('success')} **Button Configuration Updated**\n\n` +
                    `**${type.charAt(0).toUpperCase() + type.slice(1)} Button:**\n` +
                    `**URL:** ${config.server.additionalButtons[type].url || 'Not set'}\n` +
                    `**Enabled:** ${config.server.additionalButtons[type].enabled ? 'Yes' : 'No'}`
                )
            ]);

            await interaction.editReply({
                components: [buttonContainer],
                flags: MessageFlags.IsComponentsV2
            });
        } else {
            await interaction.editReply({
                content: 'No changes made to button configuration.'
            });
        }
    }
};