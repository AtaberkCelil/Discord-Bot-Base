const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Botun gecikmesini gösterir'),
  async execute(interaction) {
    const sent = await interaction.reply({
      content: 'Pong!',
      fetchReply: true,
    });
    await interaction.editReply(
      `Pong! 🏓 Gecikme: ${sent.createdTimestamp - interaction.createdTimestamp}ms`,
    );
  },
};
