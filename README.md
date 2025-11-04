<div align="center">

# 🎮 FiveM Server Status Bot

[![Discord](https://img.shields.io/badge/Discord-Components%20v2-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.com)
[![Node.js](https://img.shields.io/badge/Node.js-16+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**A modern Discord bot that displays real-time FiveM server status using Discord Components v2**

Keep your community informed with live updates, player counts, and customizable social links

[Features](#-features) • [Installation](#-quick-setup) • [Commands](#-commands) • [Configuration](#-configuration)

</div>

---

## 🌟 Features

<table>
<tr>
<td width="50%">

### 🔴 Real-Time Status
Monitor your FiveM server with live updates every 30 seconds showing online/offline status and current player count

### 🌍 Multi-Language Support
Full English and Spanish localization built-in, with easy command switching between languages

### 🔄 Auto-Updates
Set it and forget it - status messages update automatically without manual intervention

</td>
<td width="50%">

### 🔗 CFX Integration
Automatically parses cfx.re/join/ URLs to extract server information and configuration

### 🎨 Modern UI
Built with Discord Components v2 featuring containers, separators, and custom button layouts

### 🔒 Protected Servers
Works with EvoShield, Shield.gg, DDoS-Guard, Cloudflare, and Playflare.net protection services

</td>
</tr>
</table>

---

## 📸 Preview

![Status Container Preview](https://media.discordapp.net/attachments/1420529754963968051/1435292858461458462/image.png?ex=690b7023&is=690a1ea3&hm=d26068b80cb93795b82431660efd76ea6d49a6f179e042b5359b43e713b4ebda&=&format=webp&quality=lossless&width=570&height=504)
*Live server status display with player count and custom action buttons*

---

## 🚀 Quick Setup

### Installation Steps

```
# 1. Clone the repository
git clone https://github.com/luckav-dev/Bot-Status-Fivem
cd fivem-status-bot

# 2. Install dependencies
npm install

# 3. Configure your bot (edit config.json)
# Add your bot token, client ID, guild ID, and FiveM server details

# 4. Deploy commands to Discord
node deploy-commands.js

# 5. Start the bot
npm start
```

**That's it!** Your bot should now be online and ready to use.

---

## ⚙️ Configuration

### Basic Server Setup

Edit your `config.json` file with your server details:

```
{
  "server": {
    "name": "Onyx Applications",
    "ip": "127.0.0.1",
    "port": 30120,
    "cfxUrl": "https://cfx.re/join/majpq9",
    "image": "https://example.com/server-banner.png",
    "updateInterval": 30000
  }
}
```

| Parameter | Description | Required |
|-----------|-------------|----------|
| `name` | Display name for your server | ✅ |
| `ip` | Server IP address | ✅ |
| `port` | Server port (default: 30120) | ✅ |
| `cfxUrl` | CFX join URL | ❌ |
| `image` | Banner image URL | ❌ |
| `updateInterval` | Update frequency in ms | ❌ |

### Custom Buttons

Add social media and website links to your status display:

```
{
  "server": {
    "additionalButtons": {
      "website": {
        "enabled": true,
        "url": "https://myserver.com",
        "label": {
          "en": "Website",
          "es": "Sitio Web"
        }
      },
      "discord": {
        "enabled": true,
        "url": "https://discord.gg/myserver",
        "label": {
          "en": "Join Discord",
          "es": "Únete a Discord"
        }
      },
      "twitter": {
        "enabled": true,
        "url": "https://twitter.com/myserver",
        "label": {
          "en": "Twitter",
          "es": "Twitter"
        }
      },
      "tiktok": {
        "enabled": false,
        "url": "https://tiktok.com/@myserver",
        "label": {
          "en": "TikTok",
          "es": "TikTok"
        }
      }
    }
  }
}
```

---

## 🎮 Commands

### `/status [language]`
Display current server status with real-time information

- **language** *(optional)*: Choose between English (`en`) or Spanish (`es`)

---

### `/setup-status <channel> [language]`
Configure automatic status updates in a specific channel. Updates every 30 seconds.

- **channel** *(required)*: Target channel for status updates
- **language** *(optional)*: Language for status messages

---

### `/config server`
Configure server connection settings

**Subcommands:**
- `ip` - Set server IP address
- `port` - Set server port (default: 30120)
- `name` - Set server display name
- `cfx-url` - Set CFX join URL (cfx.re/join/...)
- `image` - Set banner image URL

---

### `/config language <language>`
Set the bot's default language

- **language** *(required)*: Choose English (`en`) or Spanish (`es`)

---

### `/config buttons <type> [url] [enabled]`
Configure additional buttons (website, Discord, Twitter, TikTok)

- **type** *(required)*: Button type (`website`, `discord`, `twitter`, `tiktok`)
- **url** *(optional)*: Button destination URL
- **enabled** *(optional)*: Enable or disable the button

---

### `/stop-status`
Stop automatic status updates and clear persistent configuration

---

## 🔧 FiveM Server Requirements

Your FiveM server must have the following HTTP endpoints enabled:

```
/info.json    → Server information
/players.json → Player list
/dynamic.json → Dynamic server data
```

These endpoints are enabled by default in most FiveM servers. If you're using a protection service, ensure they're not blocking these paths.

---

## 🌐 CFX URL Support

When you provide a CFX URL (cfx.re/join/...), the bot automatically:

1. Parses the server ID from the URL
2. Fetches server info from FiveM's API
3. Extracts IP, port, and server name
4. Uses this information for status updates

**Example:**
```
https://cfx.re/join/majpq9
```

---

## 🛠️ Troubleshooting

<details>
<summary><b>Server Not Responding</b></summary>

- Verify your FiveM server is running
- Check IP and port are correct
- Ensure HTTP API is enabled in server.cfg
- Review firewall settings
- Test endpoints manually: `http://your-ip:port/info.json`

</details>

<details>
<summary><b>Bot Not Updating</b></summary>

- Verify bot has proper channel permissions
- Check if status message still exists
- Look for errors in console
- Try restarting the bot
- Ensure `updateInterval` is not too low

</details>

<details>
<summary><b>Commands Not Working</b></summary>

- Deploy commands using `node deploy-commands.js`
- Verify bot has `application.commands` scope
- Check bot permissions in server
- Review console for error messages

</details>

<details>
<summary><b>CFX URL Issues</b></summary>

- Ensure URL includes `https://`
- Verify CFX server is available
- Check server ID is valid
- Try using IP/port directly instead

</details>

<details>
<summary><b>Protection Service Not Recognized</b></summary>

If your IP has a protection service that's not being recognized by the bot, follow these steps:

1. Navigate to `utils > utils.js` in your project structure
2. Scroll to approximately **line 460** and locate the `isProtectionService()` function
3. Find the `protectionServices` array which currently contains:
   ```
   isProtectionService(ip) {
       const protectionServices = [
           'filter.evo-shield.com',
           'shield.gg',
           'ddos-guard.net',
           'cloudflare.com',
           'playflare.net',
           'private-placeholder.cfx.re',
           'nopixel.net'
       ];
       return protectionServices.some(service => ip.includes(service));
   }
   ```
4. Add your protection service domain to the array by adding a new line with your service:
   ```
   'your-protection-service.com'
   ```
5. Save the file and restart your bot

**Example:** If you're using a service called `myprotection.io`, add it like this:
```
isProtectionService(ip) {
    const protectionServices = [
        'filter.evo-shield.com',
        'shield.gg',
        'ddos-guard.net',
        'cloudflare.com',
        'playflare.net',
        'private-placeholder.cfx.re',
        'nopixel.net',
        'myprotection.io'  // Your custom protection service
    ];
    return protectionServices.some(service => ip.includes(service));
}
```

</details>

---

## 📁 Project Structure

```
fivem-status-bot/
│
├── 📂 commands/          # Slash commands
│   ├── config.js
│   ├── setup-status.js
│   ├── status.js
│   └── stop-status.js
│
├── 📂 emojis/            # Emojis Discord
│   └── .png
│
├── 📂 events/            # Discord events
│   └── interactionCreate.js
│
├── 📂 utils/             # Utilities & managers
│   ├── 📂 data/status-config.json
│   ├── utils.js
│
├── 📄 config.json        # Main configuration
├── 📄 package.json       # Dependencies
├── 📄 index.js          # Bot entry point
└── 📄 deploy-commands.js # Command deployment
```

---

## 🤝 Contributing

Contributions are always welcome! Here's how you can help:

1. **Fork** the repository
2. Create a **feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. Open a **Pull Request**

### Ideas for Contributions:
- Additional language support
- New protection service integrations
- UI improvements and themes
- Performance optimizations
- Bug fixes and documentation

---

## 📄 License

This project is licensed under the **MIT License** - feel free to modify and distribute as needed.

See [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Developer

**@el.pistolas_** - Onyx Applications

---

<div align="center">

### 💬 Need Help?

If you have questions or need assistance, feel free to:

- 🐛 [Open an Issue](https://github.com/luckav-dev/Bot-Status-Fivem/issues)
- 💬 [Join our Discord server](https://discord.gg/ArUJYAB48f)
- 📧 Contact the developer

**Made with ❤️ for the FiveM community**
