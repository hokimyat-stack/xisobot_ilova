// src/screens/HomeScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { menikiOl } from '../api';
import { RANG } from '../config';

export default function HomeScreen({ navigation }) {
  const [xodim, setXodim] = useState(null);
  const [davomEtayotganlar, setDavomEtayotganlar] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ekranga har safar kirganda ma'lumotlarni yangilash
  useFocusEffect(
    useCallback(() => {
      yukla();
    }, [])
  );

  async function yukla() {
    try {
      const xStr = await AsyncStorage.getItem('XODIM');
      if (!xStr) {
        navigation.replace('Login');
        return;
      }
      const x = JSON.parse(xStr);
      setXodim(x);

      const res = await menikiOl(x.id);
      if (res.ok && res.hisobotlar) {
        // Faqat YAKUNLANDI bo'lmagan (ya'ni chala qolgan) ishlarni ajratib olamiz
        const chalaIshlar = res.hisobotlar.filter(h => h.bosqich !== 'YAKUNLANDI');
        setDavomEtayotganlar(chalaIshlar);
      }
    } catch (error) {
      console.log("Xato:", error);
    } finally {
      setLoading(false);
    }
  }

  async function chiqish() {
    Alert.alert("Tizimdan chiqish", "Haqiqatan ham hisobdan chiqmoqchimisiz?", [
      { text: "Yo'q", style: "cancel" },
      { text: "Ha", onPress: async () => {
          await AsyncStorage.removeItem('XODIM');
          navigation.replace('Login');
        } 
      }
    ]);
  }

  // Kun va sanani chiroyli chiqarish
  const bugun = new Date();
  const kunlar = ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba'];
  const oylar = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
  const sanaMatni = `${kunlar[bugun.getDay()]}, ${bugun.getDate()}-${oylar[bugun.getMonth()]}`;

  if (!xodim) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.salom}>Assalomu alaykum,</Text>
          <Text style={styles.fio}>{xodim.fio}</Text>
          <Text style={styles.sana}>{sanaMatni}</Text>
        </View>
        <TouchableOpacity style={styles.chiqishBtn} onPress={chiqish}>
          <Text style={styles.chiqishIco}>🌙</Text>
          <Text style={styles.chiqishText}>Chiqish</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollBody}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={yukla} colors={[RANG.asosiy]} />}
      >
        {/* YANGILANGAN ASOSIY TUGMA */}
        <TouchableOpacity 
          style={styles.yangiIshBtn} 
          onPress={() => navigation.navigate('NewReport')}
        >
          <Text style={styles.plusIco}>+</Text>
          <Text style={styles.yangiIshText}>YANGI HISOBOT YUBORISH</Text>
          <Text style={styles.yangiIshSub}>Tezkor (1 bosqich) yoki To'liq rejim</Text>
        </TouchableOpacity>

        {/* DAVOM ETAYOTGAN ISHLAR */}
        <Text style={styles.qismSarlavha}>
          Davom etayotgan ishlaringiz ({davomEtayotganlar.length})
        </Text>
        
        {davomEtayotganlar.map((ish) => {
          // Status ranglari va matnlari
          const isBoshlandi = ish.bosqich === 'BOSHLANDI';
          const holatRangi = isBoshlandi ? RANG.sariq : RANG.asosiy;
          const holatMatni = isBoshlandi ? "Boshlandi — davom bosqichi kerak" : "Davom etmoqda — yakunlash kerak";

          return (
            <TouchableOpacity 
              key={ish.id} 
              style={styles.ishCard}
              onPress={() => navigation.navigate('Stage', { hisobot: ish })}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.ishNomi}>{ish.ishNomi || ish.ishTuri}</Text>
                <Text style={[styles.ishStatus, { color: holatRangi }]}>{holatMatni}</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          );
        })}

        {davomEtayotganlar.length === 0 && !loading && (
          <View style={styles.boshHolat}>
            <Text style={styles.boshIcon}>🎉</Text>
            <Text style={styles.boshText}>Hozircha chala ishlaringiz yo'q</Text>
          </View>
        )}

        {/* QO'SHIMCHA MENYULAR */}
        <View style={{ marginTop: 10 }}>
          <TouchableOpacity 
            style={styles.menuCard} 
            onPress={() => navigation.navigate('MyReports')}
          >
            <Text style={styles.menuTitle}>Mening hisobotlarim</Text>
            <Text style={styles.menuSub}>Tarix, statuslar va oylik statistika</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuCard} 
            onPress={() => navigation.navigate('PasswordChange')}
          >
            <Text style={styles.menuTitle}>Parolni almashtirish</Text>
            <Text style={styles.menuSub}>Xavfsizlik uchun tavsiya etiladi</Text>
          </TouchableOpacity>

          <View style={styles.eslatmaCard}>
            <Text style={styles.eslatmaTitle}>Eslatmalar</Text>
            <Text style={styles.eslatmaText}>• 1 bosqichli (Tezkor) hisobotni topshirsangiz, u darhol yakunlanadi va ro'yxatdan yopiladi.</Text>
            <Text style={styles.eslatmaText}>• 3 bosqichli hisobotni tanlasangiz, qolgan bosqichlarni shu ekrandagi ro'yxatdan kirib davom ettirasiz.</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 15, backgroundColor: '#fff' 
  },
  salom: { fontSize: 13, color: RANG.kul, fontWeight: '500' },
  fio: { fontSize: 20, fontWeight: '800', color: RANG.toq, marginTop: 2, marginBottom: 2 },
  sana: { fontSize: 12, color: RANG.kul },
  chiqishBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
  chiqishIco: { fontSize: 14 },
  chiqishText: { color: RANG.qizil, fontWeight: '700', fontSize: 13 },
  scrollBody: { padding: 20, paddingBottom: 40 },
  
  yangiIshBtn: { 
    backgroundColor: RANG.asosiy, borderRadius: 16, padding: 24, 
    alignItems: 'center', shadowColor: RANG.asosiy, shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 8, marginBottom: 25 
  },
  plusIco: { fontSize: 32, color: '#fff', fontWeight: '300', marginBottom: 5 },
  yangiIshText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  yangiIshSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 6, fontWeight: '500' },

  qismSarlavha: { fontSize: 14, fontWeight: '800', color: RANG.toq, marginBottom: 12 },
  
  ishCard: { 
    backgroundColor: '#fff', borderRadius: 14, padding: 16, flexDirection: 'row', 
    alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
    borderWidth: 1, borderColor: RANG.chiziq, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1
  },
  ishNomi: { fontSize: 15, fontWeight: '700', color: RANG.toq, marginBottom: 4 },
  ishStatus: { fontSize: 11, fontWeight: '600' },
  arrow: { fontSize: 20, color: RANG.asosiy, fontWeight: '300' },

  boshHolat: { alignItems: 'center', paddingVertical: 20 },
  boshIcon: { fontSize: 40, marginBottom: 10 },
  boshText: { color: RANG.kul, fontSize: 13, fontWeight: '500' },

  menuCard: { 
    backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 10,
    borderWidth: 1, borderColor: RANG.chiziq 
  },
  menuTitle: { fontSize: 15, fontWeight: '700', color: RANG.toq, marginBottom: 4 },
  menuSub: { fontSize: 12, color: RANG.kul },

  eslatmaCard: { backgroundColor: '#F0FDF4', borderRadius: 14, padding: 18, marginTop: 10, borderWidth: 1, borderColor: '#DCFCE7' },
  eslatmaTitle: { fontSize: 14, fontWeight: '800', color: RANG.yashil, marginBottom: 8 },
  eslatmaText: { fontSize: 12, color: '#166534', marginBottom: 6, lineHeight: 18 }
});
