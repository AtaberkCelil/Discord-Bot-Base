const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { checkPermission } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kicks a user from the server')
    .addUserOption((option) =>
      option.setName('user').setDescription('The user to kick').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('The reason for the kick').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    if (!(await checkPermission(interaction))) return;

    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const member = interaction.guild.members.cache.get(targetUser.id);

    if (!member) {
      return interaction.reply({ content: '❌ The user is not in the server.', ephemeral: true });
    }

    if (!member.kickable) {
      return interaction.reply({
        content: '❌ I cannot kick this user. (Role hierarchy or permission issue)',
        ephemeral: true,
      });
    }

    try {
      await member.kick(`${reason} | Yetkili: ${interaction.user.tag}`);

      const embed = new EmbedBuilder()
        .setColor('Orange')
        .setTitle('👢 User Kicked')
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
        content: '❌ An error occurred while kicking the user.',
        ephemeral: true,
      });
    }
  },
};