const TelegramBot = require("node-telegram-bot-api");
const fs = require('fs'); // Fayllar bilan ishlash uchun modul

// Bot tokenini bu yerga joylashtiring
const token = "8033763849:AAHD3U4N0UzJhFl2MtnxdHQyoNopoAYf4dI";

// Sizning Telegram IDingiz (admin ID)
const adminId = 5545483477;

// Yangi bot yaratish
const bot = new TelegramBot(token, { polling: true });

// Foydalanuvchilarning holatini saqlash uchun obyekt
const userStates = {};

// Barcha noyob chat ID'larni saqlash uchun fayl yo'li
const USER_IDS_FILE = 'user_ids.json';
// Barcha foydalanuvchi ID'larini saqlash uchun Set (takrorlanmaydigan ro'yxat)
let allUserChatIds = new Set();

// Foydalanuvchi ID'larini fayldan yuklash
function loadUserIds() {
    if (fs.existsSync(USER_IDS_FILE)) {
        const data = fs.readFileSync(USER_IDS_FILE, 'utf8');
        allUserChatIds = new Set(JSON.parse(data));
        console.log(`Fayldan ${allUserChatIds.size} ta foydalanuvchi ID yuklandi.`);
    }
}

// Foydalanuvchi ID'larini faylga saqlash
function saveUserIds() {
    fs.writeFileSync(USER_IDS_FILE, JSON.stringify(Array.from(allUserChatIds)), 'utf8');
    console.log(`Foydalanuvchi ID'lari faylga saqlandi. Jami: ${allUserChatIds.size}`);
}

// Bot ishga tushganda ID'larni yuklash
loadUserIds();

// Bot buyruqlar menyusini o'rnatish
bot
  .setMyCommands([
    { command: "/start", description: "Botni ishga tushirish va xush kelibsiz xabarini olish" },
    { command: "/help", description: "Yordam va ma'lumot olish" },
    { command: "/info", description: "Do'kon haqida ma'lumot" },
    { command: "/broadcast", description: "Adminlar uchun: barcha foydalanuvchilarga xabar yuborish" } // Yangi buyruq
  ])
  .then(() => console.log("Buyruqlar menyusi muvaffaqiyatli o'rnatildi."))
  .catch((error) => console.error("Buyruqlar menyusini o'rnatishda xato:", error));

// Bot /start buyrug'ini qabul qilganda
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  // Foydalanuvchi holatini qayta tiklash
  userStates[chatId] = null;
  // Yangi foydalanuvchi ID'sini saqlash
  allUserChatIds.add(chatId);
  saveUserIds(); // Har safar /start bosilganda saqlash

  const welcomeMessage = `Assalomu alaykum Den aroma Oqbilol botiga Xush kelibsiz!😊

Yangi do’konimiz uchun QADRDONLARIMIZ’ni ehtiyojlarini o’rganayotgan edik.

PARFUMERIYA’ga oid qanday mahsulotlarni do'konimizda bo'lishini hohlaysiz?
(Misol uchun: erkaklar va ayollar atirlari, soda-sovun, bolalar uchun pamperslar va boshqalar🛍️)

Fikrva takliflaringizni birma-bir ko’rib chiqamiz.

`;

  // Tugmalarni aniqlash
  const keyboardOptions = {
    reply_markup: {
      keyboard: [
        [
          { text: "Takliflar" },
          {
            text: "Manzil",
          },
        ],
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    },
  };

  bot.sendMessage(chatId, welcomeMessage, keyboardOptions);
});

