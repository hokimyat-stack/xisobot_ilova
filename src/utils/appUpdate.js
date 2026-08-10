// src/utils/appUpdate.js
// GitHub Releases orqali yangi APK'ni yuklab olish va o'rnatish oynasini ochish.
//
// KERAKLI PAKETLAR (agar hali o'rnatilmagan bo'lsa):
//   npx expo install expo-file-system expo-intent-launcher
//
// KERAKLI RUXSAT — app.json ichida android.permissions ro'yxatiga qo'shing:
//   "permissions": ["REQUEST_INSTALL_PACKAGES"]
//
// FOYDALANISH (masalan HomeScreen.js ichida):
//   import { yangilanishniTekshir, apkYukla } from '../utils/appUpdate';
//
//   const yangi = await yangilanishniTekshir();
//   if (yangi.borMi) {
//     // foydalanuvchiga "Yangilash" tugmasini ko'rsating, bosilganda:
//     await apkYukla(yangi.apkUrl, (foiz) => setYuklashFoizi(foiz));
//   }

import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform, Alert } from 'react-native';
import { GITHUB_RELEASES, ILOVA_VERSIYA } from '../config';

/**
 * Versiya raqamlarini solishtiradi: '3.1.0' > '3.0.0' => true
 */
function versiyaKattami(yangi, joriy) {
  const a = String(yangi).replace(/^v/i, '').split('.').map(Number);
  const b = String(joriy).replace(/^v/i, '').split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] || 0, y = b[i] || 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false;
}

/**
 * GitHub Releases'dan eng so'nggi versiyani tekshiradi.
 * Qaytaradi: { borMi, versiya, apkUrl, izoh } yoki { borMi:false } / { xato }
 */
export async function yangilanishniTekshir() {
  try {
    const res = await fetch(GITHUB_RELEASES);
    if (!res.ok) return { borMi: false, xato: 'GitHub javob bermadi' };
    const rel = await res.json();

    const tagVersiya = String(rel.tag_name || '').replace(/^v/i, '');
    if (!tagVersiya) return { borMi: false, xato: "Versiya topilmadi" };

    if (!versiyaKattami(tagVersiya, ILOVA_VERSIYA)) {
      return { borMi: false };
    }

    // Release ichidan .apk asset'ni topamiz
    const apkAsset = (rel.assets || []).find(a => String(a.name || '').toLowerCase().endsWith('.apk'));
    if (!apkAsset) return { borMi: false, xato: "Release'da APK fayli topilmadi" };

    return {
      borMi: true,
      versiya: tagVersiya,
      apkUrl: apkAsset.browser_download_url,
      izoh: rel.body || ''
    };
  } catch (e) {
    return { borMi: false, xato: e.message };
  }
}

/**
 * APK faylini yuklab oladi va Android o'rnatish oynasini ochadi.
 * onProgress(foiz) — 0 dan 100 gacha, ixtiyoriy callback.
 */
export async function apkYukla(apkUrl, onProgress) {
  if (Platform.OS !== 'android') {
    Alert.alert('Diqqat', 'Avtomatik yangilanish faqat Android qurilmalarda ishlaydi');
    return;
  }

  const maqsadYol = FileSystem.cacheDirectory + 'yangilanish.apk';

  try {
    // Eski yuklangan fayl bo'lsa, tozalab qo'yamiz
    const mavjud = await FileSystem.getInfoAsync(maqsadYol);
    if (mavjud.exists) await FileSystem.deleteAsync(maqsadYol, { idempotent: true });

    const yuklash = FileSystem.createDownloadResumable(
      apkUrl,
      maqsadYol,
      {},
      (progress) => {
        if (onProgress) {
          const foiz = Math.round(
            (progress.totalBytesWritten / progress.totalBytesExpectedToWrite) * 100
          );
          onProgress(foiz);
        }
      }
    );

    const natija = await yuklash.downloadAsync();
    if (!natija || !natija.uri) throw new Error('Yuklab olish muvaffaqiyatsiz tugadi');

    // Android 7+ uchun content:// URI kerak (FileProvider orqali)
    const contentUri = await FileSystem.getContentUriAsync(natija.uri);

    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
      type: 'application/vnd.android.package-archive'
    });
  } catch (e) {
    Alert.alert('Xato', "APK yuklab olishda muammo: " + e.message);
    throw e;
  }
}
