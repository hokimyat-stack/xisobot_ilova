// src/screens/TasksScreen.js — xodimga biriktirilgan V4 vazifalar
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { vazifalarimOl } from '../api';
import { RANG } from '../config';

const HOLAT={kutilmoqda:'Yangi',korildi:'Ko‘rildi',jarayonda:'Jarayonda',tekshiruvda:'Tekshiruvda',bajarildi:'Bajarildi',tasdiqlandi:'Tasdiqlandi',qaytarildi:'Qaytarildi',muddat_otdi:'Muddati o‘tgan',bekor_qilindi:'Bekor qilingan'};
const TURI={tasdiq:'Tasdiqlash',bir_martalik:'1 bosqichli',uch_bosqichli:'3 bosqichli',kop_bosqichli:'Ko‘p bosqichli'};

function dateText(v){ if(!v)return 'Muddat yo‘q'; const d=new Date(v); return Number.isNaN(d.getTime())?String(v):d.toLocaleString('uz-UZ',{dateStyle:'medium',timeStyle:'short'}); }
function rang(h){ if(h==='muddat_otdi'||h==='qaytarildi')return RANG.qizil; if(h==='bajarildi'||h==='tasdiqlandi')return RANG.yashil; if(h==='tekshiruvda')return '#7C3AED'; if(h==='jarayonda')return RANG.asosiy; return RANG.sariq; }

export default function TasksScreen({navigation}){
  const [xodim,setXodim]=useState(null);
  const [list,setList]=useState([]);
  const [loading,setLoading]=useState(true);
  const [q,setQ]=useState('');
  const [filter,setFilter]=useState('faol');

  useFocusEffect(useCallback(()=>{yukla();},[]));

  async function yukla(){
    setLoading(true);
    try{
      const raw=await AsyncStorage.getItem('XODIM');
      if(!raw){navigation.replace('Login');return;}
      const x=JSON.parse(raw); setXodim(x);
      const cache=await AsyncStorage.getItem(`VAZIFALAR_CACHE_${x.id}`);
      if(cache){ try{setList(JSON.parse(cache)||[]);}catch(_){} }
      const r=await vazifalarimOl(x.id);
      if(r.ok){setList(r.vazifalar||[]);await AsyncStorage.setItem(`VAZIFALAR_CACHE_${x.id}`,JSON.stringify(r.vazifalar||[]));}
    }finally{setLoading(false);}
  }

  const shown=useMemo(()=>{
    const nq=q.trim().toLowerCase();
    return list.filter(v=>{
      const h=v.samaraliHolat||v.holat;
      const matn=[v.sarlavha,v.tavsif,v.ustuvorlik,TURI[v.bajarish_turi||v.bajarishTuri]].join(' ').toLowerCase();
      const qok=!nq||matn.includes(nq);
      let fok=true;
      if(filter==='faol')fok=!['bajarildi','tasdiqlandi','bekor_qilindi','tekshiruvda'].includes(h);
      else if(filter==='tekshiruv')fok=h==='tekshiruvda';
      else if(filter==='yakun')fok=['bajarildi','tasdiqlandi','bekor_qilindi'].includes(h);
      return qok&&fok;
    });
  },[list,q,filter]);

  return <View style={s.wrap}>
    <View style={s.header}><TouchableOpacity onPress={()=>navigation.goBack()}><Text style={s.back}>← Orqaga</Text></TouchableOpacity><Text style={s.title}>Mening vazifalarim</Text><View style={{width:70}}/></View>
    <View style={s.top}>
      <TextInput value={q} onChangeText={setQ} placeholder="Vazifani qidirish..." style={s.search}/>
      <View style={s.tabs}>{[['faol','Faol'],['tekshiruv','Tekshiruv'],['yakun','Yakunlangan'],['barchasi','Barchasi']].map(([id,nom])=><TouchableOpacity key={id} style={[s.tab,filter===id&&s.tabOn]} onPress={()=>setFilter(id)}><Text style={[s.tabText,filter===id&&s.tabTextOn]}>{nom}</Text></TouchableOpacity>)}</View>
    </View>
    <ScrollView contentContainerStyle={s.body} refreshControl={<RefreshControl refreshing={loading} onRefresh={yukla} colors={[RANG.asosiy]}/>}>
      {shown.map(v=>{const h=v.samaraliHolat||v.holat;const bosq=Array.isArray(v.bosqichlar)?v.bosqichlar:[];const done=bosq.filter(b=>['bajarildi','tasdiqlandi'].includes(b.holat)).length;return <TouchableOpacity key={v.id} style={s.card} onPress={()=>navigation.navigate('TaskDetail',{vazifaId:v.id,vazifa:v})}>
        <View style={s.cardTop}><View style={[s.dot,{backgroundColor:rang(h)}]}/><Text style={s.taskTitle}>{v.sarlavha||v.matn||'Vazifa'}</Text><Text style={[s.status,{color:rang(h)}]}>{HOLAT[h]||h}</Text></View>
        <Text style={s.desc} numberOfLines={2}>{v.tavsif||v.matn||''}</Text>
        <View style={s.meta}><Text style={s.chip}>{TURI[v.bajarish_turi||v.bajarishTuri]||'Vazifa'}</Text><Text style={s.chip}>{v.ustuvorlik||'oddiy'}</Text>{bosq.length?<Text style={s.chip}>{done}/{bosq.length} bosqich</Text>:null}</View>
        <View style={s.deadline}><Text style={{color:h==='muddat_otdi'?RANG.qizil:RANG.kul,fontSize:11,fontWeight:'700'}}>Muddat: {dateText(v.muddat_at||v.muddatAt||v.muddat)}</Text><Text style={s.open}>Ochish →</Text></View>
      </TouchableOpacity>})}
      {!shown.length&&!loading?<View style={s.empty}><Text style={s.emptyIco}>✓</Text><Text style={s.emptyTitle}>Bu bo‘limda vazifa yo‘q</Text><Text style={s.emptySub}>Yangi topshiriq biriktirilsa shu yerda ko‘rinadi.</Text></View>:null}
    </ScrollView>
  </View>;
}

