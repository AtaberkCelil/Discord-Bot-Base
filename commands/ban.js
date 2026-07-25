const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { checkPermission } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bir kullanıcıyı sunucudan yasaklar')
    .addUserOption((option) =>
      option.setName('user').setDescription('Yasaklanacak kullanıcı').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Yasaklama sebebi').setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName('delete_days')
        .setDescription('Son kaç günlük mesajları silinsin (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    if (!(await checkPermission(interaction))) return;

    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'Sebep belirtilmedi';
    const deleteDays = interaction.options.getInteger('delete_days') || 0;

    const member = interaction.guild.members.cache.get(targetUser.id);

    if (member) {
      if (!member.bannable) {
        return interaction.reply({
          content: '❌ Bu kullanıcıyı yasaklayamıyorum. (Rol hiyerarşisi veya izin sorunu)',
          ephemeral: true,
        });
      }
    }

    try {
      await interaction.guild.members.ban(targetUser.id, {
        reason: `${reason} | Yetkili: ${interaction.user.tag}`,
        deleteMessageSeconds: deleteDays * 24 * 60 * 60,
      });

      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('🔨 Kullanıcı Yasaklandı')
        .addFields(
          { name: 'Kullanıcı', value: `${targetUser.tag} (${targetUser.id})` },
          { name: 'Yetkili', value: interaction.user.tag },
          { name: 'Sebep', value: reason }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: '❌ Kullanıcı yasaklanırken bir hata oluştu.',
        ephemeral: true,
      });
    }
  },
};