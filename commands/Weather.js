const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('weather') // Discord command names should be lowercase
		.setDescription('Shows the 7-day weather forecast for the specified city.')
		.addStringOption(option =>
			option
				.setName('city')
				.setDescription('The name of the city to get the weather forecast for')
				.setRequired(true)
		),

	async execute(interaction) {
		// Defer the interaction because the operation may take a while
		await interaction.deferReply();

		// Helper function: edits the reply and auto-deletes the message after 10 seconds.
		const replyAndAutoDelete = async (payload, delayMs = 10_000) => {
			await interaction.editReply(payload);
			setTimeout(() => {
				interaction.deleteReply().catch(() => {});
			}, delayMs);
		};

		const cityName = interaction.options.getString('city');

		try {
			// 1. Geocoding API call to find the city's coordinates
			const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
			const geoResponse = await axios.get(geoUrl);

			if (!geoResponse.data.results || geoResponse.data.results.length === 0) {
				return await replyAndAutoDelete({
					content: `❌ No city named **"${cityName}"** was found. Please check the name and try again.`,
				});
			}

			const location = geoResponse.data.results[0];
			const { latitude, longitude, name, country } = location;

			// 2. Fetch the 7-day weather data based on coordinates
			const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
			const weatherResponse = await axios.get(weatherUrl);

			const daily = weatherResponse.data.daily;

			// Weather status mappings for weather codes
			const getWeatherStatus = (code) => {
				if (code === 0) return '☀️ Clear';
				if (code >= 1 && code <= 3) return '🌤️ Partly Cloudy';
				if (code >= 45 && code <= 48) return '🌫️ Foggy';
				if (code >= 51 && code <= 67) return '🌧️ Rainy';
				if (code >= 71 && code <= 77) return '❄️ Snowy';
				if (code >= 80 && code <= 82) return '🌦️ Showery';
				if (code >= 95) return '⛈️ Thunderstorm';
				return '☁️ Cloudy';
			};

			// Format the 7-day forecast
			let forecastText = '';
			for (let i = 0; i < daily.time.length; i++) {
				const dateStr = daily.time[i]; // YYYY-MM-DD
				const dateObj = new Date(dateStr);
				const formattedDate = dateObj.toLocaleDateString('en-US', {
					weekday: 'short',
					day: 'numeric',
					month: 'numeric',
				});

				const status = getWeatherStatus(daily.weathercode[i]);
				const maxTemp = Math.round(daily.temperature_2m_max[i]);
				const minTemp = Math.round(daily.temperature_2m_min[i]);

				forecastText += `**${formattedDate}**: ${status} | 📈 **${maxTemp}°C** / 📉 **${minTemp}°C**\n`;
			}

			// Create a Discord embed message
			const embed = new EmbedBuilder()
				.setColor(0x0099ff)
				.setTitle(`🌤️ ${name}, ${country} - 7-Day Weather Forecast`)
				.setDescription(forecastText)
				.setTimestamp()
				.setFooter({ text: 'Weather data provided by Open-Meteo.' });

			await replyAndAutoDelete({ embeds: [embed] });
		}
		catch (error) {
			console.error('Weather command error:', error);
			await replyAndAutoDelete({
				content: '❌ An error occurred while fetching weather data. Please try again later.',
			});
		}
	},
};
