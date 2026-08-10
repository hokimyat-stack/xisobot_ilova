// src/screens/HomeScreen.js — Bosh sahifa v3: yangi ish, davom etayotgan ishlar, parol (Theme qo'shilgan)
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, RefreshControl, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navbatOl, navbatniYubor } from '../queue';
import { menikiOl } from '../api';
import { RANG, ILOVA_VERSIYA } from '../config';
import { yangilanishniTekshir, apkYukla } from '../utils/appUpdate';

export default function HomeScreen({ route, navigation }) {
  // App.js'dan kelgan theme parametrlari
  const { isDarkMode, toggleTheme } = route.params || {};

  const [xodim, setXodim] = useState(null);
  const [navbatSoni, setNavbatSoni] = useState(0);
  const [yangilanish, setYangilanish] = useState(null); // {borMi, versiya, apkUrl, izoh}
  const [yuklanmoqda, setYuklanmoqda] = useState(false);
  const [yuklashFoizi, setYuklashFoizi] = useState(0);
  const [refresh, setRefresh] = useState(false);
  const [davomEtayotgan, setDavomEtayotgan] = useState([]);
  const [kutish, setKutish] = useState(true);

  const yangila = useCallback(async () => {
    const xRaw = await AsyncStorage.getItem('XODIM');
    if (!xRaw) return;
    const x = JSON.parse(xRaw);
    setXodim(x);
    setNavbatSoni((await navbatOl()).length);
    try {
      const res = await menikiOl(x.id);
      if (res.ok) {
        // Bosqichi tugallanmagan hisobotlar — "davom etayotgan"
        setDavomEtayotgan(res.hisobotlar.filter(h => h.bosqich !== 'YAKUNLANDI'));
      }
    } catch (e) {}
    setKutish(false);
  }, []);

  useFocusEffect(useCallback(() => { yangila(); }, [yangila]));

  useEffect(() => {
    yangilanishniTekshir().then(r => { if (r.borMi) setYangilanish(r); }).catch(() => {});
  }, []);

  async function yangilashBosildi() {
    setYuklanmoqda(true);
    setYuklashFoizi(0);
    try {
      await apkYukla(yangilanish.apkUrl, setYuklashFoizi);
    } catch (e) {} finally {
      setYuklanmoqda(false);
    }
  }

  async function navbatYuborQolda() {
    const res = await navbatniYubor();
    setNavbatSoni(res.qoldi);
    Alert.alert('Sinxronizatsiya',
      res.yuborildi + " ta hisobot yuborildi." + (res.qoldi ? ' ' + res.qoldi + " ta navbatda." : " Navbat bo'sh."));
  }

  function chiqish() {
    Alert.alert('Chiqish', 'Hisobdan chiqmoqchimisiz?', [
      { text: 'Bekor' },
      { text: 'Chiqish', style: 'destructive', onPress: async () => {
        await AsyncStorage.removeItem('XODIM');
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }}
    ]);
  }

  const bugun = new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', weekday: 'long' });
  const BOSQICH_NOMI = { BOSHLANDI: 'Boshlandi — davom bosqichi kerak', DAVOM_ETMOQDA: 'Davom etmoqda — yakun kerak' };

  // Dinamik ranglar (Theme asosida)
  const bgStyle = { backgroundColor: isDarkMode ? '#0F172A' : RANG.fon };
  const cardBgStyle = { backgroundColor: isDarkMode ? '#1E293B' : RANG.oq, borderColor: isDarkMode ? '#334155' : RANG.chiziq };
  const textPrimary = { color: isDarkMode ? '#F8FAFC' : RANG.toq };
  const textSecondary = { color: isDarkMode ? '#94A3B8' : RANG.kul };

  return (
    <ScrollView style={[s.wrap, bgStyle]} refreshControl={<RefreshControl refreshing={refresh} onRefresh={async () => { setRefresh(true); await yangila(); setRefresh(false); }} />}>
      
      {/* Header qismi: Salomlashuv, Chiqish va Theme almashtirgich */}
      <View style={[s.header, cardBgStyle]}>
        <View style={{ flex: 1 }}>
          <Text style={[s.salom, textSecondary]}>Assalomu alaykum,</Text>
          <Text style={[s.fio, textPrimary]}>{xodim?.fio || ''}</Text>
          <Text style={[s.bolim, textSecondary]}>{bugun}</Text>
        </View>

        {/* O'ng tarafda Chiqish tugmasining yonidagi Theme va Chiqish bloki */}
        <View style={s.headerRight}>
          {/* Theme almashtirish tugmasi (🌙 / ☀️) */}
          <TouchableOpacity 
            style={[s.themeBtn, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]} 
            onPress={toggleTheme}
          >
            <Text style={{ fontSize: 16 }}>{isDarkMode ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={chiqish}>
            <Text style={s.chiqish}>Chiqish</Text>
          </TouchableOpacity>
        </View>
      </View>

      {yangilanish && (
        <View style={s.yangiBanner}>
          <Text style={s.yangiText}>Yangi versiya mavjud: v{yangilanish.versiya}</Text>
          {yuklanmoqda ? (
            <View style={s.yangiYuklashWrap}>
              <ActivityIndicator size="small" color="#8A6200" />
              <Text style={s.yangiYuklashText}>{yuklashFoizi}% yuklandi...</Text>
            </View>
          ) : (
            <TouchableOpacity style={s.yangiBtn} onPress={yangilashBosildi}>
              <Text style={s.yangiBtnText}>Yangilash</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {navbatSoni > 0 && (
        <TouchableOpacity style={s.navbatCard} onPress={navbatYuborQolda}>
          <Text style={s.navbatSon}>{navbatSoni}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.navbatTitle}>ta hisobot navbatda (offline)</Text>
            <Text style={s.navbatSub}>Internet borligida bosing — hoziroq yuboriladi</Text>
          </View>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={s.asosiyBtn} onPress={() => navigation.navigate('NewReport', { isDarkMode, toggleTheme })}>
        <Text style={s.asosiyPlus}>＋</Text>
        <Text style={s.asosiyText}>YANGI ISH BOSHLASH</Text>
        <Text style={s.asosiySub}>1-bosqich: boshlandi</Text>
      </TouchableOpacity>

      {kutish ? <ActivityIndicator style={{ marginTop: 10 }} color={RANG.asosiy} /> : (
        davomEtayotgan.length > 0 && (
          <View style={s.davomWrap}>
            <Text style={[s.davomSarlavha, textPrimary]}>Davom etayotgan ishlaringiz ({davomEtayotgan.length})</Text>
            {davomEtayotgan.map(h => (
              <TouchableOpacity key={h.id} style={[s.davomCard, cardBgStyle]}
                onPress={() => navigation.navigate('Stage', { hisobot: h, isDarkMode, toggleTheme })}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.davomIsh, textPrimary]} numberOfLines={1}>{h.ishNomi || h.ishTuri}</Text>
                  <Text style={s.davomBosqich}>{BOSQICH_NOMI[h.bosqich]}</Text>
                </View>
                <Text style={s.davomOq}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )
      )}

      <TouchableOpacity style={[s.ikkinchiBtn, cardBgStyle]} onPress={() => navigation.navigate('MyReports', { isDarkMode, toggleTheme })}>
        <Text style={[s.ikkinchiText, textPrimary]}>Mening hisobotlarim</Text>
        <Text style={[s.ikkinchiSub, textSecondary]}>Tarix, statuslar va oylik statistika</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[s.ikkinchiBtn, cardBgStyle]} onPress={() => navigation.navigate('PasswordChange', { isDarkMode, toggleTheme })}>
        <Text style={[s.ikkinchiText, textPrimary]}>Parolni almashtirish</Text>
        <Text style={[s.ikkinchiSub, textSecondary]}>Xavfsizlik uchun tavsiya etiladi</Text>
      </TouchableOpacity>

      <View style={[s.info, cardBgStyle]}>
        <Text style={[s.infoTitle, textPrimary]}>Eslatmalar</Text>
        <Text style={[s.infoRow, textSecondary]}>• Har ish 3 bosqichda yuklanadi: boshlandi → davom etmoqda → yakunlandi</Text>
        <Text style={[s.infoRow, textSecondary]}>• Rasmlar faqat kameradan olinadi</Text>
        <Text style={[s.infoRow, textSecondary]}>• Rad etilgan hisobotga bildirishnoma keladi, sababi ko'rsatiladi</Text>
        <Text style={[s.infoRow, textSecondary]}>• Belgilangan vaqtda keyingi bosqich uchun eslatma keladi</Text>
      </View>

      <Text style={[s.versiya, textSecondary]}>SysOne · Kunlik Hisobot v{ILOVA_VERSIYA}</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 54, borderBottomWidth: 1 },
  salom: { fontSize: 13 },
  fio: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  bolim: { fontSize: 12.5, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  themeBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  chiqish: { color: RANG.qizil, fontWeight: '600', fontSize: 13 },
  yangiBanner: { backgroundColor: '#FFF6E5', margin: 16, marginBottom: 0, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#F1D48A' },
  yangiText: { color: '#8A6200', fontSize: 13, fontWeight: '600' },
  yangiYuklashWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  yangiYuklashText: { color: '#8A6200', fontSize: 12.5, fontWeight: '600' },
  yangiBtn: { backgroundColor: '#8A6200', borderRadius: 8, paddingVertical: 9, alignItems: 'center', marginTop: 10 },
  yangiBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  navbatCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FFF1EF', margin: 16, marginBottom: 0, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#F3C1BB' },
  navbatSon: { fontSize: 30, fontWeight: '800', color: RANG.qizil },
  navbatTitle: { fontWeight: '700', color: RANG.toq },
  navbatSub: { color: RANG.kul, fontSize: 12, marginTop: 2 },
  asosiyBtn: { backgroundColor: RANG.asosiy, margin: 16, borderRadius: 16, padding: 24, alignItems: 'center', elevation: 4 },
  asosiyPlus: { fontSize: 36, color: '#fff', lineHeight: 40 },
  asosiyText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5, marginTop: 6 },
  asosiySub: { color: '#CFE0F7', fontSize: 12, marginTop: 6 },
  davomWrap: { marginHorizontal: 16, marginTop: 4 },
  davomSarlavha: { fontWeight: '700', fontSize: 13, marginBottom: 8 },
  davomCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1 },
  davomIsh: { fontWeight: '700', fontSize: 14 },
  davomBosqich: { color: RANG.sariq, fontSize: 12, marginTop: 3, fontWeight: '600' },
  davomOq: { fontSize: 20, color: RANG.asosiy },
  ikkinchiBtn: { marginHorizontal: 16, marginTop: 10, borderRadius: 14, padding: 18, borderWidth: 1 },
  ikkinchiText: { fontWeight: '700', fontSize: 16 },
  ikkinchiSub: { fontSize: 12.5, marginTop: 3 },
  info: { margin: 16, borderRadius: 14, padding: 16, borderWidth: 1 },
  infoTitle: { fontWeight: '700', marginBottom: 8 },
  infoRow: { fontSize: 13, lineHeight: 22 },
  versiya: { textAlign: 'center', fontSize: 11.5, marginBottom: 24 }
});
