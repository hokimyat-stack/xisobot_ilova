// src/api.js
import { API_URL } from './config';

// Umumiy POST so'rov yuborish (REST API formatida)
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
    
    if (!res.ok) throw new Error("Server xatosi: " + res.status);
    return await res.json();
    
  } catch (err) {
    console.error("Tarmoq xatosi:", err.message);
    return { ok: false, xato: "Tarmoq bilan ulanishda xato: " + err.message };
  }
}

// Umumiy GET so'rov yuborish (REST API formatida)
export async function get(endpoint, params = {}) {
  try {
    const q = new URLSearchParams(params).toString();
    const url = q ? `${API_URL}/${endpoint}?${q}` : `${API_URL}/${endpoint}`;
    
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!res.ok) throw new Error("Server xatosi: " + res.status);
    return await res.json();
    
  } catch (err) {
    console.error("Tarmoq xatosi:", err.message);
    return { ok: false, xato: "Tarmoq bilan ulanishda xato: " + err.message };
  }
}

// Mobil ilova uchun maxsus funksiyalar (Yangi backend marshrutlariga moslangan)
export const login = (pinfl, parol, deviceId) => post('xodim-login', { pinfl, parol, deviceId });
export const mfylarOl = () => get('mfylar');
export const kategoriyalarOl = () => get('kategoriyalar');
export const menikiOl = (xodimId) => get('hisobotlar', { xodim: xodimId });
export const parolAlmashtir = (xodimId, eskiParol, yangiParol) => post('xodimParolAlmashtir', { xodimId, eskiParol, yangiParol });
export const pushTokenSaqla = (xodimId, token) => post('pushTokenSaqla', { xodimId, token });
export const tahrirSora = (hisobotId, xodimId, xodimFio, sabab) => post('tahrirSora', { hisobotId, xodimId, xodimFio, sabab });
