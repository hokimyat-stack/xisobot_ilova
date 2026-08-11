// src/utils/pushNotifications.js
// Expo Push bildirishnomalariga ro'yxatdan o'tkazish va tokenni backendga saqlash.
//
// DIQQAT — EAS Project ID: push token olish uchun (SDK 49+) odatda EAS project ID kerak
// bo'ladi. Buni sozlash uchun terminalda: `eas init` buyrug'ini ishga tushiring —
// u avtomatik ravishda app.json (yoki app.config.js) ichiga quyidagicha yozadi:
//   "extra": { "eas": { "projectId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" } }
// Agar bu hali sozlanmagan bo'lsa, quyidagi kod xatoni "yutib" jim davom etadi —
// ya'ni ilova ishlashda davom etadi, faqat push bildirishnoma kelmaydi.
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pushTokenSaqla } from '../api';

// Ilova old planda bo'lganda ham bildirishnoma ko'rinishi (banner + tovush) uchun.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    // SDK 54'dagi yangi maydonlar (eskisi bilan ham mos):
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Xodim tizimga kirgach (yoki Bosh sahifa ochilganda) chaqiriladi.
 * Push tokenni oladi va agar hali saqlanmagan/eskirgan bo'lsa backendga yuboradi.
 * Har qanday xato jim yutiladi — bu ixtiyoriy (best-effort) funksiya, ilova ishlashiga
 * xalaqit bermasligi kerak.
 */
export async function pushTokenRoyxatdanOtkaz(xodimId) {
  try {
    if (!xodimId) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Bildirishnomalar',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const ruxsatSorovi = await Notifications.requestPermissionsAsync();
      status = ruxsatSorovi.status;
    }
    if (status !== 'granted') return; // Foydalanuvchi ruxsat bermadi — indamay chiqamiz

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId;

    const tokenNatija = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    const token = tokenNatija?.data;
    if (!token) return;

    // Takroriy so'rov yubormaslik uchun — token va xodimId o'zgarmagan bo'lsa qayta yubormaymiz
    const oldiKalit = `PUSH_TOKEN_YUBORILDI_${xodimId}`;
    const oldingi = await AsyncStorage.getItem(oldiKalit);
    if (oldingi === token) return;

    const res = await pushTokenSaqla(xodimId, token);
    if (res?.ok) {
      await AsyncStorage.setItem(oldiKalit, token);
    }
  } catch (e) {
    console.log("Push token ro'yxatdan o'tkazilmadi (e'tiborsiz qoldirildi):", e?.message);
  }
}

/**
 * Kelgan bildirishnoma tahrir so'rovi bilan bog'liqmi — matn asosida aniqlaydi.
 * (Backend hozircha data payload'ida hisobotId yubormaydi, shuning uchun sarlavha
 * matniga qarab aniqlaymiz.)
 */
export function tahrirBildirishnomasimi(sarlavha = '') {
  const t = sarlavha.toLowerCase();
  return t.includes('tahrir');
}
