const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkPermission } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delete')
    .setDescription('Kanaldaki mesajları siler (toplu silme)')
    .addIntegerOption((option) =>
      option
        .setName('count')
        .setDescription('Kaç mesaj silinsin (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('Sadece bu kullanıcının mesajları silinsin (opsiyonel)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    // Rol bazlı yetki kontrolü
    if (!(await checkPermission(interaction))) return;

    const count = interaction.options.getInteger('count');
    const targetUser = interaction.options.getUser('user');

    await interaction.deferReply({ ephemeral: true });

    try {
      const channel = interaction.channel;
      let deletedCount = 0;

      if (targetUser) {
        // Belirli bir kullanıcının mesajlarını filtrele ve sil
        // Discord API son 100 mesajı çeker, içinden istenen kullanıcıya ait olanları filtreler
        const messages = await channel.messages.fetch({ limit: 100 });
        const userMessages = messages
          .filter((msg) => msg.author.id === targetUser.id)
          .first(count);

        if (userMessages.length === 0) {
          return interaction.editReply('⚠️ Bu kullanıcıya ait silinecek mesaj bulunamadı.');
        }

        const deleted = await channel.bulkDelete(userMessages, true);
        deletedCount = deleted.size;

        return interaction.editReply(
          `🗑️ **${targetUser.tag}** kullanıcısına ait **${deletedCount}** mesaj silindi.`
        );
      } else {
        // Sadece sayıya göre son N mesajı sil
        const deleted = await channel.bulkDelete(count, true);
        deletedCount = deleted.size;

        return interaction.editReply(`🗑️ **${deletedCount}** mesaj silindi.`);
      }
    } catch (error) {
      console.error(error);
      return interaction.editReply(
        '❌ Mesajlar silinirken bir hata oluştu. (14 günden eski mesajlar toplu silinemez)'
      );
    }
  },
};