const fs = require('fs');
const path = require('path');
const axios = require('axios');
const chalk = require('chalk');
const figlet = require('figlet');
const gradient = require('gradient-string');

class ConsoleManager {
    constructor() {
        this.startTime = Date.now();
        this.isInitialized = false;
    }

    showBanner() {
        process.stdout.write('\x1B[2J\x1B[0f');
        
        const banner = figlet.textSync('FIVEM CONNECT', {
            font: 'ANSI Shadow',
            horizontalLayout: 'fitted',
            verticalLayout: 'fitted'
        });

        const gradientBanner = gradient(['#00ff88', '#00d4ff', '#ff0080'])(banner);
        
        console.log(gradientBanner);
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.white.bold('     FiveM Server Status Bot - Developer by @el.pistolas_ Onyx Applications'));
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log('');
    }

    log(type, message, data = null) {
        const timestamp = this.getTimestamp();
        const prefix = this.getPrefix(type);
        
        let logMessage = `${timestamp} ${prefix} ${message}`;
        
        if (data) {
            logMessage += ` ${chalk.gray(JSON.stringify(data))}`;
        }
        
        console.log(logMessage);
    }

    getPrefix(type) {
        const prefixes = {
            'info': chalk.blue('ℹ'),
            'success': chalk.green('✓'),
            'warning': chalk.yellow('⚠'),
            'error': chalk.red('✗'),
            'system': chalk.cyan('⚙'),
            'bot': chalk.magenta('🤖'),
            'network': chalk.blue('🌐'),
            'database': chalk.green('💾'),
            'command': chalk.yellow('📋'),
            'event': chalk.magenta('🎯'),
            'update': chalk.cyan('🔄'),
            'timer': chalk.gray('⏰')
        };
        
        return prefixes[type] || prefixes['info'];
    }

    getTimestamp() {
        const now = new Date();
        return chalk.gray(`[${now.toLocaleTimeString()}]`);
    }

    logSystemInit() {
        console.log('');
        console.log(chalk.cyan.bold('🔧 SYSTEM INITIALIZATION'));
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    }

    logSystemComplete() {
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log('');
    }

    logBotReady(guilds, commands) {
        console.log(chalk.green.bold('🎯 BOT STATUS'));
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.white(`Bot ready to serve ${chalk.green.bold(guilds)} guilds`));
        console.log(chalk.white(`Loaded ${chalk.green.bold(commands)} commands`));
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log('');
    }

    logCommandExecution(user, command, language = null) {
        const langInfo = language ? chalk.gray(`(${language})`) : '';
        console.log(`${this.getTimestamp()} ${this.getPrefix('command')} ${chalk.white('Command executed:')} ${chalk.yellow(command)} ${chalk.gray('by')} ${chalk.cyan(user)} ${langInfo}`);
    }

    logServerStatus(serverData) {
        const status = serverData.online ? chalk.green('ONLINE') : chalk.red('OFFLINE');
        const players = chalk.cyan(`${serverData.players}/${serverData.maxPlayers || '?'}`);
        
        console.log(`${this.getTimestamp()} ${this.getPrefix('update')} ${chalk.white('Server Status:')} ${status} ${chalk.gray('|')} ${chalk.white('Players:')} ${players}`);
    }

    logError(error, context = '') {
        const contextInfo = context ? chalk.gray(`(${context})`) : '';
        console.log(`${this.getTimestamp()} ${this.getPrefix('error')} ${chalk.red('Error:')} ${error.message} ${contextInfo}`);
    }

    logNetworkRequest(url, status = null) {
        const statusInfo = status ? chalk.gray(`(${status})`) : '';
        console.log(`${this.getTimestamp()} ${this.getPrefix('network')} ${chalk.white('Request:')} ${chalk.blue(url)} ${statusInfo}`);
    }

    logTimer(interval) {
        console.log(`${this.getTimestamp()} ${this.getPrefix('timer')} ${chalk.white('Auto-update interval:')} ${chalk.cyan(`${interval / 1000}s`)}`);
    }

    logPersistence(action, details = '') {
        const detailsInfo = details ? chalk.gray(`(${details})`) : '';
        console.log(`${this.getTimestamp()} ${this.getPrefix('database')} ${chalk.white('Persistence:')} ${chalk.green(action)} ${detailsInfo}`);
    }

    logEvent(event, details = '') {
        const detailsInfo = details ? chalk.gray(`(${details})`) : '';
        console.log(`${this.getTimestamp()} ${this.getPrefix('event')} ${chalk.white('Event:')} ${chalk.magenta(event)} ${detailsInfo}`);
    }

    clear() {
        process.stdout.write('\x1B[2J\x1B[0f');
        this.showBanner();
    }
}

