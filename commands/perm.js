const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { addAdminRole, removeAdminRole, getAdminRoleIds } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('perm')
    .setDescription('Manages the roles that can use moderation commands')
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Grants a role permission to use moderation commands')
        .addRoleOption((option) =>
          option.setName('role').setDescription('The role to grant permission').setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('Removes a role\'s permission to use moderation commands')
        .addRoleOption((option) =>
          option.setName('role').setDescription('The role to remove permission from').setRequired(true)
        )
    )
    .addSubcommand((sub) => sub.setName('list').setDescription('Lists the authorized roles'))
    // Deliberately, only real Administrators can use this.
    // (If mod roles could also use /perm, they could add
    // any role and escalate their own permissions.)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    // Extra security: not checking config/checkPermission, but directly
    // the real Administrator permission.
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({
        content: '❌ Only server administrators can use this command.',
        ephemeral: true,
      });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const role = interaction.options.getRole('role');
      const added = addAdminRole(role.id);

      if (!added) {
        return interaction.reply({
          content: `⚠️ The role **${role.name}** is already in the authorized roles list.`,
          ephemeral: true,
        });
      }

      return interaction.reply(`✅ Permission granted for the role **${role.name}** to use moderation commands.`);
    }

    if (sub === 'remove') {
      const role = interaction.options.getRole('role');
      const removed = removeAdminRole(role.id);

      if (!removed) {
        return interaction.reply({
          content: `⚠️ The role **${role.name}** is not in the authorized roles list.`,
          ephemeral: true,
        });
      }

      return interaction.reply(`✅ Removed moderation permission from the role **${role.name}**.`);
    }

    if (sub === 'list') {
      const roleIds = getAdminRoleIds();

      if (roleIds.length === 0) {
        return interaction.reply({
          content: 'ℹ️ No authorized roles added yet. (You can add one with `/perm add`)',
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle('🛡️ Authorized Roles')
        .setDescription(roleIds.map((id) => `<@&${id}>`).join('\n'));

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};