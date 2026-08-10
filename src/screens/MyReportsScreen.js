// src/screens/MyReportsScreen.js — Xodimning hisobotlari, 3 bosqich holati, rad sababi, tahrir so'rash
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { menikiOl, tahrirSora } from '../api';
import { RANG } from '../config';

const ST_RANG = { KUTILMOQDA: RANG.sariq, TASDIQLANDI: RANG.yashil, 'RAD ETILDI': RANG.qizil, '': '#C9D3DE' };

function Chip({ nom, status, sabab, onTahrirSora }) {
  return (
    <View style={s.chipWrap}>
      <Text style={[s.chipNom, { color: ST_RANG[status || ''] }]}>{nom}: {status || 'kutilmoqda'}</Text>
      {status === 'RAD ETILDI' && (
        <>
          <Text style={s.sababTxt}>⚠ {sabab}</Text>
          {onTahrirSora && <TouchableOpacity onPress={onTahrirSora}><Text style={s.tahrirLink}>Tahrirlashga ruxsat so'rash</Text></TouchableOpacity>}
        </>
      )}
    </View>
  );
}

export default function MyReportsScreen({ navigation }) {
  const [hisobotlar, setHisobotlar] = useState([]);
  const [kutish, setKutish] = useState(true);
  const [xato, setXato] = useState('');
  const [xodim, setXodim] = useState(null);

  async function yukla() {
    setXato('');
    try {
      const x = JSON.parse(await AsyncStorage.getItem('XODIM'));
      setXodim(x);
      const res = await menikiOl(x.id);
      if (res.ok) { setHisobotlar(res.hisobotlar); await AsyncStorage.setItem('MENIKI_KESH', JSON.stringify(res.hisobotlar)); }
      else setXato(res.xato);
    } catch {
      const kesh = await AsyncStorage.getItem('MENIKI_KESH');
      if (kesh) { setHisobotlar(JSON.parse(kesh)); setXato('Offline — oxirgi saqlangan ro\'yxat'); }
      else setXato("Internet yo'q va kesh bo'sh");
    } finally { setKutish(false); }
  }
  useEffect(() => { yukla(); }, []);

  const [sorovModal, setSorovModal] = useState(null); // hisobot obyekti
  const [sorovSabab, setSorovSabab] = useState('');
  function sorash(h) { setSorovModal(h); setSorovSabab(''); }
  async function sorovYubor() {
    if (!sorovSabab.trim()) return Alert.alert('Xato', 'Sababni yozing');
    const res = await tahrirSora(sorovModal.id, xodim.id, xodim.fio, sorovSabab.trim());
    setSorovModal(null);
    if (res.ok) Alert.alert('Yuborildi', "So'rovingiz adminga yuborildi, ruxsat berilsa xabar keladi");
    else Alert.alert('Xato', res.xato);
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

      {xato ? <Text style={s.xato}>{xato}</Text> : null}

      {kutish ? <ActivityIndicator size="large" color={RANG.asosiy} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={hisobotlar}
          keyExtractor={h => h.id}
          refreshControl={<RefreshControl refreshing={false} onRefresh={yukla} />}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={s.bosh}>Hali ish yuklanmagan.{'\n'}Birinchi ishingizni boshlang!</Text>}
          renderItem={({ item: h }) => (
            <View style={s.card}>
              <View style={s.cardTop}>
                <Text style={s.sana}>{h.sana} · {h.haftaKuni}</Text>
                <Text style={[s.reyting, { color: h.reyting === 'QIZIL' ? RANG.qizil : h.reyting === 'SARIQ' ? RANG.sariq : RANG.yashil }]}>{h.reyting}</Text>
              </View>
              <Text style={s.ishNomi}>{h.ishNomi || h.ishTuri}</Text>
              <Chip nom="Boshlandi" status={h.b_status} sabab={h.b_sabab} onTahrirSora={h.b_status === 'RAD ETILDI' ? () => sorash(h) : null} />
              <Chip nom="Davom" status={h.d_status} sabab={h.d_sabab} onTahrirSora={h.d_status === 'RAD ETILDI' ? () => sorash(h) : null} />
              <Chip nom="Yakun" status={h.y_status} sabab={h.y_sabab} onTahrirSora={h.y_status === 'RAD ETILDI' ? () => sorash(h) : null} />
              {h.flagSabab ? <Text style={s.flag}>⚠ {h.flagSabab}</Text> : null}
            </View>
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
  xato: { color: RANG.sariq, textAlign: 'center', marginTop: 10, fontSize: 12.5 },
  bosh: { textAlign: 'center', color: RANG.kul, marginTop: 50, lineHeight: 22 },
  card: { backgroundColor: RANG.oq, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: RANG.chiziq },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  sana: { fontWeight: '700', color: RANG.toq, fontSize: 13.5 },
  reyting: { fontWeight: '700', fontSize: 12 },
  ishNomi: { color: RANG.asosiy, fontWeight: '700', fontSize: 14, marginBottom: 8 },
  chipWrap: { marginTop: 4 },
  chipNom: { fontSize: 12.5, fontWeight: '700' },
  sababTxt: { color: RANG.qizil, fontSize: 11.5, marginTop: 2 },
  tahrirLink: { color: RANG.asosiy, fontSize: 11.5, fontWeight: '700', marginTop: 2, textDecorationLine: 'underline' },
  flag: { color: RANG.qizil, fontSize: 12, marginTop: 8, fontWeight: '600' },
  modalFon: { flex: 1, backgroundColor: 'rgba(0,0,0,.45)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: RANG.oq, borderRadius: 14, padding: 20 },
  modalTitle: { fontWeight: '800', fontSize: 16, color: RANG.toq },
  modalSub: { color: RANG.kul, fontSize: 12.5, marginTop: 4, marginBottom: 12 },
  modalInput: { borderWidth: 1, borderColor: RANG.chiziq, borderRadius: 10, padding: 12, minHeight: 70, textAlignVertical: 'top' },
  modalAmallar: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalBekor: { flex: 1, padding: 12, borderRadius: 9, backgroundColor: RANG.fon, alignItems: 'center' },
  modalYubor: { flex: 1, padding: 12, borderRadius: 9, backgroundColor: RANG.asosiy, alignItems: 'center' }
});
