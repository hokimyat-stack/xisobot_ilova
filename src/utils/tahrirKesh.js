// src/utils/tahrirKesh.js
// Backendda xodim o'zining tahrir-so'rovi holatini (KUTILMOQDA/RUXSAT_BERILDI/RAD_ETILDI)
// tekshirib ko'radigan GET endpoint yo'q — /api/tahrirSorovlari faqat admin/nazoratchi
// kaliti bilan ishlaydi. Shuning uchun ilova o'zi yuborgan so'rovlarni mahalliy (lokal)
// saqlaydi va admin ruxsat berganda/rad etganda keladigan push bildirishnomasini
// ko'rsatish uchun ishlatadi.
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOROVLAR_KALIT = 'TAHRIR_SOROVLARI';
const OXIRGI_JAVOB_KALIT = 'TAHRIR_OXIRGI_JAVOB';

// { [hisobotId]: { sabab, vaqt } }
export async function sorovlarniOl() {
  const raw = await AsyncStorage.getItem(SOROVLAR_KALIT);
  return raw ? JSON.parse(raw) : {};
}

export async function sorovQoshish(hisobotId, sabab) {
  const sorovlar = await sorovlarniOl();
  sorovlar[hisobotId] = { sabab, vaqt: new Date().toISOString() };
  await AsyncStorage.setItem(SOROVLAR_KALIT, JSON.stringify(sorovlar));
}

// Push orqali kelgan "tahrir" bildirishnomasini saqlaymiz — MyReportsScreen buni
// banner sifatida ko'rsatadi (qaysi hisobotga tegishli ekanini backend
// bildirmagani uchun umumiy xabar sifatida).
export async function oxirgiJavobniSaqla(title, body) {
  await AsyncStorage.setItem(
    OXIRGI_JAVOB_KALIT,
    JSON.stringify({ title, body, vaqt: new Date().toISOString(), ochilganMi: false })
  );
}

export async function oxirgiJavobniOl() {
  const raw = await AsyncStorage.getItem(OXIRGI_JAVOB_KALIT);
  return raw ? JSON.parse(raw) : null;
}

export async function oxirgiJavobniYopish() {
  await AsyncStorage.removeItem(OXIRGI_JAVOB_KALIT);
}
