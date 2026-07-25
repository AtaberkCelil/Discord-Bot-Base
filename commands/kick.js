const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { checkPermission } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Bir kullanıcıyı sunucudan atar')
    .addUserOption((option) =>
      option.setName('user').setDescription('Atılacak kullanıcı').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Atılma sebebi').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    if (!(await checkPermission(interaction))) return;

    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'Sebep belirtilmedi';

    const member = interaction.guild.members.cache.get(targetUser.id);

    if (!member) {
      return interaction.reply({ content: '❌ Kullanıcı sunucuda bulunamadı.', ephemeral: true });
    }

    if (!member.kickable) {
      return interaction.reply({
        content: '❌ Bu kullanıcıyı atamıyorum. (Rol hiyerarşisi veya izin sorunu)',
        ephemeral: true,
      });
    }

    try {
      await member.kick(`${reason} | Yetkili: ${interaction.user.tag}`);

      const embed = new EmbedBuilder()
        .setColor('Orange')
        .setTitle('👢 Kullanıcı Atıldı')
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
        content: '❌ Kullanıcı atılırken bir hata oluştu.',
        ephemeral: true,
      });
    }
  },
};