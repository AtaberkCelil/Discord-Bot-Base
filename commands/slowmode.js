const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkPermission } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Sets the slow mode duration for this channel')
    .addIntegerOption((option) =>
      option
        .setName('seconds')
        .setDescription('Waiting time in seconds (0 = off, max 21600)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(21600)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    if (!(await checkPermission(interaction))) return;

    const seconds = interaction.options.getInteger('seconds');

    try {
      await interaction.channel.setRateLimitPerUser(seconds);

      if (seconds === 0) {
        return interaction.reply('⏱️ Slow mode for this channel has been disabled.');
      }

        return interaction.reply(`⏱️ Slow mode for this channel has been set to **${seconds} seconds**.`);
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: '❌ An error occurred while setting the slow mode.',
        ephemeral: true,
      });
    }
  },
};