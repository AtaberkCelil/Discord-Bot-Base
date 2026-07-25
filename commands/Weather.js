const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('weather') // Discord komut isimleri küçük harf olmalıdır
		.setDescription('Belirtilen şehrin 7 günlük hava durumu tahminini gösterir.')
		.addStringOption(option =>
			option
				.setName('sehir')
				.setDescription('Hava durumunu öğrenmek istediğiniz şehir adı')
				.setRequired(true)
		),

	async execute(interaction) {
		// İşlem biraz sürebileceğinden interaction'ı beklemeye alıyoruz
		await interaction.deferReply();

		// Yardımcı fonksiyon: editReply yapar ve 10 saniye sonra mesajı otomatik siler.
		const replyAndAutoDelete = async (payload, delayMs = 10_000) => {
			await interaction.editReply(payload);
			setTimeout(() => {
				interaction.deleteReply().catch(() => {});
			}, delayMs);
		};

		const sehirAdi = interaction.options.getString('sehir');

		try {
			// 1. Şehrin enlem ve boylamını bulmak için Geocoding API çağrısı
			const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(sehirAdi)}&count=1&language=tr&format=json`;
			const geoResponse = await axios.get(geoUrl);

			if (!geoResponse.data.results || geoResponse.data.results.length === 0) {
				return await replyAndAutoDelete({
					content: `❌ **"${sehirAdi}"** adında bir şehir bulunamadı. Lütfen ismi kontrol edip tekrar deneyin.`,
				});
			}

			const location = geoResponse.data.results[0];
			const { latitude, longitude, name, country } = location;

			// 2. Koordinatlara göre 7 günlük hava durumu verisini çekme
			const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
			const weatherResponse = await axios.get(weatherUrl);

			const daily = weatherResponse.data.daily;

			// Weathercode (Hava Durumu Kodu) karşılıkları
			const getWeatherStatus = (code) => {
				if (code === 0) return '☀️ Açık';
				if (code >= 1 && code <= 3) return '🌤️ Parçalı Bulutlu';
				if (code >= 45 && code <= 48) return '🌫️ Sisli';
				if (code >= 51 && code <= 67) return '🌧️ Yağmurlu';
				if (code >= 71 && code <= 77) return '❄️ Karlı';
				if (code >= 80 && code <= 82) return '🌦️ Sağanak Yağışlı';
				if (code >= 95) return '⛈️ Gökgürültülü Fırtına';
				return '☁️ Bulutlu';
			};

			// 7 Günlük tahmini formatlama
			let forecastText = '';
			for (let i = 0; i < daily.time.length; i++) {
				const dateStr = daily.time[i]; // YYYY-MM-DD
				const dateObj = new Date(dateStr);
				const formattedDate = dateObj.toLocaleDateString('tr-TR', {
					weekday: 'short',
					day: 'numeric',
					month: 'numeric',
				});

				const status = getWeatherStatus(daily.weathercode[i]);
				const maxTemp = Math.round(daily.temperature_2m_max[i]);
				const minTemp = Math.round(daily.temperature_2m_min[i]);

				forecastText += `**${formattedDate}**: ${status} | 📈 **${maxTemp}°C** / 📉 **${minTemp}°C**\n`;
			}

			// Discord Embed mesajı oluşturma
			const embed = new EmbedBuilder()
				.setColor(0x0099ff)
				.setTitle(`🌤️ ${name}, ${country} - 7 Günlük Hava Durumu Tahmini`)
				.setDescription(forecastText)
				.setTimestamp()
				.setFooter({ text: 'Hava durumu verileri Open-Meteo sağlandı.' });

			await replyAndAutoDelete({ embeds: [embed] });
		}
		catch (error) {
			console.error('Hava durumu komutu hatası:', error);
			await replyAndAutoDelete({
				content: '❌ Hava durumu verileri alınırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
			});
		}
	},
};