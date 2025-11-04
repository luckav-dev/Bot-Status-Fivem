const { 
    Client, 
    GatewayIntentBits, 
    Collection, 
    ActivityType,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MediaGalleryBuilder,
    SectionBuilder,
    MessageFlags
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

const { 
    FiveMStatusManager, 
    EmojiManager, 
    LanguageManager, 
    StatusPersistenceManager, 
    ConsoleManager 
} = require('./utils/utils');


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();
client.config = config;
client.statusPersistenceManager = new StatusPersistenceManager();
client.console = new ConsoleManager();

client.emojiManager = new EmojiManager(client);
client.languageManager = new LanguageManager(config);
client.fivemStatusManager = new FiveMStatusManager(config);

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.once('clientReady', async () => {
    client.console.showBanner();
    
    client.user.setPresence({
        activities: [{
            name: `${config.server.name} Status`,
            type: ActivityType.Watching
        }],
        status: 'online'
    });

    try {
        client.console.logSystemInit();
        
        client.console.log('system', 'Initializing emoji system...');
        await client.emojiManager.initializeEmojis();
        client.console.log('success', 'Emoji system initialized');
        
        client.console.log('system', 'Initializing language system...');
        client.languageManager.initialize();
        client.console.log('success', 'Language system initialized');
        
        client.console.log('system', 'Initializing FiveM status system...');
        await client.fivemStatusManager.initialize();
        client.console.log('success', 'FiveM status system initialized');
        
        client.console.log('system', 'Loading persistent status configuration...');
        await loadPersistentStatusConfig(client);
        
        client.console.logSystemComplete();
        client.console.logBotReady(client.guilds.cache.size, client.commands.size);
        
    } catch (error) {
        client.console.logError(error, 'initialization');
    }
});

process.on('unhandledRejection', error => {
    if (client.console) {
        client.console.logError(error, 'unhandledRejection');
    } else {
        console.error('Unhandled promise rejection:', error);
    }
});

process.on('uncaughtException', error => {
    if (client.console) {
        client.console.logError(error, 'uncaughtException');
    } else {
        console.error('Uncaught exception:', error);
    }
});

client.login(config.token);

async function loadPersistentStatusConfig(client) {
    try {
        const statusConfig = client.statusPersistenceManager.loadStatusConfig();
        if (statusConfig && statusConfig.channelId && statusConfig.messageId) {
            const channel = await client.channels.fetch(statusConfig.channelId);
            if (channel) {
                const message = await channel.messages.fetch(statusConfig.messageId);
                if (message) {
                    client.statusMessage = message;
                    client.statusChannel = channel;
                    client.statusLanguage = statusConfig.language || 'en';
                    
                    client.console.logPersistence('Restored', `channel: ${channel.name}`);
                    
                    if (client.statusInterval) {
                        clearInterval(client.statusInterval);
                    }
                    
                    client.statusInterval = setInterval(async () => {
                        await updateStatusMessage(client);
                    }, client.config.server.updateInterval);
                    
                    client.console.logTimer(client.config.server.updateInterval);
                } else {
                    client.console.log('warning', 'Status message not found, clearing configuration');
                    client.statusPersistenceManager.clearStatusConfig();
                }
            } else {
                client.console.log('warning', 'Status channel not found, clearing configuration');
                client.statusPersistenceManager.clearStatusConfig();
            }
        } else {
            client.console.log('info', 'No persistent status configuration found');
        }
    } catch (error) {
        client.console.logError(error, 'persistent config loading');
        client.statusPersistenceManager.clearStatusConfig();
    }
}

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