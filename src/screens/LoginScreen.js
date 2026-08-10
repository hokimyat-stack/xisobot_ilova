// src/screens/LoginScreen.js — Kirish + qurilma bog'lash
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import { login } from '../api';
import { RANG, ILOVA_VERSIYA } from '../config';

export default function LoginScreen({ navigation }) {
  const [pinfl, setPinfl] = useState('');
  const [parol, setParol] = useState('');
  const [kutish, setKutish] = useState(false);

  async function kirish() {
    if (pinfl.length !== 14) return Alert.alert('Xato', 'PINFL 14 raqamdan iborat bo\'lishi kerak');
    if (!parol) return Alert.alert('Xato', 'Parolni kiriting');
    setKutish(true);
    try {
      const deviceId = Application.getAndroidId(); // Qurilma ID — device binding uchun
      const res = await login(pinfl, parol, deviceId);
      if (res.ok) {
        await AsyncStorage.setItem('XODIM', JSON.stringify({ ...res.xodim, deviceId }));
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      } else {
        Alert.alert('Kirish rad etildi', res.xato);
      }
    } catch (e) {
      Alert.alert('Tarmoq xatosi', 'Internet aloqasini tekshiring');
    } finally { setKutish(false); }
  }

  return (
    <KeyboardAvoidingView style={s.wrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.card}>
        <Text style={s.logo}>KUNLIK HISOBOT</Text>
        <Text style={s.sub}>Xodimlar uchun ish hisoboti tizimi</Text>

        <Text style={s.label}>PINFL (JSHSHIR)</Text>
        <TextInput style={s.input} value={pinfl} onChangeText={setPinfl}
          keyboardType="number-pad" maxLength={14} placeholder="14 raqam" />

        <Text style={s.label}>Parol</Text>
        <TextInput style={s.input} value={parol} onChangeText={setParol}
          secureTextEntry placeholder="Parol" />

        <TouchableOpacity style={[s.btn, kutish && { opacity: 0.6 }]} onPress={kirish} disabled={kutish}>
          <Text style={s.btnText}>{kutish ? 'Tekshirilmoqda...' : 'Kirish'}</Text>
        </TouchableOpacity>

        <Text style={s.eslatma}>
          Birinchi kirishda hisobingiz shu telefonga bog'lanadi.{'\n'}
          Boshqa telefondan kirish mumkin bo'lmaydi.
        </Text>
      </View>
      <Text style={s.versiya}>SysOne · v{ILOVA_VERSIYA}</Text>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: RANG.fon, justifyContent: 'center', padding: 24 },
  card: { backgroundColor: RANG.oq, borderRadius: 16, padding: 24, elevation: 3 },
  logo: { fontSize: 24, fontWeight: '800', color: RANG.asosiy, textAlign: 'center', letterSpacing: 1 },
  sub: { fontSize: 13, color: RANG.kul, textAlign: 'center', marginTop: 4, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: RANG.toq, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: RANG.chiziq, borderRadius: 10, padding: 12, fontSize: 16, backgroundColor: '#FBFCFE' },
  btn: { backgroundColor: RANG.asosiy, borderRadius: 10, padding: 15, marginTop: 24 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: '700', fontSize: 16 },
  eslatma: { fontSize: 11.5, color: RANG.kul, textAlign: 'center', marginTop: 16, lineHeight: 17 },
  versiya: { textAlign: 'center', color: RANG.kul, fontSize: 12, marginTop: 20 }
});
