// src/screens/NewReportScreen.js — erkin yoki V4 vazifa hisoboti
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import { post } from '../api';
import { navbatgaQosh } from '../queue';
import { RANG } from '../config';

export default function NewReportScreen({ navigation, route }) {
  const vazifa=route.params?.vazifa||null;
  const vazifaBosqich=route.params?.vazifaBosqich||null;
  const taskType=vazifa?.bajarish_turi||vazifa?.bajarishTuri||null;
  const vazifaRejimi=!!vazifa;
  const minRasm=Math.max(0,Math.min(10,Number(vazifa?.min_rasm??vazifa?.minRasm??1)));
  const gpsTalab=(vazifa?.gps_talab??vazifa?.gpsTalab)!==false;

  const [xodim, setXodim] = useState(null);
  const [ishNomi, setIshNomi] = useState(vazifaBosqich?.nomi || vazifa?.sarlavha || '');
  const [tavsif, setTavsif] = useState('');
  const [rasmlar, setRasmlar] = useState([]);
  const [gps, setGps] = useState(null);
  const [gpsXato, setGpsXato] = useState('');
  const [yuborilmoqda, setYuborilmoqda] = useState(false);
  const [isBirBosqichli, setIsBirBosqichli] = useState(vazifaRejimi ? taskType!=='uch_bosqichli' : true);

  useEffect(() => {
    (async () => {
      const x = await AsyncStorage.getItem('XODIM'); setXodim(JSON.parse(x));
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setGpsXato(gpsTalab?'Lokatsiya ruxsati berilmadi — vazifa yuborilmaydi':'Lokatsiya ruxsati berilmadi'); return; }
      try { const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }); setGps({ lat:loc.coords.latitude,lng:loc.coords.longitude,mocked:loc.mocked===true }); }
      catch { setGpsXato(gpsTalab?'GPS aniqlanmadi. Lokatsiyani yoqing':'GPS aniqlanmadi'); }
    })();
  }, []);

  function rasmQosh() {
    if (rasmlar.length >= 10) return Alert.alert('Cheklov', "Ko'pi bilan 10 ta rasm");
    if (gpsTalab && !gps) return Alert.alert('GPS', 'Avval lokatsiya aniqlanishi kerak');
    navigation.navigate('Camera', { xodimId:xodim.id, gps, onRasm:(r)=>setRasmlar(prev=>[...prev,r]) });
  }

  async function yubor() {
    if (!ishNomi.trim()) return Alert.alert("To'ldiring", 'Ish nomini kiriting');
    if (tavsif.trim().length < 10) return Alert.alert("To'ldiring", 'Tavsif kamida 10 belgi bo‘lishi kerak');
    if (rasmlar.length < minRasm) return Alert.alert("To'ldiring", `Kamida ${minRasm} ta rasm kerak`);
    if (gpsTalab && !gps) return Alert.alert('GPS', gpsXato || 'Lokatsiya hali aniqlanmadi');
    if (gps?.mocked) return Alert.alert('Rad etildi', 'Soxta GPS aniqlandi. Haqiqiy lokatsiyadan foydalaning.');

    const hisobot = {
      xodimId:xodim.id, deviceId:xodim.deviceId,
      ishTuri:vazifaRejimi?'Vazifa':'Umumiy', ishNomi:ishNomi.trim(), tavsif:tavsif.trim(),
      lat:gps?.lat??null, lng:gps?.lng??null, mocked:gps?.mocked===true,
      deviceVaqt:new Date().toISOString(), rasmlar:rasmlar.map(r=>r.b64),
      isBirBosqichli,
      ...(vazifaRejimi?{vazifaId:vazifa.id}:{}),
      ...(vazifaBosqich?{vazifaBosqichId:vazifaBosqich.id}:{}),
    };

    setYuborilmoqda(true);
    const net=await NetInfo.fetch();
    try{
      if(net.isConnected){
        const res=await post('hisobotBoshla',hisobot);
        if(res.ok){
          const title=isBirBosqichli?'Yakunlandi ✓':'Boshlandi ✓';
          const msg=vazifaRejimi
            ? (isBirBosqichli?'Vazifa hisoboti yuborildi. Natija administratorga tushdi.':'Vazifaning 1-bosqichi yuborildi. Keyingi bosqichni davom ettiring.')
            : (isBirBosqichli?'Hisobot muvaffaqiyatli yuborildi.':'1-bosqich qabul qilindi.');
          Alert.alert(title,msg,[{text:'OK',onPress:()=>vazifaRejimi?navigation.navigate('Tasks'):navigation.goBack()}]);
        }else Alert.alert('Rad etildi',res.xato);
      }else{
        await navbatgaQosh({...hisobot,action:'hisobotBoshla'});
        Alert.alert('Offline saqlandi','Internet kelganda avtomatik yuboriladi.',[{text:'OK',onPress:()=>navigation.navigate('Home')}]);
      }
    }catch(e){
      await navbatgaQosh({...hisobot,action:'hisobotBoshla'});
      Alert.alert('Navbatga saqlandi','Serverga ulanib bo‘lmadi.',[{text:'OK',onPress:()=>navigation.navigate('Home')}]);
    }finally{setYuborilmoqda(false);}
  }

  const headerTitle=vazifaRejimi?(vazifaBosqich?`${vazifaBosqich.tartib||''}. bosqich`:'Vazifa hisoboti'):(isBirBosqichli?'Tezkor Hisobot':'Yangi ish — 1-bosqich');

  return <View style={{flex:1,backgroundColor:RANG.fon}}>
    <View style={s.header}><TouchableOpacity onPress={()=>navigation.goBack()}><Text style={s.orqaga}>← Orqaga</Text></TouchableOpacity><Text style={s.title}>{headerTitle}</Text><View style={{width:60}}/></View>
    <ScrollView contentContainerStyle={{padding:16,paddingBottom:40}}>
      {vazifaRejimi?<View style={s.taskBanner}><Text style={s.taskLabel}>BIRIKTIRILGAN VAZIFA</Text><Text style={s.taskTitle}>{vazifa.sarlavha}</Text><Text style={s.taskDesc}>{vazifaBosqich?.tavsif||vazifa.tavsif||''}</Text><Text style={s.taskReq}>Talab: {minRasm} ta rasm · GPS {gpsTalab?'majburiy':'ixtiyoriy'}</Text></View>:null}

      {!vazifaRejimi?<View style={s.modeContainer}><TouchableOpacity style={[s.modeBtn,isBirBosqichli&&s.modeBtnActive]} onPress={()=>setIsBirBosqichli(true)}><Text style={[s.modeText,isBirBosqichli&&s.modeTextActive]}>1 Bosqichli</Text></TouchableOpacity><TouchableOpacity style={[s.modeBtn,!isBirBosqichli&&s.modeBtnActive]} onPress={()=>setIsBirBosqichli(false)}><Text style={[s.modeText,!isBirBosqichli&&s.modeTextActive]}>3 Bosqichli</Text></TouchableOpacity></View>:null}

      <View style={[s.gpsCard,{borderColor:gps?(gps.mocked?RANG.qizil:RANG.yashil):(gpsTalab?RANG.sariq:RANG.chiziq)}]}><Text style={{fontWeight:'700',color:gps?(gps.mocked?RANG.qizil:RANG.yashil):(gpsTalab?RANG.sariq:RANG.kul)}}>{gps?(gps.mocked?'⚠ Soxta GPS aniqlandi!':'✓ Lokatsiya aniqlandi'):(gpsXato||(gpsTalab?'GPS aniqlanmoqda...':'GPS ixtiyoriy'))}</Text>{gps?<Text style={s.gpsKoord}>{gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}</Text>:null}</View>

      <Text style={s.label}>Ish nomi *</Text><TextInput style={[s.input,vazifaRejimi&&s.readonly]} value={ishNomi} onChangeText={setIshNomi} editable={!vazifaRejimi} placeholder="Ish nomi"/>
      <Text style={s.label}>{isBirBosqichli?'Bajarilgan ish tavsifi *':'Boshlanish tavsifi *'}</Text><TextInput style={[s.input,{height:110,textAlignVertical:'top'}]} value={tavsif} onChangeText={setTavsif} multiline placeholder={vazifaBosqich?'Ushbu bosqichda nima bajarganingizni yozing...':'Qilingan ish haqida ma’lumot...'}/>
      <Text style={s.label}>Rasmlar ({minRasm}–10 ta, faqat kameradan)</Text>
      <View style={s.rasmQator}>{rasmlar.map((r,i)=><View key={i} style={s.rasmBox}><Image source={{uri:r.uri}} style={s.rasm}/><TouchableOpacity style={s.rasmOchir} onPress={()=>setRasmlar(prev=>prev.filter((_,j)=>j!==i))}><Text style={{color:'#fff',fontWeight:'800'}}>×</Text></TouchableOpacity></View>)}{rasmlar.length<10?<TouchableOpacity style={s.rasmQoshBtn} onPress={rasmQosh}><Text style={{fontSize:26,color:RANG.asosiy}}>📷</Text><Text style={{fontSize:11,color:RANG.asosiy,fontWeight:'600'}}>Surat olish</Text></TouchableOpacity>:null}</View>
      <TouchableOpacity style={[s.yuborBtn,yuborilmoqda&&{opacity:.6}]} onPress={yubor} disabled={yuborilmoqda}>{yuborilmoqda?<ActivityIndicator color="#fff"/>:<Text style={s.yuborText}>{vazifaBosqich?'BOSQICH HISOBOTINI YUBORISH':isBirBosqichli?'HISOBOTNI YUBORISH':'1-BOSQICHNI YUBORISH'}</Text>}</TouchableOpacity>
      {!isBirBosqichli?<Text style={s.ogohlantirish}>Keyingi bosqichni “Davom etayotgan ishlar” yoki vazifa ichidan davom ettirasiz.</Text>:null}
    </ScrollView>
  </View>;
}

