const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { checkPermission, getWarnings, removeWarnings, removeTimeout } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearviolations')
    .setDescription('Removes warnings and/or timeout from a user')
    .addUserOption((option) =>
      option.setName('user').setDescription('The user to clear violations for').setRequired(true)
    ),

  async execute(interaction) {
    if (!(await checkPermission(interaction))) return;

    const targetUser = interaction.options.getUser('user');
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
      return interaction.reply({
        content: `⚠️ Could not find member **${targetUser.tag}** in this server.`,
        ephemeral: true,
      });
    }

    const warnings = getWarnings();
    const hasWarnings = warnings[targetUser.id] && warnings[targetUser.id] > 0;
    const isTimedOut = targetMember.communicationDisabledUntil;

    if (!hasWarnings && !isTimedOut) {
      return interaction.reply({
        content: `ℹ️ ${targetUser.tag} has no warnings or active timeouts.`,
        ephemeral: true,
      });
    }

    if (hasWarnings) {
      removeWarnings(targetUser.id);
    }

    if (isTimedOut) {
      await removeTimeout(targetMember);
    }

    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('✅ Violations Cleared')
      .addFields(
        { name: 'User', value: `${targetUser.tag} (${targetUser.id})` },
        { name: 'Moderator', value: interaction.user.tag },
        { name: 'Warnings Removed', value: hasWarnings ? `Yes (${warnings[targetUser.id]} removed)` : 'No' },
        { name: 'Timeout Removed', value: isTimedOut ? 'Yes' : 'No' }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};