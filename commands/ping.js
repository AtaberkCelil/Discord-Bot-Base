const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Shows the bot latency'),
  async execute(interaction) {
    const sent = await interaction.reply({
      content: 'Pong!',
      fetchReply: true,
    });
    await interaction.editReply(
      `Pong! 🏓 Latency: ${sent.createdTimestamp - interaction.createdTimestamp}ms`,
    );
  },
};
