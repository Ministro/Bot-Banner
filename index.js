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
const BASE_NAME = "FWMP40FinalShotTitleUs";

const CONCURRENCY_LIMIT = 20; // quantas requisições simultâneas

let count = 0;
let found = false;

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

// Função para gerar todas as combinações
function* generateCodes() {
  for (const p1 of lettersAny) {
    for (const p2 of digits) {
      for (const p3 of hVariants) {
        for (const p4 of lettersUpper) {
          for (const p5 of lettersUpper) {
            yield `${p1}${p2}${p3}${p4}${p5}`;
          }
        }
      }
    }
  }
}

async function run() {
  await sendTelegramMessage("🔍 Iniciando buscas de imagens no Free Fire...");

  const codesGenerator = generateCodes();
  const promises = [];
  let running = 0;

  return new Promise((resolve) => {
    function next() {
      if (found) return resolve();

      const nextCodeObj = codesGenerator.next();

      if (nextCodeObj.done) {
        // Quando acabar códigos, aguarda todas as promessas finalizarem
        Promise.all(promises).then(() => {
          if (!found) {
            sendTelegramMessage("🔎 Busca finalizada, nenhuma imagem encontrada.");
            console.log("Busca finalizada, nenhuma imagem encontrada.");
          }
          resolve();
        });
        return;
      }

      const code = nextCodeObj.value;
      count++;

      const url = `https://dl.aw.freefiremobile.com/common/${OB_VERSION}/BR/gacha/${code}${BASE_NAME}_pt_br.png`;

      // Loga cada combinação no console
      console.log(`Testando combinação #${count}: ${code}`);

      // Envia mensagem a cada 10.000 combinações
      if (count % 10000 === 0) {
        sendTelegramMessage(`⚙️ ${count} combinações testadas até agora...`);
      }

      running++;
      const p = testImage(url).then((exists) => {
        running--;

        if (exists && !found) {
          found = true;
          const message = `✅ Imagem encontrada!\n${url}`;
          sendTelegramMessage(message);
          console.log("Parando execução após achar imagem.");
          resolve();
        } else {
          if (!found) next(); // Chama próxima requisição se não achou
        }
      });

      promises.push(p);

      // Controla o número de requisições paralelas
      if (running < CONCURRENCY_LIMIT) {
        next();
      }
    }

    // Inicia as primeiras requisições paralelas até o limite
    for (let i = 0; i < CONCURRENCY_LIMIT; i++) {
      next();
    }
  });
}

run();
