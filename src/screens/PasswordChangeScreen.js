// src/screens/PasswordChangeScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parolAlmashtir } from '../api';
import { RANG } from '../config';

export default function PasswordChangeScreen({ navigation, route }) {
  const { isDarkMode } = route.params || {};
  const [eskiParol, setEskiParol] = useState('');
  const [yangiParol, setYangiParol] = useState('');
  const [tasdiqParol, setTasdiqParol] = useState('');
  const [kutish, setKutish] = useState(false);

  async function almashtir() {
    if (!eskiParol || !yangiParol || !tasdiqParol) {
      return Alert.alert('Xato', 'Barcha maydonlarni to\'ldiring');
    }
    if (yangiParol.length < 6) {
      return Alert.alert('Xato', 'Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak');
    }
    if (yangiParol !== tasdiqParol) {
      return Alert.alert('Xato', 'Yangi parollar mos kelmadi');
    }

    setKutish(true);
    try {
      const x = JSON.parse(await AsyncStorage.getItem('XODIM'));
      const res = await parolAlmashtir(x.id, eskiParol, yangiParol);
      if (res.ok) {
        Alert.alert('Muvaffaqiyatli ✓', 'Parolingiz muvaffaqiyatli o\'zgartirildi', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Xato', res.xato || 'Parolni o\'zgartirib bo\'lmadi');
      }
    } catch (e) {
      Alert.alert('Tarmoq xatosi', 'Server bilan aloqa yo\'q');
    } finally {
      setKutish(false);
    }
  }

  const bgStyle = { backgroundColor: isDarkMode ? '#0F172A' : RANG.fon };
  const cardBg = { backgroundColor: isDarkMode ? '#1E293B' : RANG.oq, borderColor: isDarkMode ? '#334155' : RANG.chiziq };
  const textPrimary = { color: isDarkMode ? '#F8FAFC' : RANG.toq };

  return (
    <View style={[{ flex: 1, padding: 20, paddingTop: 60 }, bgStyle]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 20 }}>
        <Text style={{ color: RANG.asosiy, fontSize: 15, fontWeight: '600' }}>← Orqaga</Text>
      </TouchableOpacity>

      <View style={[s.card, cardBg]}>
        <Text style={[s.title, textPrimary]}>Parolni almashtirish</Text>

        <Text style={[s.label, textPrimary]}>Eski parol</Text>
        <TextInput style={[s.input, cardBg, textPrimary]} secureTextEntry value={eskiParol} onChangeText={setEskiParol} placeholder="Eski parolni kiriting" placeholderTextColor="#8A97A6" />

        <Text style={[s.label, textPrimary]}>Yangi parol</Text>
        <TextInput style={[s.input, cardBg, textPrimary]} secureTextEntry value={yangiParol} onChangeText={setYangiParol} placeholder="Kamida 6 ta belgi" placeholderTextColor="#8A97A6" />

        <Text style={[s.label, textPrimary]}>Yangi parolni tasdiqlang</Text>
        <TextInput style={[s.input, cardBg, textPrimary]} secureTextEntry value={tasdiqParol} onChangeText={setTasdiqParol} placeholder="Yangi parolni takrorlang" placeholderTextColor="#8A97A6" />

        <TouchableOpacity style={[s.btn, kutish && { opacity: 0.6 }]} onPress={almashtir} disabled={kutish}>
          {kutish ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>O'zgartirish</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 16, padding: 20, borderWidth: 1 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
  btn: { backgroundColor: RANG.asosiy, borderRadius: 10, padding: 15, marginTop: 24, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 }
});
