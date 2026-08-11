// src/api.js — backend/server.js (tuzatilgan versiya)dagi barcha xodim uchun
// endpointlarga mos wrapper funksiyalar. Har bir funksiya nomi va parametrlari
// server.js dagi mos app.get/app.post yo'lini va body maydonlarini aynan takrorlaydi.
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
// Backenddagi (server.js) endpointlarga mos funksiyalar
// ==========================================

// Tizimga kirish (PINFL + parol + qurilma ID)
export const login = (pinfl, parol, deviceId) => post('xodim-login', { pinfl, parol, deviceId });

// Ochiq (kalitsiz) ma'lumotlar
export const mfylarOl = () => get('mfylar');
export const kategoriyalarOl = () => get('kategoriyalar');

// Xodimning o'z hisobotlari — GET /api/hisobotlar?xodim=...
// Backendda maxsus tuzatish qilingan: `xodim` haqiqiy ID bo'lsa, kalitsiz ham
// ruxsat beriladi, lekin natija har doim FAQAT o'sha xodimning yozuvlari bilan
// qat'iy cheklanadi.
export const menikiOl = (xodimId) => get('hisobotlar', { xodim: xodimId });

// Xodim amallari
export const parolAlmashtir = (xodimId, eskiParol, yangiParol) =>
  post('xodimParolAlmashtir', { xodimId, eskiParol, yangiParol });

export const pushTokenSaqla = (xodimId, token) => post('pushTokenSaqla', { xodimId, token });

export const tahrirSora = (hisobotId, xodimId, xodimFio, sabab) =>
  post('tahrirSora', { hisobotId, xodimId, xodimFio, sabab });

// 3 bosqichli hisobot yuborish — bevosita post() orqali NewReportScreen/StageScreen'da
// chaqiriladi (offline navbatga ham aynan shu action nomlari bilan qo'shiladi):
//   post('hisobotBoshla', {...})
//   post('hisobotDavom',  {...})
//   post('hisobotYakun',  {...})
