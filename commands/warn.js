const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { checkPermission } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warns a user (sends a DM notification)')
    .addUserOption((option) =>
      option.setName('user').setDescription('The user to warn').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('The reason for the warning').setRequired(true)
    ),

  async execute(interaction) {
    if (!(await checkPermission(interaction))) return;

    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    const embed = new EmbedBuilder()
      .setColor('Yellow')
      .setTitle('⚠️ User Warned')
      .addFields(
        { name: 'User', value: `${targetUser.tag} (${targetUser.id})` },
        { name: 'Moderator', value: interaction.user.tag },
        { name: 'Reason', value: reason }
      )
      .setTimestamp();

    // Try sending a DM to the user (if closed, no problem, notification in the channel is enough)
    try {
      await targetUser.send(
        `⚠️ You received a warning in the **${interaction.guild.name}** server.\n**Reason:** ${reason}`
      );
    } catch {
      // DMs might be closed, no problem
    }

    return interaction.reply({ embeds: [embed] });
  },
};