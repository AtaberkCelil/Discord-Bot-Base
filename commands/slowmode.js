const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkPermission } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Bu kanal için yavaş mod süresini ayarlar')
    .addIntegerOption((option) =>
      option
        .setName('seconds')
        .setDescription('Saniye cinsinden bekleme süresi (0 = kapalı, max 21600)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(21600)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    if (!(await checkPermission(interaction))) return;

    const seconds = interaction.options.getInteger('seconds');

    try {
      await interaction.channel.setRateLimitPerUser(seconds);

      if (seconds === 0) {
        return interaction.reply('⏱️ Bu kanaldaki yavaş mod kapatıldı.');
      }

      return interaction.reply(`⏱️ Bu kanal için yavaş mod **${seconds} saniye** olarak ayarlandı.`);
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: '❌ Yavaş mod ayarlanırken bir hata oluştu.',
        ephemeral: true,
      });
    }
  },
};