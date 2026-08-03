const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { checkPermission } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlocks this channel (everyone can send messages again)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    if (!(await checkPermission(interaction))) return;

    const channel = interaction.channel;
    const everyoneRole = interaction.guild.roles.everyone;

    try {
      await channel.permissionOverwrites.edit(everyoneRole, {
        SendMessages: null, // resets the permission, falls back to default
      });

      const embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('🔓 Channel Unlocked')
        .setDescription('This channel is now available to everyone.')
        .addFields({ name: 'Moderator', value: interaction.user.tag })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: '❌ An error occurred while unlocking the channel.',
        ephemeral: true,
      });
    }
  },
};