// src/screens/NewReportScreen.js — 1-BOSQICH: Ish boshlash
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import { post } from '../api';
import { navbatgaQosh } from '../queue';
import { RANG } from '../config';

export default function NewReportScreen({ navigation }) {
  const [xodim, setXodim] = useState(null);
  const [ishNomi, setIshNomi] = useState('');
  const [tavsif, setTavsif] = useState('');
  const [rasmlar, setRasmlar] = useState([]);
  const [gps, setGps] = useState(null);
  const [gpsXato, setGpsXato] = useState('');
  const [yuborilmoqda, setYuborilmoqda] = useState(false);

  useEffect(() => {
    (async () => {
      const x = await AsyncStorage.getItem('XODIM');
      setXodim(JSON.parse(x));
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setGpsXato('Lokatsiya ruxsati berilmadi — hisobot yuborilmaydi'); return; }
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setGps({ lat: loc.coords.latitude, lng: loc.coords.longitude, mocked: loc.mocked === true });
      } catch { setGpsXato('GPS aniqlanmadi. Lokatsiyani yoqing va qayta urining'); }
    })();
  }, []);

  function rasmQosh() {
    if (rasmlar.length >= 5) return Alert.alert('Cheklov', "Ko'pi bilan 5 ta rasm");
    if (!gps) return Alert.alert('GPS', 'Avval lokatsiya aniqlanishi kerak');
    navigation.navigate('Camera', { xodimId: xodim.id, gps, onRasm: (r) => setRasmlar(prev => [...prev, r]) });
  }

  async function yubor() {
    if (!ishNomi.trim()) return Alert.alert("To'ldiring", 'Ish nomini kiriting');
    if (tavsif.trim().length < 20) return Alert.alert("To'ldiring", 'Tavsif kamida 20 belgi bo\'lishi kerak');
    if (rasmlar.length === 0) return Alert.alert("To'ldiring", 'Kamida 1 ta rasm oling');
    if (!gps) return Alert.alert('GPS', gpsXato || 'Lokatsiya hali aniqlanmadi');
    if (gps.mocked) Alert.alert('Diqqat', 'Qurilmangizda soxta GPS aniqlandi. Hisobot rad etiladi va qayd qilinadi.');

    const hisobot = {
      xodimId: xodim.id, deviceId: xodim.deviceId,
      ishTuri: 'Umumiy', ishNomi: ishNomi.trim(), tavsif: tavsif.trim(),
      lat: gps.lat, lng: gps.lng, mocked: gps.mocked,
      deviceVaqt: new Date().toISOString(),
      rasmlar: rasmlar.map(r => r.b64)
    };

    setYuborilmoqda(true);
    const net = await NetInfo.fetch();
    try {
      if (net.isConnected) {
        const res = await post('hisobotBoshla', hisobot);
        if (res.ok) {
          Alert.alert('Boshlandi ✓',
            "1-bosqich qabul qilindi. Ish davom etganida 'Davom etmoqda' bosqichini yuklashni unutmang." +
            (res.flaglar?.length ? '\n\nEslatma: ' + res.flaglar.join('\n') : ''),
            [{ text: 'OK', onPress: () => navigation.goBack() }]);
        } else Alert.alert('Rad etildi', res.xato);
      } else {
        await navbatgaQosh({ ...hisobot, action: 'hisobotBoshla' });
        Alert.alert('Offline saqlandi', "Internet yo'q. Internet kelganda avtomatik yuboriladi.",
          [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch (e) {
      await navbatgaQosh({ ...hisobot, action: 'hisobotBoshla' });
      Alert.alert('Navbatga saqlandi', 'Serverga ulanib bo\'lmadi.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } finally { setYuborilmoqda(false); }
  }

  return (
    <View style={{ flex: 1, backgroundColor: RANG.fon }}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.orqaga}>← Orqaga</Text></TouchableOpacity>
        <Text style={s.title}>Yangi ish — 1-bosqich</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={[s.gpsCard, { borderColor: gps ? (gps.mocked ? RANG.qizil : RANG.yashil) : RANG.sariq }]}>
          <Text style={{ fontWeight: '700', color: gps ? (gps.mocked ? RANG.qizil : RANG.yashil) : RANG.sariq }}>
            {gps ? (gps.mocked ? '⚠ Soxta GPS aniqlandi!' : '✓ Lokatsiya aniqlandi') : (gpsXato || 'GPS aniqlanmoqda...')}
          </Text>
          {gps && <Text style={s.gpsKoord}>{gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}</Text>}
        </View>

        <Text style={s.label}>Ish nomi *</Text>
        <TextInput style={s.input} value={ishNomi} onChangeText={setIshNomi} placeholder="Masalan: Markaziy ko'cha obodonlashtirish" />

        <Text style={s.label}>Boshlanish tavsifi * (kamida 20 belgi)</Text>
        <TextInput style={[s.input, { height: 110, textAlignVertical: 'top' }]} value={tavsif}
          onChangeText={setTavsif} multiline placeholder="Ish qanday boshlandi, qayerda, nima rejalashtirilgan..." />

        <Text style={s.label}>Rasmlar * (1–5 ta, faqat kameradan)</Text>
        <View style={s.rasmQator}>
          {rasmlar.map((r, i) => (
            <View key={i} style={s.rasmBox}>
              <Image source={{ uri: r.uri }} style={s.rasm} />
              <TouchableOpacity style={s.rasmOchir} onPress={() => setRasmlar(prev => prev.filter((_, j) => j !== i))}>
                <Text style={{ color: '#fff', fontWeight: '800' }}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
          {rasmlar.length < 5 && (
            <TouchableOpacity style={s.rasmQoshBtn} onPress={rasmQosh}>
              <Text style={{ fontSize: 26, color: RANG.asosiy }}>📷</Text>
              <Text style={{ fontSize: 11, color: RANG.asosiy, fontWeight: '600' }}>Surat olish</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={[s.yuborBtn, yuborilmoqda && { opacity: 0.6 }]} onPress={yubor} disabled={yuborilmoqda}>
          {yuborilmoqda ? <ActivityIndicator color="#fff" /> : <Text style={s.yuborText}>1-BOSQICHNI YUBORISH</Text>}
        </TouchableOpacity>
        <Text style={s.ogohlantirish}>Keyingi bosqichlarni "Bosh sahifa → Davom etayotgan ishlar" dan yuklaysiz</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 52, backgroundColor: RANG.oq, borderBottomWidth: 1, borderColor: RANG.chiziq },
  orqaga: { color: RANG.asosiy, fontSize: 15, fontWeight: '600', width: 70 },
  title: { fontSize: 16, fontWeight: '800', color: RANG.toq },
  gpsCard: { backgroundColor: RANG.oq, borderRadius: 12, borderWidth: 1.5, padding: 13, marginBottom: 6 },
  gpsKoord: { color: RANG.kul, fontSize: 12, marginTop: 3 },
  label: { fontSize: 13, fontWeight: '700', color: RANG.toq, marginTop: 15, marginBottom: 6 },
  input: { backgroundColor: RANG.oq, borderWidth: 1, borderColor: RANG.chiziq, borderRadius: 10, padding: 13, fontSize: 15 },
  rasmQator: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  rasmBox: { position: 'relative' },
  rasm: { width: 74, height: 74, borderRadius: 10 },
  rasmOchir: { position: 'absolute', top: -7, right: -7, backgroundColor: RANG.qizil, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  rasmQoshBtn: { width: 74, height: 74, borderRadius: 10, borderWidth: 1.5, borderColor: RANG.asosiy, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#EFF5FD' },
  yuborBtn: { backgroundColor: RANG.yashil, borderRadius: 12, padding: 16, marginTop: 26, alignItems: 'center' },
  yuborText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },
  ogohlantirish: { textAlign: 'center', color: RANG.kul, fontSize: 12, marginTop: 10 }
});
