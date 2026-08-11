// src/screens/MyReportsScreen.js — Xodimning hisobotlari: 3-bosqich holati, reyting,
// kechikish belgisi va tahrirlashga ruxsat so'rash.
//
// DIQQAT: Tuzatilgan backend (server.js) endi hisobotlar uchun b_status/d_status/
// y_status/*_sabab kabi tasdiqlash-rad qilish maydonlarini UMUMAN qaytarmaydi —
// bunday tasdiqlash tizimi backendda yo'q. Buning o'rniga backend har bir hisobot
// uchun quyidagilarni beradi:
//   - bosqich: 'BOSHLANDI' | 'DAVOM_ETMOQDA' | 'YAKUNLANDI'
//   - reyting: 'YASHIL' | 'SARIQ' | 'QIZIL'  (SARIQ/QIZIL — kechikish yoki muammo bor)
//   - kechikkan: true/false
//   - flagSabab: reyting nima uchun pasayganini tushuntiruvchi matn
// Shuning uchun bu ekran endi shu real maydonlarga mos qurilgan.
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { menikiOl, tahrirSora } from '../api';
import { RANG } from '../config';
import { sorovlarniOl, sorovQoshish, oxirgiJavobniOl, oxirgiJavobniYopish } from '../utils/tahrirKesh';

const REYTING_RANG = { YASHIL: RANG.yashil, SARIQ: RANG.sariq, QIZIL: RANG.qizil };
const REYTING_NOMI = { YASHIL: 'Yashil', SARIQ: 'Sariq', QIZIL: 'Qizil' };
const BOSQICHLAR = [
  { kalit: 'BOSHLANDI', nomi: 'Boshlandi' },
  { kalit: 'DAVOM_ETMOQDA', nomi: 'Davom etmoqda' },
  { kalit: 'YAKUNLANDI', nomi: 'Yakunlandi' },
];
function bosqichIndeks(bosqich) {
  const i = BOSQICHLAR.findIndex(b => b.kalit === bosqich);
  return i === -1 ? 0 : i;
}

function BosqichYoli({ bosqich }) {
  const joriy = bosqichIndeks(bosqich);
  return (
    <View style={s.yolWrap}>
      {BOSQICHLAR.map((b, i) => (
        <React.Fragment key={b.kalit}>
          <View style={s.yolNuqtaWrap}>
            <View style={[s.yolNuqta, i <= joriy ? s.yolNuqtaFaol : s.yolNuqtaBosh]}>
              {i < joriy ? <Text style={s.yolBelgi}>✓</Text> : i === joriy ? <View style={s.yolIchki} /> : null}
            </View>
            <Text style={[s.yolMatn, i <= joriy && { color: RANG.toq, fontWeight: '700' }]}>{b.nomi}</Text>
          </View>
          {i < BOSQICHLAR.length - 1 && <View style={[s.yolChiziq, i < joriy && s.yolChiziqFaol]} />}
        </React.Fragment>
      ))}
    </View>
  );
}

function Card({ h, onDavomEttir, onTahrirSora, sorovHolati }) {
  const rangKal = h.reyting || 'YASHIL';
  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <Text style={s.sana}>{h.sana} · {h.haftaKuni}</Text>
        <View style={[s.reytingBadge, { backgroundColor: (REYTING_RANG[rangKal] || RANG.yashil) + '22' }]}>
          <View style={[s.reytingNuqta, { backgroundColor: REYTING_RANG[rangKal] || RANG.yashil }]} />
          <Text style={[s.reytingMatn, { color: REYTING_RANG[rangKal] || RANG.yashil }]}>{REYTING_NOMI[rangKal] || rangKal}</Text>
        </View>
      </View>

      <Text style={s.ishNomi}>{h.ishNomi || h.ishTuri}</Text>

      <BosqichYoli bosqich={h.bosqich} />

      {h.flagSabab ? <Text style={s.flag}>⚠ {h.flagSabab}</Text> : null}

      <View style={s.pastQator}>
        {h.bosqich !== 'YAKUNLANDI' && (
          <TouchableOpacity style={s.davomBtn} onPress={() => onDavomEttir(h)}>
            <Text style={s.davomBtnText}>
              {h.bosqich === 'BOSHLANDI' ? "Davom etmoqda'ni yuklash →" : "Yakunlashni yuklash →"}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => onTahrirSora(h)}>
          <Text style={s.tahrirLink}>Tahrirlashga ruxsat so'rash</Text>
        </TouchableOpacity>
      </View>

      {sorovHolati && (
        <Text style={s.sorovHolatiMatn}>
          ⏳ {new Date(sorovHolati.vaqt).toLocaleDateString('uz-UZ')} kuni tahrir so'rovi yuborilgan — javob kutilmoqda
        </Text>
      )}
    </View>
  );
}