// Foydalanuvchining xabarlarini tinglash
bot.on("message", async (msg) => { // 'async' kalit so'zini qo'shdik
  const chatId = msg.chat.id;
  const text = msg.text;
  const user = msg.from;

  // Har bir xabar kelganda foydalanuvchi ID'sini saqlash (takrorlanmasligi uchun Set ishlatamiz)
  if (!allUserChatIds.has(chatId)) {
      allUserChatIds.add(chatId);
      saveUserIds();
  }

  // Agar foydalanuvchi 'Takliflar' tugmasini bosgan bo'lsa
  if (text === "Takliflar") {
    userStates[chatId] = "awaiting_feedback"; // Holatni belgilash
    bot.sendMessage(chatId, "Marhamat, taklif va so'rovingizni yozing:");
  }
  // Agar foydalanuvchi 'Manzil' tugmasini bosgan bo'lsa
  else if (text === "Manzil") {
    bot.sendMessage(chatId, "Oqbilol sentirida Abdurashid magazinchi do’koni yonida joylashgan.📍");
    userStates[chatId] = null; // Holatni qayta tiklash
  }
  // Agar foydalanuvchi avval 'awaiting_feedback' holatida bo'lgan bo'lsa va hozir xabar yuborsa
  else if (userStates[chatId] === "awaiting_feedback") {
    // Adminlarga foydalanuvchi taklifini yuborish
    const messageToAdmin = `Yangi taklif keldi (Boshqa):
Foydalanuvchi: ${user.first_name} ${user.last_name ? user.last_name : ""} (@${
      user.username ? user.username : "username yo'q"
    })
Taklif: ${text}`;

    bot.sendMessage(adminId, messageToAdmin);
    bot.sendMessage(chatId, " Taklif va So’rovingiz uchun tashakkur!☺️"); // Foydalanuvchiga tasdiqlash xabari
    userStates[chatId] = null; // Holatni qayta tiklash
  }
  // Agar foydalanuvchi boshqa buyruqlardan birini yuborgan bo'lsa (/start, /help, /info, /broadcast)
  else if (text.startsWith('/') && (text === '/start' || text === '/help' || text === '/info' || text.startsWith('/broadcast'))) {
    // Bu yerda hech narsa qilmaymiz, chunki ularni alohida bot.onText() handlerlari boshqaradi
    userStates[chatId] = null; // Holatni qayta tiklash
  }
  // Yuqoridagilardan hech biri bo'lmasa (matnli xabar va holat 'awaiting_feedback' emas)
  else {
      // Adminlarga foydalanuvchi xabarini yuborish
      const messageToAdmin = `Yangi xabar keldi (Erkin matn):
Foydalanuvchi: ${user.first_name} ${user.last_name ? user.last_name : ""} (@${
        user.username ? user.username : "username yo'q"
      })
Xabar: ${text}`;

      // Agar xabar admin IDdan kelmasa, adminlarga yuborish
      if (chatId !== adminId) {
          bot.sendMessage(adminId, messageToAdmin);
      }
      bot.sendMessage(chatId, " Taklif va So’rovingiz uchun tashakkur!☺️"); // Foydalanuvchiga tasdiqlash xabari
      userStates[chatId] = null; // Holatni qayta tiklash
  }
});

// /help buyrug'ini qabul qilganda
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  userStates[chatId] = null; // Holatni qayta tiklash
  bot.sendMessage(
    chatId,
    "Men sizga do'konimiz uchun mahsulotlar bo'yicha takliflar yuborishingizga yordam beraman. Shunchaki o'z fikringizni yozing yoki tugmalardan birini tanlang."
  );
});

// /info buyrug'ini qabul qilganda
bot.onText(/\/info/, (msg) => {
  const chatId = msg.chat.id;
  userStates[chatId] = null; // Holatni qayta tiklash
  bot.sendMessage(
    chatId,
    "Den Aroma Oqbilol — sizning sevimli atirlaringiz va parfyumeriya mahsulotlaringiz do'koni. Tez orada ochilamiz!"
  );
});

// --- YANGI QO'SHILGAN QISM: Ommaviy xabar yuborish (Broadcast) ---
// Faqat admin yubora oladigan /broadcast buyrug'i
bot.onText(/\/broadcast (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const messageToBroadcast = match[1]; // Buyruqdan keyingi matn

    // Faqat adminIDga teng foydalanuvchi bu buyruqdan foydalana oladi
    if (chatId === adminId) {
        let sentCount = 0;
        let failedCount = 0;

        bot.sendMessage(chatId, `Ommaviy xabar yuborish boshlandi. Jami ${allUserChatIds.size} foydalanuvchi.`, { parse_mode: 'HTML' });

        for (const targetChatId of allUserChatIds) {
            try {
                // Admin ID'ga qayta yubormaslik uchun tekshiramiz
                if (targetChatId == adminId) { // == ishlatdim, chunki Set ichida raqam, chatId esa string bo'lishi mumkin
                    continue;
                }
                await bot.sendMessage(targetChatId, messageToBroadcast);
                sentCount++;
                // Telegram API limitlarini hurmat qilish uchun kichik pauza
                await new Promise(resolve => setTimeout(resolve, 50)); // Har 50ms da bitta xabar
            } catch (error) {
                failedCount++;
                console.error(`Xabar yuborishda xato ${targetChatId} ga:`, error.message);
                // Agar foydalanuvchi botni bloklagan bo'lsa, uni ro'yxatdan o'chirish
                if (error.response && error.response.error_code === 403) {
                    console.log(`Foydalanuvchi ${targetChatId} botni bloklagan. Ro'yxatdan o'chirilmoqda.`);
                    allUserChatIds.delete(targetChatId);
                }
            }
        }
        saveUserIds(); // O'zgarishlarni saqlash

        bot.sendMessage(chatId, `Ommaviy xabar yuborish yakunlandi:
✅ Yuborildi: ${sentCount} ta
❌ Muvaffaqiyatsiz: ${failedCount} ta`);
    } else {
        bot.sendMessage(chatId, "Sizda bu buyruqni ishlatishga ruxsat yo'q.");
    }
});

console.log("Bot ishga tushdi...");