import { API_URL, KALIT } from './config';

export async function post(action, data) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({ kalit: KALIT, action, ...data }),
      redirect: 'follow'
    });
    
    if (!res.ok) throw new Error("Server xatosi: " + res.status);
    return await res.json();
    
  } catch (err) {
    console.error("Tarmoq xatosi:", err.message);
    return { ok: false, xato: "Tarmoq bilan ulanishda xato: " + err.message };
  }
}

export async function get(action, params = {}) {
  try {
    const q = new URLSearchParams({ kalit: KALIT, action, ...params }).toString();
    const res = await fetch(API_URL + '?' + q, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      redirect: 'follow'
    });
    
    if (!res.ok) throw new Error("Server xatosi: " + res.status);
    return await res.json();
    
  } catch (err) {
    return { ok: false, xato: "Tarmoq bilan ulanishda xato: " + err.message };
  }
}

export const login = (pinfl, parol, deviceId) => post('login', { pinfl, parol, deviceId });
export const mfylarOl = () => get('mfylar');
export const kategoriyalarOl = () => get('kategoriyalar');
export const menikiOl = (xodimId) => get('meniki', { xodim: xodimId });
export const parolAlmashtir = (xodimId, eskiParol, yangiParol) => post('parolAlmashtir', { xodimId, eskiParol, yangiParol });
export const pushTokenSaqla = (xodimId, token) => post('pushTokenSaqla', { xodimId, token });
export const tahrirSora = (hisobotId, xodimId, xodimFio, sabab) => post('tahrirSora', { hisobotId, xodimId, xodimFio, sabab });
