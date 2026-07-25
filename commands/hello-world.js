const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hello-world')
    .setDescription('Testing command'),
  async execute(interaction) {
    const sent = await interaction.reply({
      content: 'Hello World',
      fetchReply: true,
    });
  },
};
