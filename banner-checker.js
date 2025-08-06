const fs = require('fs');
const fetch = require('node-fetch');
const { Telegraf } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const bot = new Telegraf(BOT_TOKEN);

const staticPrefixes = [
  "FW", "LW", "TW", "TT", "Token", "Tower", "Wheel", "Faded", "TU",
  "TopUp", "Topup", "TokenWheel", "FadedWheel", "TokenTower",
  "WV", "WonderVault", "Wonder", "Vault"
];

function normalize(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, '_')
    .trim();
}

async function sendToTelegram(url) {
  try {
    const res = await fetch(url);
    const buffer = await res.buffer();
    await bot.telegram.sendPhoto(CHAT_ID, { source: buffer }, { caption: url });
    console.log(`✅ Enviado: ${url}`);
  } catch (err) {
    console.error(`❌ Falha ao enviar ${url}:`, err.message);
  }
}

(async () => {
  try {
    const raw = fs.readFileSync('./OB50.json', 'utf-8');
    const json = JSON.parse(raw);

    const names = json
      .filter(item => item.Type === "BUNDLE" && item.Id >= 710047000)
      .map(item => normalize(item.name));

    let count = 0;

    for (const name of names) {
      const parts = name.split('_');
      const first = parts[0];

      const combos = new Set();

      combos.add(first);
      combos.add(`${first}_Bundle`);

      staticPrefixes.forEach(prefix => {
        combos.add(`${prefix}_${first}`);
        combos.add(`${prefix}_${name}`);
        combos.add(`${prefix}_${name}_Bundle`);
        combos.add(`${first}_${prefix}`);
        combos.add(`${name}_${prefix}`);
        combos.add(`${name}_${prefix}_Bundle`);
      });

      for (const combo of combos) {
        const url = `https://dl.dir.freefiremobile.com/common/OB50/BR/${combo}_1750x1070_BR_pt.png`;

        try {
          const res = await fetch(url);
          if (res.ok) {
            await sendToTelegram(url);
          } else {
            console.log(`❌ [${++count}] ${combo}`);
          }
        } catch (err) {
          console.log(`⚠️ Erro: ${combo}`, err.message);
        }

        await new Promise(r => setTimeout(r, 200)); // ~5 por segundo
      }
    }
  } catch (err) {
    console.error("Erro geral:", err.message);
  }
})();