export default function MyReportsScreen({ navigation }) {
  const [hisobotlar, setHisobotlar] = useState([]);
  const [kutish, setKutish] = useState(true);
  const [xato, setXato] = useState('');
  const [xodim, setXodim] = useState(null);
  const [sorovlar, setSorovlar] = useState({});
  const [oxirgiJavob, setOxirgiJavob] = useState(null);

  async function yukla() {
    setXato('');
    try {
      const x = JSON.parse(await AsyncStorage.getItem('XODIM'));
      setXodim(x);
      const res = await menikiOl(x.id);
      if (res.ok) {
        setHisobotlar(res.hisobotlar);
        await AsyncStorage.setItem('MENIKI_KESH', JSON.stringify(res.hisobotlar));
      } else {
        setXato(res.xato || "Hisobotlarni yuklab bo'lmadi");
        const kesh = await AsyncStorage.getItem('MENIKI_KESH');
        if (kesh) setHisobotlar(JSON.parse(kesh));
      }
    } catch {
      const kesh = await AsyncStorage.getItem('MENIKI_KESH');
      if (kesh) { setHisobotlar(JSON.parse(kesh)); setXato("Offline — oxirgi saqlangan ro'yxat"); }
      else setXato("Internet yo'q va kesh bo'sh");
    } finally {
      setKutish(false);
    }
  }

  const yangila = useCallback(async () => {
    await yukla();
    setSorovlar(await sorovlarniOl());
    setOxirgiJavob(await oxirgiJavobniOl());
  }, []);

  useEffect(() => { yangila(); }, [yangila]);
  useFocusEffect(useCallback(() => { yangila(); }, [yangila]));

  const [sorovModal, setSorovModal] = useState(null); // hisobot obyekti
  const [sorovSabab, setSorovSabab] = useState('');
  function sorash(h) { setSorovModal(h); setSorovSabab(''); }
  async function sorovYubor() {
    if (!sorovSabab.trim()) return Alert.alert('Xato', 'Sababni yozing');
    const res = await tahrirSora(sorovModal.id, xodim.id, xodim.fio, sorovSabab.trim());
    if (res.ok) {
      await sorovQoshish(sorovModal.id, sorovSabab.trim());
      setSorovlar(await sorovlarniOl());
      setSorovModal(null);
      Alert.alert('Yuborildi', "So'rovingiz adminga yuborildi, ruxsat berilsa/rad etilsa bildirishnoma keladi");
    } else {
      Alert.alert('Xato', res.xato);
    }
  }

  function davomEttir(h) {
    navigation.navigate('Stage', { hisobot: h });
  }

  async function javobniYop() {
    await oxirgiJavobniYopish();
    setOxirgiJavob(null);
  }

  const oy = new Date().toISOString().slice(0, 7);
  const oylik = hisobotlar.filter(h => String(h.sana).startsWith(oy));
  const kunlar = new Set(oylik.map(h => h.sana)).size;

  return (
    <View style={{ flex: 1, backgroundColor: RANG.fon }}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.orqaga}>← Orqaga</Text></TouchableOpacity>
        <Text style={s.title}>Mening hisobotlarim</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={s.statQator}>
        <View style={s.statCard}><Text style={s.statSon}>{oylik.length}</Text><Text style={s.statNom}>shu oy ish</Text></View>
        <View style={s.statCard}><Text style={s.statSon}>{kunlar}</Text><Text style={s.statNom}>faol kun</Text></View>
        <View style={s.statCard}><Text style={s.statSon}>{hisobotlar.length}</Text><Text style={s.statNom}>jami (oxirgi 60)</Text></View>
      </View>

      {oxirgiJavob && (
        <TouchableOpacity style={s.javobBanner} onPress={javobniYop}>
          <View style={{ flex: 1 }}>
            <Text style={s.javobBannerTitle}>{oxirgiJavob.title}</Text>
            <Text style={s.javobBannerBody}>{oxirgiJavob.body}</Text>
          </View>
          <Text style={s.javobBannerYop}>✕</Text>
        </TouchableOpacity>
      )}

      {xato ? <Text style={s.xato}>{xato}</Text> : null}

      {kutish ? <ActivityIndicator size="large" color={RANG.asosiy} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={hisobotlar}
          keyExtractor={h => h.id}
          refreshControl={<RefreshControl refreshing={false} onRefresh={yangila} />}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={s.bosh}>Hali ish yuklanmagan.{'\n'}Birinchi ishingizni boshlang!</Text>}
          renderItem={({ item: h }) => (
            <Card h={h} onDavomEttir={davomEttir} onTahrirSora={sorash} sorovHolati={sorovlar[h.id]} />
          )}
        />
      )}

      <Modal visible={!!sorovModal} transparent animationType="fade">
        <View style={s.modalFon}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Tahrir sababi</Text>
            <Text style={s.modalSub}>Nima uchun tahrirlashingiz kerak?</Text>
            <TextInput style={s.modalInput} value={sorovSabab} onChangeText={setSorovSabab}
              multiline placeholder="Sababni yozing..." />
            <View style={s.modalAmallar}>
              <TouchableOpacity style={s.modalBekor} onPress={() => setSorovModal(null)}><Text>Bekor</Text></TouchableOpacity>
              <TouchableOpacity style={s.modalYubor} onPress={sorovYubor}><Text style={{ color: '#fff', fontWeight: '700' }}>Yuborish</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 52, backgroundColor: RANG.oq, borderBottomWidth: 1, borderColor: RANG.chiziq },
  orqaga: { color: RANG.asosiy, fontSize: 15, fontWeight: '600', width: 70 },
  title: { fontSize: 17, fontWeight: '800', color: RANG.toq },
  statQator: { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 0 },
  statCard: { flex: 1, backgroundColor: RANG.oq, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: RANG.chiziq },
  statSon: { fontSize: 22, fontWeight: '800', color: RANG.asosiy },
  statNom: { fontSize: 11, color: RANG.kul, marginTop: 2, textAlign: 'center' },
  javobBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAF3FF', margin: 16, marginBottom: 0, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#BBD8FA' },
  javobBannerTitle: { fontWeight: '700', color: RANG.asosiy, fontSize: 13 },
  javobBannerBody: { color: RANG.toq, fontSize: 12, marginTop: 2 },
  javobBannerYop: { color: RANG.kul, fontSize: 16, paddingHorizontal: 8, fontWeight: '700' },
  xato: { color: RANG.sariq, textAlign: 'center', marginTop: 10, fontSize: 12.5 },
  bosh: { textAlign: 'center', color: RANG.kul, marginTop: 50, lineHeight: 22 },
  card: { backgroundColor: RANG.oq, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: RANG.chiziq },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sana: { fontWeight: '700', color: RANG.toq, fontSize: 13.5 },
  reytingBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  reytingNuqta: { width: 6, height: 6, borderRadius: 3 },
  reytingMatn: { fontWeight: '700', fontSize: 11.5 },
  ishNomi: { color: RANG.asosiy, fontWeight: '700', fontSize: 14, marginBottom: 10 },
  yolWrap: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  yolNuqtaWrap: { alignItems: 'center', width: 74 },
  yolNuqta: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  yolNuqtaFaol: { backgroundColor: RANG.yashil, borderColor: RANG.yashil },
  yolNuqtaBosh: { backgroundColor: '#fff', borderColor: RANG.chiziq },
  yolIchki: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  yolBelgi: { color: '#fff', fontSize: 12, fontWeight: '800' },
  yolMatn: { fontSize: 10.5, color: RANG.kul, marginTop: 4, textAlign: 'center' },
  yolChiziq: { flex: 1, height: 2, backgroundColor: RANG.chiziq, marginTop: 9 },
  yolChiziqFaol: { backgroundColor: RANG.yashil },
  flag: { color: RANG.qizil, fontSize: 12, marginTop: 4, marginBottom: 6, fontWeight: '600' },
  pastQator: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, flexWrap: 'wrap', gap: 8 },
  davomBtn: { backgroundColor: RANG.asosiy + '15', borderRadius: 8, paddingVertical: 7, paddingHorizontal: 10 },
  davomBtnText: { color: RANG.asosiy, fontWeight: '700', fontSize: 12 },
  tahrirLink: { color: RANG.kul, fontSize: 11.5, fontWeight: '700', textDecorationLine: 'underline' },
  sorovHolatiMatn: { color: RANG.sariq, fontSize: 11.5, marginTop: 8, fontWeight: '600' },
  modalFon: { flex: 1, backgroundColor: 'rgba(0,0,0,.45)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: RANG.oq, borderRadius: 14, padding: 20 },
  modalTitle: { fontWeight: '800', fontSize: 16, color: RANG.toq },
  modalSub: { color: RANG.kul, fontSize: 12.5, marginTop: 4, marginBottom: 12 },
  modalInput: { borderWidth: 1, borderColor: RANG.chiziq, borderRadius: 10, padding: 12, minHeight: 70, textAlignVertical: 'top' },
  modalAmallar: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalBekor: { flex: 1, padding: 12, borderRadius: 9, backgroundColor: RANG.fon, alignItems: 'center' },
  modalYubor: { flex: 1, padding: 12, borderRadius: 9, backgroundColor: RANG.asosiy, alignItems: 'center' }
});
