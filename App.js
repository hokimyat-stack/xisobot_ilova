// App.js — Kunlik Ish Hisoboti mobil ilovasi v3 (Theme qo'shilgan versiya)
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import NewReportScreen from './src/screens/NewReportScreen';
import StageScreen from './src/screens/StageScreen';
import CameraScreen from './src/screens/CameraScreen';
import MyReportsScreen from './src/screens/MyReportsScreen';
import PasswordChangeScreen from './src/screens/PasswordChangeScreen';
import { avtoSyncYoq } from './src/queue';
import { pushTokenSaqla } from './src/api';
import { RANG } from './src/config';

// Expo Go'da push cheklangan (SDK 53+) — faqat haqiqiy APK'da to'liq ishlaydi
const ExpoGo = Constants.appOwnership === 'expo';
const Notifications = ExpoGo ? null : require('expo-notifications');

const Stack = createNativeStackNavigator();

if (Notifications) Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false })
});

async function eslatmaOrnat() {
  if (!Notifications) return;
  await Notifications.requestPermissionsAsync();
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Kunlik hisobot', body: "Bugungi ish holatini yuklashni unutmang!" },
    trigger: { hour: 17, minute: 0, repeats: true }
  });
}

// Push token — Expo'ning bepul push xizmatiga ro'yxatdan o'tish, serverga yuborish
async function pushTokenRoyxatOl(xodimId) {
  if (!Notifications || !xodimId) return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    let ruxsat = status;
    if (status !== 'granted') {
      const r = await Notifications.requestPermissionsAsync();
      ruxsat = r.status;
    }
    if (ruxsat !== 'granted') return;
    const tokenData = await Notifications.getExpoPushTokenAsync();
    if (tokenData?.data) await pushTokenSaqla(xodimId, tokenData.data);
  } catch (e) { /* push ixtiyoriy — xato bo'lsa ilova ishlayveradi */ }
}

export default function App() {
  const [tayyor, setTayyor] = useState(false);
  const [xodim, setXodim] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    (async () => {
      // Saqlangan xodim va temani o'qib olish
      try {
        const [saqlanganXodim, saqlanganTema] = await Promise.all([
          AsyncStorage.getItem('XODIM'),
          AsyncStorage.getItem('THEME')
        ]);

        if (saqlanganXodim) {
          const x = JSON.parse(saqlanganXodim);
          setXodim(x);
          pushTokenRoyxatOl(x.id);
        }
        if (saqlanganTema) {
          setIsDarkMode(saqlanganTema === 'dark');
        }
      } catch (e) {}

      setTayyor(true);
      eslatmaOrnat();
    })();

    const unsub = avtoSyncYoq();
    return unsub;
  }, []);

  // Temani o'zgartirib global saqlash funksiyasi (buni istalgan screen'ga prop orqali uzatishingiz mumkin)
  const toggleTheme = async () => {
    try {
      const yangiHolat = !isDarkMode;
      setIsDarkMode(yangiHolat);
      await AsyncStorage.setItem('THEME', yangiHolat ? 'dark' : 'light');
    } catch (e) {}
  };

  if (!tayyor) return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: isDarkMode ? '#0F172A' : RANG.fon }}>
      <ActivityIndicator size="large" color={RANG.asosiy} />
    </View>
  );

  return (
    <NavigationContainer>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
        initialRouteName={xodim ? 'Home' : 'Login'}
      >
        {/* Screen'larga isDarkMode va toggleTheme funksiyasini yuborish uchun initialParams yoki children ishlatish mumkin */}
        <Stack.Screen name="Login" component={LoginScreen} initialParams={{ isDarkMode, toggleTheme }} />
        <Stack.Screen name="Home" component={HomeScreen} initialParams={{ isDarkMode, toggleTheme }} />
        <Stack.Screen name="NewReport" component={NewReportScreen} initialParams={{ isDarkMode, toggleTheme }} />
        <Stack.Screen name="Stage" component={StageScreen} initialParams={{ isDarkMode, toggleTheme }} />
        <Stack.Screen name="Camera" component={CameraScreen} initialParams={{ isDarkMode, toggleTheme }} />
        <Stack.Screen name="MyReports" component={MyReportsScreen} initialParams={{ isDarkMode, toggleTheme }} />
        <Stack.Screen name="PasswordChange" component={PasswordChangeScreen} initialParams={{ isDarkMode, toggleTheme }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
