const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('time')
		.setDescription('Bir şehrin veya RTC (UTC) saatini gösterir')
		.addStringOption(option =>
			option
				.setName('city')
				.setDescription('Şehir adı veya RTC (UTC) için "RTC" yazın')
				.setRequired(true)
		),

	async execute(interaction) {
		await interaction.deferReply();

		const cityInput = interaction.options.getString('city');

		// Yardımcı fonksiyon: editReply yapar ve 10 saniye sonra mesajı otomatik siler.
		// payload = editReply'a normalde verdiğin obje ({ embeds: [...] } veya { content: '...' })
		const replyAndAutoDelete = async (payload, delayMs = 10_000) => {
			await interaction.editReply(payload);
			setTimeout(() => {
				interaction.deleteReply().catch(() => {});
			}, delayMs);
		};

		try {
			// Özel durum: RTC -> UTC saati doğrudan gösterilir, geocoding'e gerek yok
			if (cityInput.trim().toUpperCase() === 'RTC') {
				const now = new Date();

				const timeFormatter = new Intl.DateTimeFormat('tr-TR', {
					timeZone: 'UTC',
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit',
					hour12: false,
				});

				const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
					timeZone: 'UTC',
					weekday: 'long',
					year: 'numeric',
					month: 'long',
					day: 'numeric',
				});

				const rtcEmbed = new EmbedBuilder()
					.setColor(0x5865f2)
					.setTitle('🕒 RTC - Gerçek Zamanlı Saat')
					.addFields(
						{ name: '⏰ Anlık Saat', value: `\`\`\`${timeFormatter.format(now)}\`\`\``, inline: true },
						{ name: '📅 Tarih', value: dateFormatter.format(now), inline: true },
						{ name: '🌍 Zaman Dilimi', value: '`RTC`', inline: false }
					)
					.setTimestamp()
					.setFooter({ text: `${interaction.user.username} tarafından istendi.`, iconURL: interaction.user.displayAvatarURL() });

				return await replyAndAutoDelete({ embeds: [rtcEmbed] });
			}

			// Normal şehir araması
			const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityInput)}&count=1&language=en&format=json`;
			const response = await fetch(geoUrl);
			const data = await response.json();

			if (!data.results || data.results.length === 0) {
				return await replyAndAutoDelete({
					content: `❌ No city named **"${cityInput}"** was found. Please check your spelling`,
				});
			}

			const location = data.results[0];
			const { name, country, timezone } = location;

			if (!timezone) {
				return await replyAndAutoDelete({
					content: `❌ **"${name}"** için zaman dilimi verisine ulaşılamadı.`,
				});
			}

			const now = new Date();

			const timeFormatter = new Intl.DateTimeFormat('tr-TR', {
				timeZone: timezone,
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				hour12: false,
			});

			const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
				timeZone: timezone,
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			});

			const formattedTime = timeFormatter.format(now);
			const formattedDate = dateFormatter.format(now);

			const embed = new EmbedBuilder()
				.setColor(0x5865f2)
				.setTitle(`🕒 ${name}, ${country || ''} - Yerel Saat`)
				.addFields(
					{ name: '⏰ Anlık Saat', value: `\`\`\`${formattedTime}\`\`\``, inline: true },
					{ name: '📅 Tarih', value: formattedDate, inline: true },
					{ name: '🌍 Zaman Dilimi', value: `\`${timezone}\``, inline: false }
				)
				.setTimestamp()
				.setFooter({ text: `${interaction.user.username} tarafından istendi.`, iconURL: interaction.user.displayAvatarURL() });

			await replyAndAutoDelete({ embeds: [embed] });
		} catch (error) {
			console.error('Saat komutu hatası:', error);
			await replyAndAutoDelete({
				content: '❌ Saat bilgisi alınırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
			});
		}
	},
};