// src/queue.js — Offline navbat: internet yo'q bo'lsa hisobot saqlanadi,
// internet kelganda avtomatik yuboriladi
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { post } from './api';

const KEY = 'HISOBOT_NAVBAT';
let yuborilmoqda = false;

export async function navbatgaQosh(hisobot) {
  const navbat = await navbatOl();
  navbat.push({ ...hisobot, offline: true, qoshilganVaqt: new Date().toISOString() });
  await AsyncStorage.setItem(KEY, JSON.stringify(navbat));
}

export async function navbatOl() {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function navbatniYubor(onProgress) {
  if (yuborilmoqda) return { yuborildi: 0, qoldi: (await navbatOl()).length };
  yuborilmoqda = true;
  try {
    let navbat = await navbatOl();
    let yuborildi = 0;
    while (navbat.length > 0) {
      const net = await NetInfo.fetch();
      if (!net.isConnected) break;
      try {
        const res = await post('hisobot', navbat[0]);
        if (res.ok || res.flag) {
          // Muvaffaqiyatli yoki server rad etgan (takror rasm) — navbatdan chiqadi
          navbat.shift();
          yuborildi++;
          await AsyncStorage.setItem(KEY, JSON.stringify(navbat));
          onProgress && onProgress(yuborildi, navbat.length);
        } else break; // server xatosi — keyinroq urinamiz
      } catch (e) { break; } // tarmoq xatosi
    }
    return { yuborildi, qoldi: navbat.length };
  } finally { yuborilmoqda = false; }
}

// Internet paydo bo'lganda avtomatik yuborish
export function avtoSyncYoq(onProgress) {
  return NetInfo.addEventListener(state => {
    if (state.isConnected) navbatniYubor(onProgress);
  });
}
