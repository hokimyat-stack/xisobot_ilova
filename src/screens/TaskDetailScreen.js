// src/screens/TaskDetailScreen.js — V4 vazifani ko'rish va bajarish
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Alert, TextInput, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { menikiOl, vazifalarimOl, vazifaKorildi, vazifaOddiyYakun, vazifaMuddatSora, vazifaIzohlarOl, vazifaIzohQosh } from '../api';
import { RANG } from '../config';

const HOLAT={kutilmoqda:'Yangi',korildi:'Ko‘rildi',jarayonda:'Jarayonda',tekshiruvda:'Tekshiruvda',bajarildi:'Bajarildi',tasdiqlandi:'Tasdiqlandi',qaytarildi:'Qaytarildi',muddat_otdi:'Muddati o‘tgan',bekor_qilindi:'Bekor qilingan'};
const TURI={tasdiq:'Faqat bajarildi deb tasdiqlash',bir_martalik:'1 bosqichli rasmli hisobot',uch_bosqichli:'3 bosqichli hisobot',kop_bosqichli:'Ko‘p bosqichli vazifa'};
const YOPIQ=new Set(['bajarildi','tasdiqlandi','bekor_qilindi','tekshiruvda']);
function dt(v){if(!v)return 'Ko‘rsatilmagan';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleString('uz-UZ',{dateStyle:'medium',timeStyle:'short'});}
function statusColor(h){if(h==='muddat_otdi'||h==='qaytarildi')return RANG.qizil;if(h==='bajarildi'||h==='tasdiqlandi')return RANG.yashil;if(h==='tekshiruvda')return '#7C3AED';if(h==='jarayonda')return RANG.asosiy;return RANG.sariq;}

