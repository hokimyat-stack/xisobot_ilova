// src/screens/CameraScreen.js — FAQAT jonli surat + watermark
// Galereya yo'q! Surat olinadi → ustiga sana/vaqt/GPS/ID yoziladi → siqiladi
import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import ViewShot from 'react-native-view-shot';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy'; // SDK 54: eski API legacy'da
import { RANG } from '../config';

export default function CameraScreen({ navigation, route }) {
  const { onRasm, xodimId, gps } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const shotRef = useRef(null);
  const [olingan, setOlingan] = useState(null); // {uri}
  const [kutish, setKutish] = useState(false);

  if (!permission) return <View style={s.dark} />;
  if (!permission.granted) return (
    <View style={[s.dark, s.center]}>
      <Text style={s.oqText}>Hisobot uchun kamera ruxsati kerak</Text>
      <TouchableOpacity style={s.ruxsatBtn} onPress={requestPermission}>
        <Text style={s.btnText}>Ruxsat berish</Text>
      </TouchableOpacity>
    </View>
  );

  const hozir = new Date();
  const watermarkMatn =
    hozir.toLocaleDateString('uz-UZ') + ' ' +
    hozir.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) +
    '  |  GPS: ' + (gps ? gps.lat.toFixed(5) + ', ' + gps.lng.toFixed(5) : 'aniqlanmoqda') +
    '  |  ID: ' + xodimId;

  async function suratOl() {
    if (!cameraRef.current) return;
    setKutish(true);
    const foto = await cameraRef.current.takePictureAsync({ quality: 0.9 });
    setOlingan(foto);
    setKutish(false);
  }

  async function tasdiqla() {
    setKutish(true);
    try {
      // 1) Watermark bosilgan ko'rinishni rasmga aylantirish
      const wmUri = await shotRef.current.capture();
      // 2) Siqish: 1600px kenglik, 75% sifat (Drive joyini tejash)
      const siq = await ImageManipulator.manipulateAsync(wmUri,
        [{ resize: { width: 1600 } }],
        { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG });
      // 3) Base64 o'qish — serverga yuborish uchun
      const b64 = await FileSystem.readAsStringAsync(siq.uri, { encoding: 'base64' });
      onRasm({ uri: siq.uri, b64 });
      navigation.goBack();
    } finally { setKutish(false); }
  }

  return (
    <View style={s.dark}>
      {!olingan ? (
        <>
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
          <View style={s.wmBar}><Text style={s.wmText}>{watermarkMatn}</Text></View>
          <View style={s.pastPanel}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={s.bekor}>Bekor</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.suratBtn} onPress={suratOl} disabled={kutish}>
              {kutish ? <ActivityIndicator color="#fff" /> : <View style={s.suratIchki} />}
            </TouchableOpacity>
            <View style={{ width: 50 }} />
          </View>
        </>
      ) : (
        <>
          {/* Watermark bosilgan ko'rinish — ViewShot shu qismni rasmga aylantiradi */}
          <ViewShot ref={shotRef} options={{ format: 'jpg', quality: 0.95 }} style={{ flex: 1 }}>
            <Image source={{ uri: olingan.uri }} style={{ flex: 1 }} resizeMode="cover" />
            <View style={s.wmOverlay}>
              <Text style={s.wmOverlayText}>{watermarkMatn}</Text>
            </View>
          </ViewShot>
          <View style={s.pastPanel}>
            <TouchableOpacity onPress={() => setOlingan(null)} disabled={kutish}>
              <Text style={s.bekor}>Qayta olish</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.tasdiqBtn} onPress={tasdiqla} disabled={kutish}>
              <Text style={s.btnText}>{kutish ? 'Saqlanmoqda...' : 'Tasdiqlash ✓'}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  dark: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  oqText: { color: '#fff', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  ruxsatBtn: { backgroundColor: RANG.asosiy, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 28 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  wmBar: { position: 'absolute', bottom: 110, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)', padding: 8 },
  wmText: { color: '#FFD84D', fontSize: 11.5, textAlign: 'center', fontWeight: '600' },
  wmOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 10, paddingHorizontal: 8 },
  wmOverlayText: { color: '#FFD84D', fontSize: 13, textAlign: 'center', fontWeight: '700' },
  pastPanel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 22, backgroundColor: '#000' },
  bekor: { color: '#fff', fontSize: 15, width: 80 },
  suratBtn: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  suratIchki: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#fff' },
  tasdiqBtn: { backgroundColor: RANG.yashil, borderRadius: 10, paddingVertical: 13, paddingHorizontal: 26 }
});