class EmojiManager {
    constructor(client) {
        this.client = client;
        this.emojis = new Map();
        this.emojiData = {};
        this.loadEmojiData();
    }

    loadEmojiData() {
        try {
            const emojiPath = path.join(__dirname, '..', 'emojis.json');
            this.emojiData = JSON.parse(fs.readFileSync(emojiPath, 'utf8'));
        } catch (error) {
            this.emojiData = {};
        }
    }

    saveEmojiData() {
        try {
            const emojiPath = path.join(__dirname, '..', 'emojis.json');
            const formattedData = {};
            
            for (const [key, value] of Object.entries(this.emojiData)) {
                if (typeof value === 'object' && value.id && value.name) {
                    formattedData[key] = `<:${value.name}:${value.id}>`;
                } else {
                    formattedData[key] = value;
                }
            }
            
            fs.writeFileSync(emojiPath, JSON.stringify(formattedData, null, 2), 'utf8');
        } catch (error) {
            console.error('Error saving emoji data:', error);
        }
    }

    async initializeEmojis() {
        try {
            if (!this.client.application) {
                console.log('Waiting for application to be ready...');
                return;
            }

            await this.syncEmojis();
        } catch (error) {
            console.error('Error initializing emojis:', error);
        }
    }

    async syncEmojis() {
        try {
            await this.client.application.emojis.fetch();
        } catch (error) {
            console.error('Error fetching application emojis:', error);
        }
        
        const emojiFiles = fs.readdirSync(path.join(__dirname, '..', 'emojis'));
        
        for (const fileName of emojiFiles) {
            if (!fileName.endsWith('.png')) continue;
            
            const originalName = path.parse(fileName).name;
            let emojiName = originalName.replace(/[^a-zA-Z0-9_]/g, '_');
            if (emojiName.length < 2) emojiName = emojiName + '_emoji';
            if (emojiName.length > 32) emojiName = emojiName.substring(0, 32);
            
            try {
                const existingEmoji = this.client.application.emojis.cache.find(e => e.name === emojiName);
                
                if (existingEmoji) {
                    this.emojiData[originalName] = {
                        id: existingEmoji.id,
                        name: existingEmoji.name,
                        fileName: fileName
                    };
                    this.emojis.set(originalName, existingEmoji);
                } else {
                    const emojiPath = path.join(__dirname, '..', 'emojis', fileName);
                    
                    if (fs.existsSync(emojiPath)) {
                        const createdEmoji = await this.client.application.emojis.create({
                            attachment: emojiPath,
                            name: emojiName
                        });
                        
                        this.emojiData[originalName] = {
                            id: createdEmoji.id,
                            name: emojiName,
                            fileName: fileName
                        };
                        this.emojis.set(originalName, createdEmoji);
                        console.log(`Created new emoji: ${originalName}`);
                    } else {
                        console.log(`Emoji file not found: ${fileName}`);
                        continue;
                    }
                }
            } catch (error) {
                console.error(`Error processing emoji ${originalName}:`, error);
            }
        }
        
        this.saveEmojiData();
    }

    getEmoji(name) {
        const emoji = this.emojis.get(name);
        if (emoji) {
            return `<:${emoji.name}:${emoji.id}>`;
        }
        
        const emojiData = this.emojiData[name];
        if (emojiData) {
            if (typeof emojiData === 'string' && emojiData.startsWith('<:')) {
                return emojiData;
            }
            if (emojiData.id && emojiData.name) {
                return `<:${emojiData.name}:${emojiData.id}>`;
            }
        }
        
        return `❓`;
    }

    getAllEmojis() {
        const result = {};
        for (const [name, emoji] of this.emojis) {
            result[name] = `<:${emoji.name}:${emoji.id}>`;
        }
        return result;
    }

