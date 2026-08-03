const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { checkPermission } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bans a user from the server')
    .addUserOption((option) =>
      option.setName('user').setDescription('The user to ban').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('The reason for the ban').setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName('delete_days')
        .setDescription('How many days of messages to delete (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    if (!(await checkPermission(interaction))) return;

    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteDays = interaction.options.getInteger('delete_days') || 0;

    const member = interaction.guild.members.cache.get(targetUser.id);

    if (member) {
      if (!member.bannable) {
        return interaction.reply({
          content: '❌ I cannot ban this user. (Role hierarchy or permission issue)',
          ephemeral: true,
        });
      }
    }

    try {
      await interaction.guild.members.ban(targetUser.id, {
        reason: `${reason} | Moderator: ${interaction.user.tag}`,
        deleteMessageSeconds: deleteDays * 24 * 60 * 60,
      });

      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('🔨 User Banned')
        .addFields(
          { name: 'User', value: `${targetUser.tag} (${targetUser.id})` },
          { name: 'Moderator', value: interaction.user.tag },
          { name: 'Reason', value: reason }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: '❌ An error occurred while banning the user.',
        ephemeral: true,
      });
    }
  },
};