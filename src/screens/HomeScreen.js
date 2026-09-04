// src/screens/HomeScreen.js — Xisobot Mobile V4
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { menikiOl, vazifalarimOl } from '../api';
import { RANG } from '../config';

const YOPIQ = new Set(['bajarildi','tasdiqlandi','bekor_qilindi']);

export default function HomeScreen({ navigation }) {
  const [xodim, setXodim] = useState(null);
  const [davomEtayotganlar, setDavomEtayotganlar] = useState([]);
  const [vazifaStat, setVazifaStat] = useState({ jami:0, faol:0, tekshiruv:0, kechikkan:0 });
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { yukla(); }, []));

  async function yukla() {
    setLoading(true);
    try {
      const xStr = await AsyncStorage.getItem('XODIM');
      if (!xStr) { navigation.replace('Login'); return; }
      const x = JSON.parse(xStr);
      setXodim(x);

      const [hisRes, vazRes] = await Promise.all([menikiOl(x.id), vazifalarimOl(x.id)]);
      if (hisRes.ok && hisRes.hisobotlar) {
        setDavomEtayotganlar(hisRes.hisobotlar.filter(h => h.bosqich !== 'YAKUNLANDI'));
      }
      if (vazRes.ok && vazRes.vazifalar) {
        const list=vazRes.vazifalar;
        const stat={
          jami:list.length,
          faol:list.filter(v=>!YOPIQ.has(v.samaraliHolat||v.holat) && (v.samaraliHolat||v.holat)!=='tekshiruvda').length,
          tekshiruv:list.filter(v=>(v.samaraliHolat||v.holat)==='tekshiruvda').length,
          kechikkan:list.filter(v=>(v.samaraliHolat||v.holat)==='muddat_otdi').length
        };
        setVazifaStat(stat);
        await AsyncStorage.setItem(`VAZIFALAR_CACHE_${x.id}`, JSON.stringify(list));
      }
    } catch (error) {
      console.log('Home yuklash xatosi:', error);
    } finally { setLoading(false); }
  }

  async function chiqish() {
    Alert.alert('Tizimdan chiqish', 'Haqiqatan ham hisobdan chiqmoqchimisiz?', [
      { text: "Yo'q", style: 'cancel' },
      { text: 'Ha', onPress: async () => { await AsyncStorage.removeItem('XODIM'); navigation.replace('Login'); } }
    ]);
  }

  const bugun = new Date();
  const kunlar = ['yakshanba','dushanba','seshanba','chorshanba','payshanba','juma','shanba'];
  const oylar = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr'];
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
          <Text style={styles.chiqishIco}>↪</Text><Text style={styles.chiqishText}>Chiqish</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={yukla} colors={[RANG.asosiy]} />}>

        <TouchableOpacity style={styles.vazifaBtn} onPress={() => navigation.navigate('Tasks')}>
          <View style={styles.vazifaTop}>
            <View style={styles.vazifaIco}><Text style={{fontSize:22}}>✓</Text></View>
            <View style={{flex:1}}>
              <Text style={styles.vazifaTitle}>MENING VAZIFALARIM</Text>
              <Text style={styles.vazifaSub}>Rahbariyat biriktirgan maxsus topshiriqlar</Text>
            </View>
            <Text style={styles.vazifaArrow}>→</Text>
          </View>
          <View style={styles.vazifaStats}>
            <View><Text style={styles.statNum}>{vazifaStat.faol}</Text><Text style={styles.statLab}>FAOL</Text></View>
            <View><Text style={styles.statNum}>{vazifaStat.tekshiruv}</Text><Text style={styles.statLab}>TEKSHIRUVDA</Text></View>
            <View><Text style={[styles.statNum,vazifaStat.kechikkan?{color:RANG.qizil}:null]}>{vazifaStat.kechikkan}</Text><Text style={styles.statLab}>KECHIKKAN</Text></View>
            <View><Text style={styles.statNum}>{vazifaStat.jami}</Text><Text style={styles.statLab}>JAMI</Text></View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.yangiIshBtn} onPress={() => navigation.navigate('NewReport')}>
          <Text style={styles.plusIco}>+</Text>
          <Text style={styles.yangiIshText}>ERKIN HISOBOT YUBORISH</Text>
          <Text style={styles.yangiIshSub}>Vazifadan tashqari bajarilgan ish uchun</Text>
        </TouchableOpacity>

        <Text style={styles.qismSarlavha}>Davom etayotgan ishlaringiz ({davomEtayotganlar.length})</Text>
        {davomEtayotganlar.map((ish) => {
          const isBoshlandi = ish.bosqich === 'BOSHLANDI';
          const holatRangi = isBoshlandi ? RANG.sariq : RANG.asosiy;
          const holatMatni = isBoshlandi ? 'Boshlandi — davom bosqichi kerak' : 'Davom etmoqda — yakunlash kerak';
          return (
            <TouchableOpacity key={ish.id} style={styles.ishCard} onPress={() => navigation.navigate('Stage', { hisobot: ish })}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ishNomi}>{ish.ishNomi || ish.ishTuri}</Text>
                {ish.vazifaId ? <Text style={styles.vazifaBogliq}>Vazifaga bog‘langan</Text> : null}
                <Text style={[styles.ishStatus, { color: holatRangi }]}>{holatMatni}</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          );
        })}

        {davomEtayotganlar.length === 0 && !loading && (
          <View style={styles.boshHolat}><Text style={styles.boshIcon}>✓</Text><Text style={styles.boshText}>Hozircha chala ishlaringiz yo'q</Text></View>
        )}

        <View style={{ marginTop: 10 }}>
          <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('MyReports')}>
            <Text style={styles.menuTitle}>Mening hisobotlarim</Text><Text style={styles.menuSub}>Tarix, statuslar va oylik statistika</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('PasswordChange')}>
            <Text style={styles.menuTitle}>Parolni almashtirish</Text><Text style={styles.menuSub}>Xavfsizlik sozlamalari</Text>
          </TouchableOpacity>
          <View style={styles.eslatmaCard}>
            <Text style={styles.eslatmaTitle}>V4 Vazifalar</Text>
            <Text style={styles.eslatmaText}>• Rahbariyat bergan vazifani “Mening vazifalarim” orqali bajaring.</Text>
            <Text style={styles.eslatmaText}>• Vazifa hisobotlari avtomatik ravishda aynan shu vazifaga biriktiriladi.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#F8FAFC'},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:20,paddingTop:60,paddingBottom:15,backgroundColor:'#fff'},
  salom:{fontSize:13,color:RANG.kul,fontWeight:'500'}, fio:{fontSize:20,fontWeight:'800',color:RANG.toq,marginTop:2,marginBottom:2}, sana:{fontSize:12,color:RANG.kul},
  chiqishBtn:{flexDirection:'row',alignItems:'center',gap:6,backgroundColor:'#FEF2F2',paddingVertical:8,paddingHorizontal:12,borderRadius:20}, chiqishIco:{fontSize:14,color:RANG.qizil}, chiqishText:{color:RANG.qizil,fontWeight:'700',fontSize:13},
  scrollBody:{padding:20,paddingBottom:40},
  vazifaBtn:{backgroundColor:'#0F2D5D',borderRadius:18,padding:18,marginBottom:14,shadowColor:'#0F2D5D',shadowOffset:{width:0,height:7},shadowOpacity:.18,shadowRadius:12,elevation:5},
  vazifaTop:{flexDirection:'row',alignItems:'center',gap:12}, vazifaIco:{width:44,height:44,borderRadius:14,backgroundColor:'#2F80ED',alignItems:'center',justifyContent:'center'},
  vazifaTitle:{color:'#fff',fontSize:15,fontWeight:'900',letterSpacing:.5}, vazifaSub:{color:'rgba(255,255,255,.7)',fontSize:11.5,marginTop:4}, vazifaArrow:{color:'#fff',fontSize:22},
  vazifaStats:{flexDirection:'row',justifyContent:'space-between',marginTop:16,paddingTop:14,borderTopWidth:1,borderTopColor:'rgba(255,255,255,.12)'}, statNum:{color:'#fff',fontSize:17,fontWeight:'900',textAlign:'center'}, statLab:{color:'rgba(255,255,255,.55)',fontSize:8.5,fontWeight:'800',marginTop:3,textAlign:'center'},
  yangiIshBtn:{backgroundColor:RANG.asosiy,borderRadius:16,padding:20,alignItems:'center',shadowColor:RANG.asosiy,shadowOffset:{width:0,height:8},shadowOpacity:.18,shadowRadius:12,elevation:5,marginBottom:25}, plusIco:{fontSize:28,color:'#fff',fontWeight:'300'}, yangiIshText:{color:'#fff',fontSize:14,fontWeight:'800',letterSpacing:.5}, yangiIshSub:{color:'rgba(255,255,255,.8)',fontSize:11.5,marginTop:5},
  qismSarlavha:{fontSize:14,fontWeight:'800',color:RANG.toq,marginBottom:12}, ishCard:{backgroundColor:'#fff',borderRadius:14,padding:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:10,borderWidth:1,borderColor:RANG.chiziq,elevation:1}, ishNomi:{fontSize:15,fontWeight:'700',color:RANG.toq,marginBottom:4}, ishStatus:{fontSize:11,fontWeight:'600'}, vazifaBogliq:{fontSize:10,color:RANG.asosiy,fontWeight:'800',marginBottom:3}, arrow:{fontSize:20,color:RANG.asosiy},
  boshHolat:{alignItems:'center',paddingVertical:20}, boshIcon:{fontSize:32,color:RANG.yashil,marginBottom:8}, boshText:{color:RANG.kul,fontSize:13},
  menuCard:{backgroundColor:'#fff',borderRadius:14,padding:18,marginBottom:10,borderWidth:1,borderColor:RANG.chiziq}, menuTitle:{fontSize:15,fontWeight:'700',color:RANG.toq,marginBottom:4}, menuSub:{fontSize:12,color:RANG.kul},
  eslatmaCard:{backgroundColor:'#F0FDF4',borderRadius:14,padding:18,marginTop:10,borderWidth:1,borderColor:'#DCFCE7'}, eslatmaTitle:{fontSize:14,fontWeight:'800',color:RANG.yashil,marginBottom:8}, eslatmaText:{fontSize:12,color:'#166534',marginBottom:6,lineHeight:18}
});