    isEmojiAvailable(name) {
        if (this.emojis.has(name)) {
            return true;
        }
        
        const emojiData = this.emojiData[name];
        if (emojiData) {
            if (typeof emojiData === 'string' && emojiData.startsWith('<:')) {
                return true;
            }
            if (emojiData.id) {
                return true;
            }
        }
        
        return false;
    }
}

class LanguageManager {
    constructor(config) {
        this.config = config;
        this.currentLanguage = config.language || 'en';
        this.messages = config.messages || {};
    }

    initialize() {
        console.log(`Language system initialized with language: ${this.currentLanguage}`);
    }

    setLanguage(language) {
        if (this.config.supportedLanguages.includes(language)) {
            this.currentLanguage = language;
            return true;
        }
        return false;
    }

    getMessage(key, language = null) {
        const lang = language || this.currentLanguage;
        return this.messages[lang]?.[key] || this.messages['en']?.[key] || key;
    }

    getServerConfig() {
        return this.config.server;
    }

    getAdditionalButtons() {
        return this.config.server.additionalButtons;
    }

    getSupportedLanguages() {
        return this.config.supportedLanguages;
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }
}

class StatusPersistenceManager {
    constructor() {
        this.dataPath = path.join(__dirname, 'data', 'status-config.json');
        this.ensureDataDirectory();
    }

    ensureDataDirectory() {
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }

    saveStatusConfig(config) {
        try {
            fs.writeFileSync(this.dataPath, JSON.stringify(config, null, 2));
            console.log('Status configuration saved successfully');
        } catch (error) {
            console.error('Error saving status configuration:', error);
        }
    }

