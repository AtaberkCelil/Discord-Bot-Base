require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

// Check if 'commands' folder exists
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
    } else {
      console.log(`[WARNING] ${filePath} is missing the required "data" or "execute" property.`);
    }
  }
} else {
  console.error("❌ No folder named 'commands' was found! Please place your command files in the 'commands' folder.");
  process.exit(1);
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Uploading ${commands.length} application (slash) commands to the Discord API...`);

    // Register commands globally across all servers
    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );

    console.log(`✅ ${data.length} application (slash) commands were successfully uploaded and activated!`);
  } catch (error) {
    console.error('❌ An error occurred while uploading commands:', error);
  }
})();
