const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { checkPermission } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Bu kanalı kilitler (sadece yetkililer mesaj atabilir)')
    .addStringOption((option) =>
      option.setName('reason').setDescription('Kilitleme sebebi').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    if (!(await checkPermission(interaction))) return;

    const reason = interaction.options.getString('reason') || 'Sebep belirtilmedi';
    const channel = interaction.channel;
    const everyoneRole = interaction.guild.roles.everyone;

    try {
      await channel.permissionOverwrites.edit(everyoneRole, {
        SendMessages: false,
      });

      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('🔒 Kanal Kilitlendi')
        .setDescription('Bu kanal yetkililer dışında herkes için kilitlendi.')
        .addFields(
          { name: 'Yetkili', value: interaction.user.tag },
          { name: 'Sebep', value: reason }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: '❌ Kanal kilitlenirken bir hata oluştu. (Botun "Kanalları Yönet" iznine sahip olduğundan emin ol)',
        ephemeral: true,
      });
    }
  },
};