const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { checkPermission } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Locks this channel (only moderators can send messages)')
    .addStringOption((option) =>
      option.setName('reason').setDescription('The reason for locking').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    if (!(await checkPermission(interaction))) return;

    const reason = interaction.options.getString('reason') || 'No reason provided';
    const channel = interaction.channel;
    const everyoneRole = interaction.guild.roles.everyone;

    try {
      await channel.permissionOverwrites.edit(everyoneRole, {
        SendMessages: false,
      });

      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('🔒 Channel Locked')
        .setDescription('This channel is now locked for everyone except moderators.')
        .addFields(
          { name: 'Moderator', value: interaction.user.tag },
          { name: 'Reason', value: reason }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: '❌ An error occurred while locking the channel. (Make sure the bot has the "Manage Channels" permission)',
        ephemeral: true,
      });
    }
  },
};