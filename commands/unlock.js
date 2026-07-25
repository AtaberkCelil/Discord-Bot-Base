const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { checkPermission } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Bu kanalın kilidini açar (herkes tekrar mesaj atabilir)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    if (!(await checkPermission(interaction))) return;

    const channel = interaction.channel;
    const everyoneRole = interaction.guild.roles.everyone;

    try {
      await channel.permissionOverwrites.edit(everyoneRole, {
        SendMessages: null, // izin ayarını sıfırlar, varsayılana döner
      });

      const embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('🔓 Kanal Kilidi Açıldı')
        .setDescription('Bu kanal artık herkes tarafından kullanılabilir.')
        .addFields({ name: 'Yetkili', value: interaction.user.tag })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: '❌ Kanal kilidi açılırken bir hata oluştu.',
        ephemeral: true,
      });
    }
  },
};