const s=StyleSheet.create({
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:16,paddingTop:52,backgroundColor:RANG.oq,borderBottomWidth:1,borderColor:RANG.chiziq},orqaga:{color:RANG.asosiy,fontSize:15,fontWeight:'600',width:70},title:{fontSize:16,fontWeight:'800',color:RANG.toq},taskBanner:{backgroundColor:'#EFF6FF',borderWidth:1,borderColor:'#BFDBFE',borderRadius:14,padding:14,marginBottom:14},taskLabel:{fontSize:8.5,fontWeight:'900',color:RANG.asosiy},taskTitle:{fontSize:16,fontWeight:'900',color:RANG.toq,marginTop:5},taskDesc:{fontSize:11.5,color:'#52606D',lineHeight:17,marginTop:5},taskReq:{fontSize:10.5,color:RANG.asosiy,fontWeight:'800',marginTop:8},modeContainer:{flexDirection:'row',backgroundColor:'#E5E7EB',borderRadius:12,padding:4,marginBottom:16},modeBtn:{flex:1,paddingVertical:10,alignItems:'center',borderRadius:10},modeBtnActive:{backgroundColor:'#fff',elevation:2},modeText:{fontSize:13,fontWeight:'700',color:'#6B7286'},modeTextActive:{color:RANG.asosiy},gpsCard:{backgroundColor:RANG.oq,borderRadius:12,borderWidth:1.5,padding:13,marginBottom:6},gpsKoord:{color:RANG.kul,fontSize:12,marginTop:3},label:{fontSize:13,fontWeight:'700',color:RANG.toq,marginTop:15,marginBottom:6},input:{backgroundColor:RANG.oq,borderWidth:1,borderColor:RANG.chiziq,borderRadius:10,padding:13,fontSize:15},readonly:{backgroundColor:'#F1F5F9',color:'#475569'},rasmQator:{flexDirection:'row',flexWrap:'wrap',gap:10},rasmBox:{position:'relative'},rasm:{width:74,height:74,borderRadius:10},rasmOchir:{position:'absolute',top:-7,right:-7,backgroundColor:RANG.qizil,width:24,height:24,borderRadius:12,justifyContent:'center',alignItems:'center'},rasmQoshBtn:{width:74,height:74,borderRadius:10,borderWidth:1.5,borderColor:RANG.asosiy,borderStyle:'dashed',justifyContent:'center',alignItems:'center',backgroundColor:'#EFF5FD'},yuborBtn:{backgroundColor:RANG.yashil,borderRadius:12,padding:16,marginTop:26,alignItems:'center'},yuborText:{color:'#fff',fontWeight:'800',fontSize:14,letterSpacing:.3},ogohlantirish:{textAlign:'center',color:RANG.kul,fontSize:12,marginTop:10}
});
