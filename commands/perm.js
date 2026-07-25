const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { addAdminRole, removeAdminRole, getAdminRoleIds } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('perm')
    .setDescription('Moderasyon komutlarını kullanabilecek rolleri yönetir')
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Bir role moderasyon komutu kullanma izni verir')
        .addRoleOption((option) =>
          option.setName('role').setDescription('İzin verilecek rol').setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('Bir rolün moderasyon komutu kullanma iznini kaldırır')
        .addRoleOption((option) =>
          option.setName('role').setDescription('İzni kaldırılacak rol').setRequired(true)
        )
    )
    .addSubcommand((sub) => sub.setName('list').setDescription('Yetkili rolleri listeler'))
    // Bilerek sadece gerçek Administrator yetkisi olanlar kullanabilir.
    // (Eğer normal mod rolleri de /perm'i kullanabilseydi, kendilerine
    // istedikleri rolü ekleyip yetkilerini büyütebilirlerdi.)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    // Ekstra güvenlik: config/checkPermission'a değil, doğrudan gerçek
    // Administrator yetkisine bakıyoruz.
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({
        content: '❌ Bu komutu sadece sunucu yöneticileri kullanabilir.',
        ephemeral: true,
      });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const role = interaction.options.getRole('role');
      const added = addAdminRole(role.id);

      if (!added) {
        return interaction.reply({
          content: `⚠️ **${role.name}** rolü zaten yetkili roller listesinde.`,
          ephemeral: true,
        });
      }

      return interaction.reply(`✅ **${role.name}** rolüne moderasyon komutları için izin verildi.`);
    }

    if (sub === 'remove') {
      const role = interaction.options.getRole('role');
      const removed = removeAdminRole(role.id);

      if (!removed) {
        return interaction.reply({
          content: `⚠️ **${role.name}** rolü zaten yetkili roller listesinde değil.`,
          ephemeral: true,
        });
      }

      return interaction.reply(`✅ **${role.name}** rolünün moderasyon yetkisi kaldırıldı.`);
    }

    if (sub === 'list') {
      const roleIds = getAdminRoleIds();

      if (roleIds.length === 0) {
        return interaction.reply({
          content: 'ℹ️ Henüz yetkili rol eklenmemiş. (`/perm add` ile ekleyebilirsin)',
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle('🛡️ Yetkili Roller')
        .setDescription(roleIds.map((id) => `<@&${id}>`).join('\n'));

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};