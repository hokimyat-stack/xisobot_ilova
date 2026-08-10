// src/screens/PasswordChangeScreen.js — Xodim o'zi parolni almashtiradi
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parolAlmashtir } from '../api';
import { RANG } from '../config';

export default function PasswordChangeScreen({ navigation }) {
  const [eskiParol, setEskiParol] = useState('');
  const [yangiParol, setYangiParol] = useState('');
  const [tasdiq, setTasdiq] = useState('');
  const [kutish, setKutish] = useState(false);

  async function saqla() {
    if (!eskiParol) return Alert.alert('Xato', 'Eski parolni kiriting');
    if (yangiParol.length < 6) return Alert.alert('Xato', 'Yangi parol kamida 6 belgi bo\'lishi kerak');
    if (yangiParol !== tasdiq) return Alert.alert('Xato', 'Yangi parol va tasdiq mos emas');
    setKutish(true);
    try {
      const x = JSON.parse(await AsyncStorage.getItem('XODIM'));
      const res = await parolAlmashtir(x.id, eskiParol, yangiParol);
      if (res.ok) Alert.alert('Muvaffaqiyatli', 'Parol almashtirildi', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      else Alert.alert('Xato', res.xato);
    } catch (e) { Alert.alert('Tarmoq xatosi', 'Internetni tekshiring'); }
    finally { setKutish(false); }
  }

  return (
    <View style={{ flex: 1, backgroundColor: RANG.fon }}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.orqaga}>← Orqaga</Text></TouchableOpacity>
        <Text style={s.title}>Parolni almashtirish</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={{ padding: 20 }}>
        <Text style={s.label}>Eski parol</Text>
        <TextInput style={s.input} value={eskiParol} onChangeText={setEskiParol} secureTextEntry />
        <Text style={s.label}>Yangi parol (kamida 6 belgi)</Text>
        <TextInput style={s.input} value={yangiParol} onChangeText={setYangiParol} secureTextEntry />
        <Text style={s.label}>Yangi parolni tasdiqlang</Text>
        <TextInput style={s.input} value={tasdiq} onChangeText={setTasdiq} secureTextEntry />
        <TouchableOpacity style={[s.btn, kutish && { opacity: 0.6 }]} onPress={saqla} disabled={kutish}>
          {kutish ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Saqlash</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 52, backgroundColor: RANG.oq, borderBottomWidth: 1, borderColor: RANG.chiziq },
  orqaga: { color: RANG.asosiy, fontSize: 15, fontWeight: '600', width: 70 },
  title: { fontSize: 16, fontWeight: '800', color: RANG.toq },
  label: { fontSize: 13, fontWeight: '700', color: RANG.toq, marginTop: 15, marginBottom: 6 },
  input: { backgroundColor: RANG.oq, borderWidth: 1, borderColor: RANG.chiziq, borderRadius: 10, padding: 13, fontSize: 15 },
  btn: { backgroundColor: RANG.asosiy, borderRadius: 12, padding: 15, marginTop: 26, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 }
});
