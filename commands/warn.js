const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { checkPermission } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Bir kullanıcıyı uyarır (DM olarak bildirim gönderir)')
    .addUserOption((option) =>
      option.setName('user').setDescription('Uyarılacak kullanıcı').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Uyarı sebebi').setRequired(true)
    ),

  async execute(interaction) {
    if (!(await checkPermission(interaction))) return;

    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    const embed = new EmbedBuilder()
      .setColor('Yellow')
      .setTitle('⚠️ Kullanıcı Uyarıldı')
      .addFields(
        { name: 'Kullanıcı', value: `${targetUser.tag} (${targetUser.id})` },
        { name: 'Yetkili', value: interaction.user.tag },
        { name: 'Sebep', value: reason }
      )
      .setTimestamp();

    // Kullanıcıya DM göndermeyi dene (kapalıysa sorun değil, kanalda bildirim yeterli)
    try {
      await targetUser.send(
        `⚠️ **${interaction.guild.name}** sunucusunda bir uyarı aldın.\n**Sebep:** ${reason}`
      );
    } catch {
      // DM'ler kapalı olabilir, sorun değil
    }

    return interaction.reply({ embeds: [embed] });
  },
};