const fs = require('fs');
const path = require('path');
const axios = require('axios');

// ============================================
// AUTOMOD (Root/data/warnings.json Persistently Recorded)
// ============================================

// The "data" folder and "warnings.json" file in the project root directory
const dataDir = path.join(process.cwd(), 'data');
const warningsFilePath = path.join(dataDir, 'warnings.json');

// Set of banned words to be populated dynamically
const badWordsSet = new Set();

const { hasModPermission, getWarnings, saveWarnings, removeWarnings, removeTimeout } = require('../utils/permissions');

/**
 * Fetches Turkish and English swear/banned word lists from GitHub repos.
 */
async function loadBadWords() {
  try {
    const trRepoUrl = 'https://raw.githubusercontent.com/osmancandulger/badword-filter/development/data/tr/swear.json';
    const enRepoUrl = 'https://raw.githubusercontent.com/osmancandulger/badword-filter/development/data/en/swear.json';

    const [trRes, enRes] = await Promise.all([
      axios.get(trRepoUrl),
      axios.get(enRepoUrl)
    ]);

    if (Array.isArray(trRes.data)) {
      trRes.data.forEach(word => badWordsSet.add(word.toLowerCase().trim()));
    }

    if (Array.isArray(enRes.data)) {
      enRes.data.forEach(word => badWordsSet.add(word.toLowerCase().trim()));
    }

    console.log(`[AutoMod] Total ${badWordsSet.size} banned words loaded.`);
  } catch (error) {
    console.error('[AutoMod] Error while fetching swear word list:', error.message);
  }
}

// Link check
function hasLink(text) {
  const lowerText = text.toLowerCase();

  return (
    lowerText.includes('http://') ||
    lowerText.includes('https://') ||
    lowerText.includes('www.') ||
    lowerText.includes('.com') ||
    lowerText.includes('.net') ||
    lowerText.includes('.org') ||
    lowerText.includes('.info') ||
    lowerText.includes('.biz') ||
    lowerText.includes('.edu') ||
    lowerText.includes('.gov') ||
    lowerText.includes('.xyz') ||
    lowerText.includes('.top') ||
    lowerText.includes('.site') ||
    lowerText.includes('.online') ||
    lowerText.includes('.store') ||
    lowerText.includes('.tech') ||
    lowerText.includes('.app') ||
    lowerText.includes('.dev') ||
    lowerText.includes('.pro') ||
    lowerText.includes('.live') ||
    lowerText.includes('.space') ||
    lowerText.includes('.shop') ||
    lowerText.includes('.club') ||
    lowerText.includes('.fun') ||
    lowerText.includes('.link') ||
    lowerText.includes('.art') ||
    lowerText.includes('.blog') ||
    lowerText.includes('.gg') ||
    lowerText.includes('.io') ||
    lowerText.includes('.ai') ||
    lowerText.includes('.co') ||
    lowerText.includes('.me') ||
    lowerText.includes('.tv') ||
    lowerText.includes('.tr') ||
    lowerText.includes('.com.tr') ||
    lowerText.includes('.net.tr') ||
    lowerText.includes('.org.tr') ||
    lowerText.includes('.uk') ||
    lowerText.includes('.de') ||
    lowerText.includes('.ru') ||
    lowerText.includes('.fr') ||
    lowerText.includes('.nl') ||
    lowerText.includes('.us') ||
    lowerText.includes('.ca') ||
    lowerText.includes('.eu')
  );
}

// Swear word check
function hasBadWord(text) {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);

  for (const word of words) {
    if (badWordsSet.has(word)) return true;
  }

  return false;
}

function setupAutomod(client) {
  // Perform initial file checks and load banned words
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(warningsFilePath)) {
    fs.writeFileSync(warningsFilePath, JSON.stringify({}, null, 2), 'utf-8');
  }

  loadBadWords();

  client.on('messageCreate', async (message) => {
    // Ignore the bot's own messages
    if (message.author.bot) return;

    // Completely ignore staff members
    if (message.member && await hasModPermission(message.member)) {
      return;
    }

    const text = message.content;

    // Stop if no violation found
    if (!hasLink(text) && !hasBadWord(text)) return;

    try {
      // Delete the message
      await message.delete();

      // Read current warning data from disk
      const warnings = getWarnings();
      const userId = message.author.id;

      // Increment the user's warning count by 1
      warnings[userId] = (warnings[userId] || 0) + 1;

      // Save the updated data into "root/data/warnings.json"
      saveWarnings(warnings);

      // Send warning message
      await message.channel.send(
        `⚠️ ${message.author}, this content is banned! Warning: ${warnings[userId]}/3`
      );

      // If 3 warnings reached, apply a 30-day timeout
      if (warnings[userId] >= 3) {
        const timeoutMs = 30 * 24 * 60 * 60 * 1000; // 30 days
        await message.member.timeout(timeoutMs, 'Reached 3-warning limit');
        await message.channel.send(`🔇 ${message.author} has been muted for 30 days.`);

        // Reset the user's warning count and update the file
        warnings[userId] = 0;
        saveWarnings(warnings);
      }
    } catch (err) {
      console.error('[AutoMod] Error during operation:', err.message);
    }
  });

  client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (oldMessage.author.bot) return;
    if (newMessage.member && await hasModPermission(newMessage.member)) {
      return;
    }

    const oldText = oldMessage.content;
    const newText = newMessage.content;

    if (hasLink(newText) || hasBadWord(newText)) {
      if (!hasLink(oldText) && !hasBadWord(oldText)) {
        try {
          await newMessage.delete();
          await newMessage.channel.send(
            `⚠️ ${newMessage.author}, your message was deleted! It violated the rules.`
          );
        } catch (err) {
          console.error('[AutoMod] Error while processing message update:', err.message);
        }
      }
    }
  });
}

module.exports = setupAutomod;