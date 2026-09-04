# Android signing — Windows uchun bir martalik sozlash

Bu versiyada GitHub Actions har buildda yangi keystore yaratmaydi. Bir xil doimiy keystore GitHub Secrets orqali ishlatiladi.

## Muhim
Agar avvalgi APK har buildda vaqtinchalik keystore bilan imzolangan bo'lsa va o'sha eski keystore saqlanmagan bo'lsa, yangi APK eski o'rnatilgan APK ustiga update bo'la olmaydi. Bir marta eski ilovani o'chirib, yangi doimiy-key APK'ni o'rnatish kerak bo'ladi. Keyingi barcha V4/V5 update'lar shu doimiy key bilan ustidan o'rnatiladi.

## GitHub repository secrets
Repository > Settings > Secrets and variables > Actions > New repository secret:

- ANDROID_KEYSTORE_BASE64
- ANDROID_KEYSTORE_PASSWORD
- ANDROID_KEY_ALIAS
- ANDROID_KEY_PASSWORD

Secret qiymatlarini chatga yubormang.
