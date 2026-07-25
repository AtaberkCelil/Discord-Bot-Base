const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { checkPermission } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Bir kullanıcıyı belirtilen süre kadar susturur')
    .addUserOption((option) =>
      option.setName('user').setDescription('Susturulacak kullanıcı').setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('minutes')
        .setDescription('Susturma süresi (dakika, max 40320 = 28 gün)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(40320)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Susturma sebebi').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    if (!(await checkPermission(interaction))) return;

    const targetUser = interaction.options.getUser('user');
    const minutes = interaction.options.getInteger('minutes');
    const reason = interaction.options.getString('reason') || 'Sebep belirtilmedi';

    const member = interaction.guild.members.cache.get(targetUser.id);

    if (!member) {
      return interaction.reply({ content: '❌ Kullanıcı sunucuda bulunamadı.', ephemeral: true });
    }

    if (!member.moderatable) {
      return interaction.reply({
        content: '❌ Bu kullanıcıyı susturamıyorum. (Rol hiyerarşisi veya izin sorunu)',
        ephemeral: true,
      });
    }

    try {
      await member.timeout(minutes * 60 * 1000, `${reason} | Yetkili: ${interaction.user.tag}`);

      const embed = new EmbedBuilder()
        .setColor('Yellow')
        .setTitle('🔇 Kullanıcı Susturuldu')
        .addFields(
          { name: 'Kullanıcı', value: `${targetUser.tag} (${targetUser.id})` },
          { name: 'Süre', value: `${minutes} dakika` },
          { name: 'Yetkili', value: interaction.user.tag },
          { name: 'Sebep', value: reason }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: '❌ Kullanıcı susturulurken bir hata oluştu.',
        ephemeral: true,
      });
    }
  },
};