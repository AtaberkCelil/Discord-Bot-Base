const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { checkPermission } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Mutes a user for the specified duration')
    .addUserOption((option) =>
      option.setName('user').setDescription('The user to mute').setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('minutes')
        .setDescription('Timeout duration in minutes (max 40320 = 28 days)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(40320)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('The reason for the timeout').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    if (!(await checkPermission(interaction))) return;

    const targetUser = interaction.options.getUser('user');
    const minutes = interaction.options.getInteger('minutes');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const member = interaction.guild.members.cache.get(targetUser.id);

    if (!member) {
      return interaction.reply({ content: '❌ The user is not in the server.', ephemeral: true });
    }

    if (!member.moderatable) {
      return interaction.reply({
        content: '❌ I cannot timeout this user. (Role hierarchy or permission issue)',
        ephemeral: true,
      });
    }

    try {
      await member.timeout(minutes * 60 * 1000, `${reason} | Moderator: ${interaction.user.tag}`);

      const embed = new EmbedBuilder()
        .setColor('Yellow')
        .setTitle('🔇 User Muted')
        .addFields(
          { name: 'User', value: `${targetUser.tag} (${targetUser.id})` },
          { name: 'Duration', value: `${minutes} minutes` },
          { name: 'Moderator', value: interaction.user.tag },
          { name: 'Reason', value: reason }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: '❌ An error occurred while muting the user.',
        ephemeral: true,
      });
    }
  },
};