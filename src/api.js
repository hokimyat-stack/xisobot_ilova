// src/api.js — backend/server.js dagi barcha xodim uchun
// endpointlarga mos wrapper funksiyalar. 

import { API_URL } from './config';

export async function post(endpoint, data) {
  try {
    const res = await fetch(`${API_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    let json;
    try {
      json = await res.json();
    } catch (e) {
      return { ok: false, xato: `Server noto'g'ri javob qaytardi (${res.status})` };
    }
    if (!res.ok && json.ok === undefined) {
      return { ok: false, xato: `Server xatosi (${res.status})` };
    }
    return json;

  } catch (err) {
    console.error("Tarmoq xatosi:", err.message);
    return { ok: false, xato: "Tarmoq bilan ulanishda xato: " + err.message };
  }
}

export async function get(endpoint, params = {}) {
  try {
    const q = new URLSearchParams(params).toString();
    const url = q ? `${API_URL}/${endpoint}?${q}` : `${API_URL}/${endpoint}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    let json;
    try {
      json = await res.json();
    } catch (e) {
      return { ok: false, xato: `Server noto'g'ri javob qaytardi (${res.status})` };
    }
    if (!res.ok && json.ok === undefined) {
      return { ok: false, xato: `Server xatosi (${res.status})` };
    }
    return json;

  } catch (err) {
    console.error("Tarmoq xatosi:", err.message);
    return { ok: false, xato: "Tarmoq bilan ulanishda xato: " + err.message };
  }
}

// ==========================================
// TIZIM VA PROFIL AMALLARI
// ==========================================

// Tizimga kirish (PINFL + parol + qurilma ID)
export const login = (pinfl, parol, deviceId) => 
  post('xodim-login', { pinfl, parol, deviceId });

// Ochiq (kalitsiz) ma'lumotlar
export const mfylarOl = () => get('mfylar');
export const kategoriyalarOl = () => get('kategoriyalar');

// Xodimning o'z hisobotlari (xodimId orqali)
export const menikiOl = (xodimId) => get('hisobotlar', { xodim: xodimId });

// Xodim amallari
export const parolAlmashtir = (xodimId, eskiParol, yangiParol) =>
  post('xodimParolAlmashtir', { xodimId, eskiParol, yangiParol });

export const pushTokenSaqla = (xodimId, token) => 
  post('pushTokenSaqla', { xodimId, token });

// Xato ketgan hisobotni qayta tahrirlash uchun ruxsat so'rash
export const tahrirSora = (hisobotId, xodimId, xodimFio, sabab) =>
  post('tahrirSora', { hisobotId, xodimId, xodimFio, sabab });


// ==========================================
// HISOBOT YUBORISH AMALLARI (1 VA 3 BOSQICHLI)
// ==========================================

// 1-bosqich: Yangi ish boshlash (Yoki 1 bosqichli qilib to'liq yopish)
export const hisobotBoshla = (xodimId, ishTuri, ishNomi, tavsif, lat, lng, rasmlar, isBirBosqichli = true) => {
  return post('hisobotBoshla', {
    xodimId,
    ishTuri,
    ishNomi,
    tavsif,
    lat,
    lng,
    rasmlar,
    deviceVaqt: new Date().toISOString(),
    isBirBosqichli // Backend ushbu parametr orqali qanday yopishni biladi
  });
};

// 2-bosqich: Ish jarayonini yuborish (Faqat 3 bosqichli rejimda)
export const hisobotDavom = (hisobotId, tavsif, lat, lng, rasmlar) => {
  return post('hisobotDavom', {
    hisobotId,
    tavsif,
    lat,
    lng,
    rasmlar,
    deviceVaqt: new Date().toISOString()
  });
};

// 3-bosqich: Ishni to'liq yakunlash (Faqat 3 bosqichli rejimda)
export const hisobotYakun = (hisobotId, tavsif, lat, lng, rasmlar) => {
  return post('hisobotYakun', {
    hisobotId,
    tavsif,
    lat,
    lng,
    rasmlar,
    deviceVaqt: new Date().toISOString()
  });
};
