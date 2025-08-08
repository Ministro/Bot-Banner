import fetch from "node-fetch";
import TelegramBot from "node-telegram-bot-api";

const TELEGRAM_TOKEN = "7496271293:AAEnc7H3_GeGAY3NhTmUehLuAn-SEISc8B0";
const TELEGRAM_CHAT_ID = "-1002558895285";

const bot = new TelegramBot(TELEGRAM_TOKEN);

const lettersAny = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const digits = "123456789";
const hVariants = ["h", "H"];
const lettersUpper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const OB_VERSION = "OB50";
const BASE_NAME = "TWPain";

let count = 0;

async function testImage(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

async function sendTelegramMessage(msg) {
  try {
    await bot.sendMessage(TELEGRAM_CHAT_ID, msg);
    console.log("Mensagem enviada:", msg);
  } catch (err) {
    console.error("Erro ao enviar mensagem Telegram:", err.message);
  }
}

async function run() {
  await sendTelegramMessage("🔍 Iniciando buscas de imagens no Free Fire...");

  for (const p1 of lettersAny) {
    for (const p2 of digits) {
      for (const p3 of hVariants) {
        for (const p4 of lettersUpper) {
          for (const p5 of lettersUpper) {
            count++;
            if (count % 10000 === 0) {
              console.log(`Testadas ${count} combinações até agora...`);
            }

            const code = `${p1}${p2}${p3}${p4}${p5}`;
            const url = `https://dl.aw.freefiremobile.com/common/${OB_VERSION}/BR/gacha/${code}${BASE_NAME}_pt_br.png`;

            const exists = await testImage(url);
            if (exists) {
              const message = `✅ Imagem encontrada!\n${url}`;
              await sendTelegramMessage(message);
              console.log("Parando execução após achar imagem.");
              return;
            }
          }
        }
      }
    }
  }
  await sendTelegramMessage("🔎 Busca finalizada, nenhuma imagem encontrada.");
  console.log("Busca finalizada, nenhuma imagem encontrada.");
}

run();
