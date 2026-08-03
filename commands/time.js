const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('time')
		.setDescription('Shows the current time for a city or RTC (UTC)')
		.addStringOption(option =>
			option
				.setName('city')
				.setDescription('Enter the city name or write "RTC" for UTC')
				.setRequired(true)
		),

	async execute(interaction) {
		await interaction.deferReply();

		const cityInput = interaction.options.getString('city');

		// Helper function: edits the reply and auto-deletes the message after 10 seconds.
		// payload = the object normally given to editReply ({ embeds: [...] } or { content: '...' })
		const replyAndAutoDelete = async (payload, delayMs = 10_000) => {
			await interaction.editReply(payload);
			setTimeout(() => {
				interaction.deleteReply().catch(() => {});
			}, delayMs);
		};

		try {
			// Special case: RTC -> show UTC time directly, no geocoding needed
			if (cityInput.trim().toUpperCase() === 'RTC') {
				const now = new Date();

				const timeFormatter = new Intl.DateTimeFormat('en-US', {
					timeZone: 'UTC',
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit',
					hour12: false,
				});

				const dateFormatter = new Intl.DateTimeFormat('en-US', {
					timeZone: 'UTC',
					weekday: 'long',
					year: 'numeric',
					month: 'long',
					day: 'numeric',
				});

				const rtcEmbed = new EmbedBuilder()
					.setColor(0x5865f2)
					.setTitle('🕒 RTC - Real Time Clock')
					.addFields(
						{ name: '⏰ Current Time', value: `\`\`\`${timeFormatter.format(now)}\`\`\``, inline: true },
						{ name: '📅 Date', value: dateFormatter.format(now), inline: true },
						{ name: '🌍 Timezone', value: '`RTC`', inline: false }
					)
					.setTimestamp()
					.setFooter({ text: `Requested by ${interaction.user.username}.`, iconURL: interaction.user.displayAvatarURL() });

				return await replyAndAutoDelete({ embeds: [rtcEmbed] });
			}

			// Normal city search
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
					content: `❌ Could not reach the timezone data for **"${name}"**.`,
				});
			}

			const now = new Date();

			const timeFormatter = new Intl.DateTimeFormat('en-US', {
				timeZone: timezone,
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				hour12: false,
			});

			const dateFormatter = new Intl.DateTimeFormat('en-US', {
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
				.setTitle(`🕒 ${name}, ${country || ''} - Local Time`)
				.addFields(
					{ name: '⏰ Current Time', value: `\`\`\`${formattedTime}\`\`\``, inline: true },
					{ name: '📅 Date', value: formattedDate, inline: true },
					{ name: '🌍 Timezone', value: `\`${timezone}\``, inline: false }
				)
				.setTimestamp()
				.setFooter({ text: `Requested by ${interaction.user.username}.`, iconURL: interaction.user.displayAvatarURL() });

			await replyAndAutoDelete({ embeds: [embed] });
		} catch (error) {
			console.error('Time command error:', error);
			await replyAndAutoDelete({
				content: '❌ An error occurred while fetching the time. Please try again later.',
			});
		}
	},
};