const s=StyleSheet.create({
  wrap:{flex:1,backgroundColor:RANG.fon},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:18,paddingTop:52,paddingBottom:15,backgroundColor:'#fff',borderBottomWidth:1,borderBottomColor:RANG.chiziq},back:{width:70,color:RANG.asosiy,fontWeight:'700'},title:{fontSize:17,fontWeight:'900',color:RANG.toq},top:{backgroundColor:'#fff',paddingHorizontal:16,paddingBottom:13},search:{height:44,borderWidth:1,borderColor:RANG.chiziq,borderRadius:12,paddingHorizontal:13,backgroundColor:'#F8FAFC'},tabs:{flexDirection:'row',gap:6,marginTop:10,flexWrap:'wrap'},tab:{paddingVertical:7,paddingHorizontal:10,borderRadius:20,backgroundColor:'#F1F5F9'},tabOn:{backgroundColor:RANG.asosiy},tabText:{fontSize:10.5,fontWeight:'800',color:RANG.kul},tabTextOn:{color:'#fff'},body:{padding:16,paddingBottom:40},card:{backgroundColor:'#fff',borderWidth:1,borderColor:RANG.chiziq,borderRadius:16,padding:16,marginBottom:11,elevation:1},cardTop:{flexDirection:'row',alignItems:'center',gap:8},dot:{width:9,height:9,borderRadius:5},taskTitle:{flex:1,fontSize:15,fontWeight:'800',color:RANG.toq},status:{fontSize:10,fontWeight:'900'},desc:{fontSize:12,color:RANG.kul,lineHeight:18,marginTop:9},meta:{flexDirection:'row',gap:6,flexWrap:'wrap',marginTop:11},chip:{fontSize:9.5,fontWeight:'800',color:RANG.asosiy,backgroundColor:'#EFF6FF',paddingHorizontal:8,paddingVertical:5,borderRadius:20},deadline:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:13,paddingTop:11,borderTopWidth:1,borderTopColor:'#EEF2F7'},open:{fontSize:11,color:RANG.asosiy,fontWeight:'800'},empty:{alignItems:'center',paddingVertical:70},emptyIco:{fontSize:42,color:RANG.yashil},emptyTitle:{fontSize:16,fontWeight:'800',color:RANG.toq,marginTop:10},emptySub:{fontSize:12,color:RANG.kul,marginTop:5,textAlign:'center'}
});
