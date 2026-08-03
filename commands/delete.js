const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkPermission } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delete')
    .setDescription('Deletes messages in the channel (bulk delete)')
    .addIntegerOption((option) =>
      option
        .setName('count')
        .setDescription('How many messages to delete (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription("Delete only this user's messages (optional)")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    // Role-based permission check
    if (!(await checkPermission(interaction))) return;

    const count = interaction.options.getInteger('count');
    const targetUser = interaction.options.getUser('user');

    await interaction.deferReply({ ephemeral: true });

    try {
      const channel = interaction.channel;
      let deletedCount = 0;

      if (targetUser) {
        // Filter and delete messages from a specific user
        // Discord API fetches the last 100 messages, filters out the ones from the requested user
        const messages = await channel.messages.fetch({ limit: 100 });
        const userMessages = messages
          .filter((msg) => msg.author.id === targetUser.id)
          .first(count);

        if (userMessages.length === 0) {
          return interaction.editReply('⚠️ No messages found to delete for this user.');
        }

        const deleted = await channel.bulkDelete(userMessages, true);
        deletedCount = deleted.size;

        return interaction.editReply(
          `🗑️ Deleted **${deletedCount}** messages from **${targetUser.tag}**.`
        );
      } else {
        // Only delete the last N messages based on count
        const deleted = await channel.bulkDelete(count, true);
        deletedCount = deleted.size;

        return interaction.editReply(`🗑️ Deleted **${deletedCount}** messages.`);
      }
    } catch (error) {
      console.error(error);
      return interaction.editReply(
        '❌ An error occurred while deleting messages. (Messages older than 14 days cannot be bulk-deleted)'
      );
    }
  },
};