export default function TaskDetailScreen({navigation,route}){
  const vazifaId=route.params?.vazifaId||route.params?.vazifa?.id;
  const [xodim,setXodim]=useState(null);
  const [v,setV]=useState(route.params?.vazifa||null);
  const [hisobotlar,setHisobotlar]=useState([]);
  const [izohlar,setIzohlar]=useState([]);
  const [loading,setLoading]=useState(true);
  const [muddatOch,setMuddatOch]=useState(false);
  const [muddatSabab,setMuddatSabab]=useState('');
  const [izoh,setIzoh]=useState('');
  const [amal,setAmal]=useState(false);

  useFocusEffect(useCallback(()=>{yukla();},[vazifaId]));

  async function yukla(){
    setLoading(true);
    try{
      const raw=await AsyncStorage.getItem('XODIM');
      if(!raw){navigation.replace('Login');return;}
      const x=JSON.parse(raw);setXodim(x);
      const [vr,hr,ir]=await Promise.all([vazifalarimOl(x.id),menikiOl(x.id),vazifaIzohlarOl(vazifaId,x.id)]);
      if(vr.ok){const found=(vr.vazifalar||[]).find(a=>String(a.id)===String(vazifaId));if(found)setV(found);await AsyncStorage.setItem(`VAZIFALAR_CACHE_${x.id}`,JSON.stringify(vr.vazifalar||[]));}
      if(hr.ok)setHisobotlar((hr.hisobotlar||[]).filter(h=>String(h.vazifaId||'')===String(vazifaId)));
      if(ir.ok)setIzohlar(ir.izohlar||[]);
      vazifaKorildi(vazifaId).catch(()=>{});
    }finally{setLoading(false);}
  }

  const holat=v?.samaraliHolat||v?.holat||'kutilmoqda';
  const turi=v?.bajarish_turi||v?.bajarishTuri||'bir_martalik';
  const bosqichlar=Array.isArray(v?.bosqichlar)?v.bosqichlar:[];
  const faolHisobot=useMemo(()=>hisobotlar.find(h=>h.bosqich!=='YAKUNLANDI'),[hisobotlar]);
  const keyingiBosqich=useMemo(()=>bosqichlar.find(b=>!['bajarildi','tasdiqlandi'].includes(String(b.holat))),[bosqichlar]);
  const boshlanishKelmagan=v?.boshlanish_at&&new Date(v.boshlanish_at).getTime()>Date.now();
  const yopiq=YOPIQ.has(holat);

  async function bajar(){
    if(!v||amal||yopiq||boshlanishKelmagan)return;
    if(turi==='tasdiq'){
      Alert.alert('Vazifani yakunlash','Vazifa bajarilganini tasdiqlaysizmi?',[
        {text:'Yo‘q',style:'cancel'},
        {text:'Ha, bajarildi',onPress:async()=>{setAmal(true);const r=await vazifaOddiyYakun(v.id);setAmal(false);if(r.ok){Alert.alert('Qabul qilindi','Vazifa tekshiruvga yuborildi.');yukla();}else Alert.alert('Xato',r.xato);}}
      ]);return;
    }
    if(turi==='uch_bosqichli'&&faolHisobot){navigation.navigate('Stage',{hisobot:faolHisobot,vazifa:v});return;}
    if(turi==='kop_bosqichli'){
      if(!keyingiBosqich)return Alert.alert('Tayyor','Barcha bosqichlar bajarilgan.');
      navigation.navigate('NewReport',{vazifa:v,vazifaBosqich:keyingiBosqich});return;
    }
    navigation.navigate('NewReport',{vazifa:v});
  }

  async function muddatYubor(){
    if(muddatSabab.trim().length<5)return Alert.alert('Sabab','Muddat uzaytirish sababini yozing.');
    setAmal(true);const r=await vazifaMuddatSora(v.id,muddatSabab.trim());setAmal(false);
    if(r.ok){setMuddatOch(false);setMuddatSabab('');Alert.alert('Yuborildi','Muddat uzaytirish so‘rovi administratorga yuborildi.');yukla();}else Alert.alert('Xato',r.xato);
  }

  async function izohYubor(){
    if(!izoh.trim())return;setAmal(true);const r=await vazifaIzohQosh(v.id,xodim.id,izoh.trim());setAmal(false);if(r.ok){setIzoh('');yukla();}else Alert.alert('Xato',r.xato);
  }

  if(!v&&!loading)return <View style={s.wrap}><View style={s.header}><TouchableOpacity onPress={()=>navigation.goBack()}><Text style={s.back}>← Orqaga</Text></TouchableOpacity><Text style={s.title}>Vazifa</Text><View style={{width:70}}/></View><View style={s.center}><Text>Vazifa topilmadi</Text></View></View>;
  if(!v)return <View style={s.wrap}><View style={s.center}><Text>Yuklanmoqda...</Text></View></View>;

  const actionText=turi==='tasdiq'?'BAJARILDI DEB BELGILASH':turi==='uch_bosqichli'&&faolHisobot?'KEYINGI BOSQICHNI DAVOM ETTIRISH':turi==='kop_bosqichli'?(keyingiBosqich?`${keyingiBosqich.tartib||''}. BOSQICHNI BAJARISH`:'BARCHA BOSQICHLAR TUGAGAN'):'VAZIFA HISOBOTINI YUBORISH';

  return <View style={s.wrap}>
    <View style={s.header}><TouchableOpacity onPress={()=>navigation.goBack()}><Text style={s.back}>← Orqaga</Text></TouchableOpacity><Text style={s.title}>Vazifa</Text><TouchableOpacity onPress={yukla}><Text style={s.refresh}>↻</Text></TouchableOpacity></View>
    <ScrollView contentContainerStyle={s.body} refreshControl={<RefreshControl refreshing={loading} onRefresh={yukla} colors={[RANG.asosiy]}/>}>
      <View style={s.hero}>
        <View style={s.heroTop}><Text style={[s.status,{color:statusColor(holat)}]}>{HOLAT[holat]||holat}</Text><Text style={s.priority}>{String(v.ustuvorlik||'oddiy').toUpperCase()}</Text></View>
        <Text style={s.taskTitle}>{v.sarlavha||v.matn}</Text>
        <Text style={s.desc}>{v.tavsif||v.matn||''}</Text>
        <View style={s.infoGrid}>
          <View style={s.info}><Text style={s.infoLab}>TURI</Text><Text style={s.infoVal}>{TURI[turi]||turi}</Text></View>
          <View style={s.info}><Text style={s.infoLab}>MUDDAT</Text><Text style={[s.infoVal,holat==='muddat_otdi'?{color:RANG.qizil}:null]}>{dt(v.muddat_at||v.muddatAt||v.muddat)}</Text></View>
          <View style={s.info}><Text style={s.infoLab}>RASM</Text><Text style={s.infoVal}>Kamida {Number(v.min_rasm??v.minRasm??1)} ta</Text></View>
          <View style={s.info}><Text style={s.infoLab}>GPS</Text><Text style={s.infoVal}>{(v.gps_talab??v.gpsTalab)!==false?'Majburiy':'Ixtiyoriy'}</Text></View>
        </View>
      </View>

      {v.qaytarish_izohi?<View style={[s.notice,{backgroundColor:'#FEF2F2',borderColor:'#FECACA'}]}><Text style={{color:RANG.qizil,fontWeight:'900'}}>Qaytarilgan</Text><Text style={s.noticeText}>{v.qaytarish_izohi}</Text></View>:null}
      {v.muddat_sorovi_holat==='kutilmoqda'?<View style={[s.notice,{backgroundColor:'#FFFBEB',borderColor:'#FDE68A'}]}><Text style={{color:RANG.sariq,fontWeight:'900'}}>Muddat so‘rovi ko‘rib chiqilmoqda</Text><Text style={s.noticeText}>{v.muddat_sorovi}</Text></View>:null}
      {boshlanishKelmagan?<View style={s.notice}><Text style={{fontWeight:'900',color:RANG.asosiy}}>Boshlanish vaqti hali kelmagan</Text><Text style={s.noticeText}>{dt(v.boshlanish_at)}</Text></View>:null}

      {bosqichlar.length?<View style={s.section}><Text style={s.sectionTitle}>Vazifa bosqichlari</Text>{bosqichlar.map((b,i)=>{const done=['bajarildi','tasdiqlandi'].includes(String(b.holat));return <View key={b.id||i} style={[s.step,done&&s.stepDone]}><View style={[s.stepNo,done&&{backgroundColor:RANG.yashil}]}><Text style={s.stepNoText}>{done?'✓':(b.tartib||i+1)}</Text></View><View style={{flex:1}}><Text style={s.stepTitle}>{b.nomi}</Text>{b.tavsif?<Text style={s.stepDesc}>{b.tavsif}</Text>:null}<Text style={[s.stepState,{color:done?RANG.yashil:RANG.kul}]}>{done?'Bajarilgan':(b.holat==='qaytarildi'?'Qaytarilgan':'Kutilmoqda')}</Text></View></View>})}</View>:null}

      {Array.isArray(v.ilovalar)&&v.ilovalar.length?<View style={s.section}><Text style={s.sectionTitle}>Biriktirilgan fayllar</Text>{v.ilovalar.map((f,i)=><TouchableOpacity key={i} style={s.file} onPress={()=>Linking.openURL(f.url)}><Text style={s.fileTitle}>{f.nomi||'Fayl'}</Text><Text style={s.fileOpen}>Ochish →</Text></TouchableOpacity>)}</View>:null}

      {hisobotlar.length?<View style={s.section}><Text style={s.sectionTitle}>Ushbu vazifaga oid hisobotlar ({hisobotlar.length})</Text>{hisobotlar.map(h=><View key={h.id} style={s.report}><Text style={s.reportTitle}>{h.ishNomi||h.ishTuri}</Text><Text style={s.reportSub}>{h.sana||''} · {h.bosqich||''}</Text></View>)}</View>:null}

      <View style={s.section}><Text style={s.sectionTitle}>Izohlar</Text>{izohlar.length?izohlar.map((i,idx)=><View key={i.id||idx} style={s.comment}><Text style={s.commentMeta}>{i.muallif_fio} · {i.muallif_rol}</Text><Text style={s.commentText}>{i.matn}</Text></View>):<Text style={s.muted}>Hozircha izoh yo‘q.</Text>}
        <View style={s.commentForm}><TextInput style={s.commentInput} value={izoh} onChangeText={setIzoh} placeholder="Izoh yozing..." multiline/><TouchableOpacity style={s.commentBtn} onPress={izohYubor} disabled={amal}><Text style={s.commentBtnText}>Yuborish</Text></TouchableOpacity></View>
      </View>

      {!yopiq&&v.muddat_sorovi_holat!=='kutilmoqda'?<View style={s.section}><TouchableOpacity onPress={()=>setMuddatOch(!muddatOch)}><Text style={s.link}>Muddat uzaytirishni so‘rash</Text></TouchableOpacity>{muddatOch?<View style={{marginTop:10}}><TextInput style={[s.input,{height:90,textAlignVertical:'top'}]} value={muddatSabab} onChangeText={setMuddatSabab} multiline placeholder="Nima sababdan qo‘shimcha vaqt kerak?"/><TouchableOpacity style={s.secondaryBtn} onPress={muddatYubor} disabled={amal}><Text style={s.secondaryText}>SO‘ROVNI YUBORISH</Text></TouchableOpacity></View>:null}</View>:null}

      <TouchableOpacity style={[s.action,(yopiq||boshlanishKelmagan||!keyingiBosqich&&turi==='kop_bosqichli')&&s.disabled]} onPress={bajar} disabled={amal||yopiq||boshlanishKelmagan||(!keyingiBosqich&&turi==='kop_bosqichli')}><Text style={s.actionText}>{amal?'KUTILMOQDA...':actionText}</Text></TouchableOpacity>
      {holat==='tekshiruvda'?<Text style={s.bottomHint}>Hisobot yuborilgan. Administrator tasdig‘i kutilmoqda.</Text>:null}
    </ScrollView>
  </View>;
}

