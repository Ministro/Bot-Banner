const fs = require("fs");
const https = require("https");
const path = require("path");

const axios = require("axios");

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const OB50_PATH = "./OB50.json"; // Você pode mudar esse caminho se necessário

const staticPrefixes = [
  "FW", "LW", "TW", "TT", "Token", "Tower", "Wheel", "Faded", "TU",
  "TopUp", "Topup", "TokenWheel", "FadedWheel", "TokenTower",
  "WV", "WonderVault", "Wonder", "Vault"
];

const normalize = (str) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/gi, "")
    .replace(/\s+/g, "_")
    .trim();
};

const fetchJson = () => {
  const raw = fs.readFileSync(OB50_PATH, "utf-8");
  const data = JSON.parse(raw);
  return data
    .filter(item => item.Type === "BUNDLE" && item.Id >= 710047001)
    .map(item => item.name)
    .filter(name => typeof name === "string" && name.trim() !== "")
    .map(normalize);
};

const generateCombos = (name) => {
  const parts = name.split("_");
  const base = parts[0]; // usar apenas a primeira parte
  const combos = new Set();

  combos.add(base);
  combos.add(`${base}_Bundle`);

  staticPrefixes.forEach(prefix => {
    combos.add(`${prefix}_${base}`);
    combos.add(`${prefix}_${base}_Bundle`);
    combos.add(`${base}_${prefix}`);
    combos.add(`${base}_${prefix}_Bundle`);
  });

  return Array.from(combos);
};

const validateImage = async (url) => {
  try {
    const res = await axios.head(url);
    return res.status === 200;
  } catch {
    return false;
  }
};

const sendToTelegram = async (imgUrl) => {
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`, {
      chat_id: TELEGRAM_CHAT_ID,
      photo: imgUrl,
      caption: `✅ Encontrado: ${imgUrl}`
    });
  } catch (err) {
    console.error("Erro ao enviar para o Telegram:", err.message);
  }
};

const main = async () => {
  const names = fetchJson();
  let validCount = 0;
  let invalidCount = 0;
  const found = [];

  for (const name of names) {
    const combos = generateCombos(name);

    for (const combo of combos) {
      const url = `https://dl.dir.freefiremobile.com/common/OB50/BR/${combo}_1750x1070_BR_pt.png`;
      const ok = await validateImage(url);

      if (ok) {
        console.log(`✅ [${validCount + 1}] ${combo}`);
        validCount++;
        found.push(url);
        await sendToTelegram(url);
      } else {
        console.log(`❌ [${invalidCount + 1}] ${combo}`);
        invalidCount++;
      }
    }
  }

  fs.writeFileSync("valid_banners.txt", found.join("\n"), "utf-8");
};

main().catch(err => {
  console.error("Erro geral:", err);
});
