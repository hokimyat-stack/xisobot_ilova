# Xisobot Mobile V4 — Vazifalar integratsiyasi

Bu paket mavjud mobil ilovaning funksiyalarini saqlab, V4 Vazifalar markazini qo‘shadi.

## Qo‘shildi
- Mening vazifalarim bosh sahifasi va statistikasi
- Vazifalar ro‘yxati, qidiruv va holat filtrlari
- Vazifa tafsiloti, bosqichlar, muddat, rasm/GPS talabi
- 1 bosqichli, 3 bosqichli, ko‘p bosqichli va tasdiqlash vazifalari
- Vazifa hisoboti `vazifaId` / `vazifaBosqichId` bilan backendga yuboriladi
- Vazifa izohlari va muddat uzaytirish so‘rovi
- Bearer xodim tokeni barcha API so‘rovlarida avtomatik ishlatiladi
- Vazifa pushini bosganda Vazifalar sahifasiga yo‘naltirish
- Offline hisobot navbati vazifa ID larini ham saqlaydi

## Muhim
`app.json` ichida EAS projectId hali yo‘q. Expo Push uchun haqiqiy `extra.eas.projectId` keyingi production bosqichida sozlanadi.

GitHub Actions’dagi mavjud workflow har buildda vaqtinchalik keystore yaratadi. Bu production update uchun to‘g‘ri emas. V4 ni foydalanuvchilarga tarqatishdan oldin bir xil doimiy Android signing keystore GitHub Secrets orqali ulanadi.
