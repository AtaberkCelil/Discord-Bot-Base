require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

// 'commands' klasörü var mı kontrol et
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
    } else {
      console.log(`[UYARI] ${filePath} dosyasında gerekli "data" veya "execute" özelliği eksik.`);
    }
  }
} else {
  console.error("❌ 'commands' adında bir klasör bulunamadı! Lütfen komut dosyalarınızı 'commands' klasörüne koyun.");
  process.exit(1);
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`${commands.length} adet uygulama (slash) komutu Discord API'ye gönderiliyor...`);

    // Global olarak tüm sunucularda komutları aktif eder
    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );

    console.log(`✅ ${data.length} adet uygulama (slash) komutu başarıyla yüklendi ve aktifleştirildi!`);
  } catch (error) {
    console.error('❌ Komutlar yüklenirken hata oluştu:', error);
  }
})();