const s=StyleSheet.create({
  wrap:{flex:1,backgroundColor:RANG.fon},center:{flex:1,alignItems:'center',justifyContent:'center'},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:18,paddingTop:52,paddingBottom:15,backgroundColor:'#fff',borderBottomWidth:1,borderBottomColor:RANG.chiziq},back:{width:70,color:RANG.asosiy,fontWeight:'700'},title:{fontSize:17,fontWeight:'900',color:RANG.toq},refresh:{width:70,textAlign:'right',fontSize:23,color:RANG.asosiy},body:{padding:16,paddingBottom:45},hero:{backgroundColor:'#fff',borderRadius:18,padding:18,borderWidth:1,borderColor:RANG.chiziq},heroTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},status:{fontSize:11,fontWeight:'900'},priority:{fontSize:9,fontWeight:'900',color:RANG.sariq,backgroundColor:'#FFF7E6',paddingHorizontal:8,paddingVertical:5,borderRadius:20},taskTitle:{fontSize:21,fontWeight:'900',color:RANG.toq,marginTop:13},desc:{fontSize:13,color:'#52606D',lineHeight:20,marginTop:8},infoGrid:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:16},info:{width:'48%',backgroundColor:'#F8FAFC',borderRadius:12,padding:11},infoLab:{fontSize:8.5,fontWeight:'900',color:RANG.kul},infoVal:{fontSize:11.5,fontWeight:'800',color:RANG.toq,marginTop:4},notice:{backgroundColor:'#EFF6FF',borderWidth:1,borderColor:'#BFDBFE',borderRadius:13,padding:13,marginTop:12},noticeText:{fontSize:12,color:'#52606D',lineHeight:18,marginTop:4},section:{backgroundColor:'#fff',borderRadius:16,padding:16,borderWidth:1,borderColor:RANG.chiziq,marginTop:12},sectionTitle:{fontSize:14,fontWeight:'900',color:RANG.toq,marginBottom:12},step:{flexDirection:'row',gap:11,paddingVertical:11,borderBottomWidth:1,borderBottomColor:'#EEF2F7'},stepDone:{opacity:.8},stepNo:{width:30,height:30,borderRadius:10,backgroundColor:'#E8A013',alignItems:'center',justifyContent:'center'},stepNoText:{color:'#fff',fontWeight:'900'},stepTitle:{fontSize:13,fontWeight:'800',color:RANG.toq},stepDesc:{fontSize:11.5,color:RANG.kul,marginTop:3,lineHeight:17},stepState:{fontSize:10,fontWeight:'800',marginTop:5},file:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:10,borderBottomWidth:1,borderBottomColor:'#EEF2F7'},fileTitle:{flex:1,fontSize:12.5,fontWeight:'700',color:RANG.toq},fileOpen:{fontSize:11,color:RANG.asosiy,fontWeight:'800'},report:{padding:12,backgroundColor:'#F8FAFC',borderRadius:12,marginBottom:7},reportTitle:{fontSize:12.5,fontWeight:'800',color:RANG.toq},reportSub:{fontSize:10.5,color:RANG.kul,marginTop:4},comment:{backgroundColor:'#F8FAFC',borderRadius:11,padding:11,marginBottom:7},commentMeta:{fontSize:9.5,fontWeight:'800',color:RANG.kul},commentText:{fontSize:12.5,color:RANG.toq,marginTop:4,lineHeight:18},muted:{fontSize:12,color:RANG.kul},commentForm:{marginTop:10},commentInput:{minHeight:70,borderWidth:1,borderColor:RANG.chiziq,borderRadius:11,padding:11,textAlignVertical:'top'},commentBtn:{alignSelf:'flex-end',backgroundColor:RANG.asosiy,paddingHorizontal:16,paddingVertical:9,borderRadius:10,marginTop:7},commentBtnText:{color:'#fff',fontWeight:'800',fontSize:11},link:{color:RANG.asosiy,fontWeight:'800',fontSize:12.5},input:{borderWidth:1,borderColor:RANG.chiziq,borderRadius:11,padding:12,backgroundColor:'#F8FAFC'},secondaryBtn:{backgroundColor:'#EFF6FF',borderRadius:11,padding:13,alignItems:'center',marginTop:8},secondaryText:{color:RANG.asosiy,fontWeight:'900',fontSize:11},action:{backgroundColor:RANG.asosiy,borderRadius:14,padding:16,alignItems:'center',marginTop:16,elevation:3},disabled:{backgroundColor:'#CBD5E1',elevation:0},actionText:{color:'#fff',fontWeight:'900',fontSize:13,letterSpacing:.3},bottomHint:{textAlign:'center',color:RANG.kul,fontSize:11,marginTop:8}
});
