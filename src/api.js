// src/api.js — Xisobot Mobile V4 API wrapper
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './config';

async function authHeaders() {
  try {
    const raw = await AsyncStorage.getItem('XODIM');
    const x = raw ? JSON.parse(raw) : null;
    const token = x?.xodimToken || '';
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (_) {
    return {};
  }
}

export async function post(endpoint, data) {
  try {
    const auth = await authHeaders();
    const res = await fetch(`${API_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...auth
      },
      body: JSON.stringify(data)
    });

    let json;
    try { json = await res.json(); }
    catch (_) { return { ok: false, xato: `Server noto'g'ri javob qaytardi (${res.status})` }; }

    if (!res.ok && json.ok === undefined) return { ok: false, xato: `Server xatosi (${res.status})` };
    return json;
  } catch (err) {
    console.error('Tarmoq xatosi:', err.message);
    return { ok: false, xato: 'Tarmoq bilan ulanishda xato: ' + err.message };
  }
}

export async function get(endpoint, params = {}) {
  try {
    const q = new URLSearchParams(params).toString();
    const url = q ? `${API_URL}/${endpoint}?${q}` : `${API_URL}/${endpoint}`;
    const auth = await authHeaders();
    const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json', ...auth } });

    let json;
    try { json = await res.json(); }
    catch (_) { return { ok: false, xato: `Server noto'g'ri javob qaytardi (${res.status})` }; }

    if (!res.ok && json.ok === undefined) return { ok: false, xato: `Server xatosi (${res.status})` };
    return json;
  } catch (err) {
    console.error('Tarmoq xatosi:', err.message);
    return { ok: false, xato: 'Tarmoq bilan ulanishda xato: ' + err.message };
  }
}

export const login = (pinfl, parol, deviceId) => post('xodim-login', { pinfl, parol, deviceId });
export const mfylarOl = () => get('mfylar');
export const kategoriyalarOl = () => get('kategoriyalar');
export const menikiOl = (xodimId) => get('hisobotlar', { xodim: xodimId });
export const parolAlmashtir = (xodimId, eskiParol, yangiParol) => post('xodimParolAlmashtir', { xodimId, eskiParol, yangiParol });
export const pushTokenSaqla = (xodimId, token) => post('pushTokenSaqla', { xodimId, token });
export const tahrirSora = (hisobotId, xodimId, xodimFio, sabab) => post('tahrirSora', { hisobotId, xodimId, xodimFio, sabab });

// V4 vazifalar
export const vazifalarimOl = (xodimId) => get('vazifalarim', { xodimId });
export const vazifaKorildi = (vazifaId) => post('vazifaKorildi', { vazifaId });
export const vazifaBoshla = (vazifaId) => post('vazifaBoshla', { vazifaId });
export const vazifaOddiyYakun = (vazifaId) => post('vazifaOddiyYakun', { vazifaId });
export const vazifaMuddatSora = (vazifaId, sabab) => post('vazifaMuddatSora', { vazifaId, sabab });
export const vazifaIzohlarOl = (vazifaId, xodimId) => get('vazifaIzohlar', { vazifaId, xodimId });
export const vazifaIzohQosh = (vazifaId, xodimId, matn) => post('vazifaIzohQosh', { vazifaId, xodimId, matn });

export const hisobotBoshla = (xodimId, ishTuri, ishNomi, tavsif, lat, lng, rasmlar, isBirBosqichli = true, extra = {}) =>
  post('hisobotBoshla', {
    xodimId, ishTuri, ishNomi, tavsif, lat, lng, rasmlar,
    deviceVaqt: new Date().toISOString(), isBirBosqichli, ...extra
  });

export const hisobotDavom = (hisobotId, tavsif, lat, lng, rasmlar, extra = {}) =>
  post('hisobotDavom', { hisobotId, tavsif, lat, lng, rasmlar, deviceVaqt: new Date().toISOString(), ...extra });

export const hisobotYakun = (hisobotId, tavsif, lat, lng, rasmlar, extra = {}) =>
  post('hisobotYakun', { hisobotId, tavsif, lat, lng, rasmlar, deviceVaqt: new Date().toISOString(), ...extra });