    loadStatusConfig() {
        try {
            if (fs.existsSync(this.dataPath)) {
                const data = fs.readFileSync(this.dataPath, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading status configuration:', error);
        }
        return null;
    }

    clearStatusConfig() {
        try {
            if (fs.existsSync(this.dataPath)) {
                fs.unlinkSync(this.dataPath);
                console.log('Status configuration cleared');
            }
        } catch (error) {
            console.error('Error clearing status configuration:', error);
        }
    }
}

class FiveMStatusManager {
    constructor(config) {
        this.config = config;
        this.serverConfig = config.server;
        this.serverData = {
            online: false,
            players: 0,
            maxPlayers: 0,
            serverName: this.serverConfig.name,
            connectString: '',
            lastUpdate: null
        };
    }

    async initialize() {
        if (this.client && this.client.config) {
            this.serverConfig = this.client.config.server;
        }
        
        if (this.serverConfig.cfxUrl) {
            await this.parseCfxUrl();
        }

        await this.updateServerStatus();
    }

    reloadConfig() {
        if (this.client) {
            try {
                const fs = require('fs');
                const path = require('path');
                const configPath = path.join(__dirname, '..', 'config.json');
                const newConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                
                this.client.config = newConfig;
                this.serverConfig = newConfig.server;
                
                return true;
            } catch (error) {
                console.error('Error reloading config:', error);
                return false;
            }
        }
        return false;
    }

    async parseCfxUrl() {
        try {
            const cfxUrl = this.serverConfig.cfxUrl;
            if (cfxUrl.includes('cfx.re/join/')) {
                const serverId = cfxUrl.split('cfx.re/join/')[1];
                
                const response = await axios.get(`https://servers-frontend.fivem.net/api/servers/single/${serverId}`, {
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'FiveM-Status-Bot/1.0'
                    }
                });
                
                if (response.data && response.data.Data) {
                    const serverData = response.data.Data;
                    
                    if (serverData.hostname && (!this.serverConfig.name || this.serverConfig.name === 'Onyx Applications')) {
                        this.serverConfig.name = serverData.hostname;
                    }
                    
                    if (serverData.port) {
                        this.serverConfig.port = serverData.port;
                    }
                    
                    if (serverData.endpoint) {
                        const endpointParts = serverData.endpoint.split(':');
                        if (endpointParts.length >= 2) {
                            const ip = endpointParts[0];
                            if (this.isValidIP(ip)) {
                                this.serverConfig.ip = ip;
                            }
                        }
                    }
                }
            }
        } catch (error) {
        }
    }

    isValidIP(ip) {
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipRegex.test(ip);
    }

    cleanServerName(name) {
        if (!name) return name;
        return name.replace(/\^[0-9]/g, '');
    }

    isProtectionService(ip) {
        const protectionServices = [
            'filter.evo-shield.com',
            'shield.gg',
            'ddos-guard.net',
            'cloudflare.com',
            'playflare.net',
            'private-placeholder.cfx.re'
        ];
        return protectionServices.some(service => ip.includes(service));
    }

    buildApiUrl(endpoint) {
        if (this.isProtectionService(this.serverConfig.ip)) {
            return `https://${this.serverConfig.ip}/${endpoint}`;
        } else {
            return `http://${this.serverConfig.ip}:${this.serverConfig.port}/${endpoint}`;
        }
    }

    async updateServerStatus() {
        try {
            const serverInfo = await this.getServerInfo();
            
            if (serverInfo) {
                const configName = this.cleanServerName(this.serverConfig.name);
                const serverName = this.cleanServerName(serverInfo.serverName);
                
                const finalName = (configName && configName.trim() !== '') ? configName : serverName;
                
                this.serverData = {
                    online: true,
                    players: serverInfo.players || 0,
                    maxPlayers: serverInfo.maxPlayers || 0,
                    serverName: finalName,
                    connectString: `connect ${this.serverConfig.ip}:${this.serverConfig.port}`,
                    lastUpdate: new Date()
                };
            } else {
                const configName = this.cleanServerName(this.serverConfig.name);
                
                this.serverData = {
                    online: false,
                    players: 0,
                    maxPlayers: 0,
                    serverName: configName,
                    connectString: `connect ${this.serverConfig.ip}:${this.serverConfig.port}`,
                    lastUpdate: new Date()
                };
            }
        } catch (error) {
            this.serverData.online = false;
            this.serverData.lastUpdate = new Date();
        }
    }

    async getServerInfo() {
        try {
            const dynamicUrl = this.buildApiUrl('dynamic.json');

            const response = await axios.get(dynamicUrl, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'FiveM-Status-Bot/1.0'
                }
            });

            if (response.data) {
                return {
                    serverName: this.cleanServerName(response.data.hostname) || this.cleanServerName(this.serverConfig.name),
                    players: response.data.clients || 0,
                    maxPlayers: response.data.sv_maxclients || 0,
                    online: true
                };
            }
            } catch (error) {
                try {
                    const infoUrl = this.buildApiUrl('info.json');

                    const infoResponse = await axios.get(infoUrl, {
                        timeout: 5000,
                        headers: {
                            'User-Agent': 'FiveM-Status-Bot/1.0'
                        }
                    });

                    if (infoResponse.data) {
                        const maxPlayers = infoResponse.data.vars?.sv_maxclients || 0;
                        return {
                            serverName: this.cleanServerName(infoResponse.data.vars?.sv_projectName) || this.cleanServerName(this.serverConfig.name),
                            players: 0,
                            maxPlayers: parseInt(maxPlayers) || 0,
                            online: true
                        };
                    }
                } catch (infoError) {
                    try {
                        const playersUrl = this.buildApiUrl('players.json');

                        const playersResponse = await axios.get(playersUrl, {
                            timeout: 5000,
                            headers: {
                                'User-Agent': 'FiveM-Status-Bot/1.0'
                            }
                        });

                        if (playersResponse.data) {
                            return {
                                serverName: this.cleanServerName(this.serverConfig.name),
                                players: Array.isArray(playersResponse.data) ? playersResponse.data.length : 0,
                                maxPlayers: 0,
                                online: true
                            };
                        }
                    } catch (playersError) {
                        return null;
                    }
            }
        }

        return null;
    }

    getServerData() {
        return this.serverData;
    }

    getConnectString() {
        return this.serverData.connectString;
    }

    isServerOnline() {
        return this.serverData.online;
    }

    getPlayerCount() {
        return this.serverData.players;
    }

    getMaxPlayers() {
        return this.serverData.maxPlayers;
    }

    getServerName() {
        return this.serverData.serverName;
    }

    getLastUpdate() {
        return this.serverData.lastUpdate;
    }

    async refreshStatus() {
        await this.updateServerStatus();
        return this.serverData;
    }
}

module.exports = {
    ConsoleManager,
    EmojiManager,
    LanguageManager,
    StatusPersistenceManager,
    FiveMStatusManager
};
