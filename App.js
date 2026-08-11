// App.js
import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import NewReportScreen from './src/screens/NewReportScreen';
import CameraScreen from './src/screens/CameraScreen';
import MyReportsScreen from './src/screens/MyReportsScreen';
import PasswordChangeScreen from './src/screens/PasswordChangeScreen';
import StageScreen from './src/screens/StageScreen';
import { avtoSyncYoq } from './src/queue';
import { tahrirBildirishnomasimi } from './src/utils/pushNotifications';
import { oxirgiJavobniSaqla } from './src/utils/tahrirKesh';

const Stack = createNativeStackNavigator();

export default function App() {
  const [boshlangichSahifa, setBoshlangichSahifa] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const bildirishnomaListener = useRef(null);

  useEffect(() => {
    // Ilova ochilishi bilan internet kelganda offline hisobotlarni avtomatik yuborishni yoqamiz
    const unsubscribe = avtoSyncYoq();

    (async () => {
      const xodim = await AsyncStorage.getItem('XODIM');
      setBoshlangichSahifa(xodim ? 'Home' : 'Login');
    })();

    // Ilova ochiq turgan paytda (foreground) kelgan bildirishnomani ushlab, agar u
    // tahrir so'roviga tegishli bo'lsa — mahalliy keshga yozamiz, MyReportsScreen
    // buni banner sifatida ko'rsatadi. Ilova yopiq/fonda bo'lsa, OS o'zi bildirishnoma
    // ko'rsatadi (Expo Push orqali) — bu holatda ham foydalanuvchi ilovani ochganda
    // shu listener ishlaydi (aslida "response received" tomonidan).
    bildirishnomaListener.current = Notifications.addNotificationReceivedListener(async (bildirishnoma) => {
      const { title, body } = bildirishnoma.request.content;
      if (tahrirBildirishnomasimi(title || '')) {
        await oxirgiJavobniSaqla(title, body);
      }
    });
    const javobListener = Notifications.addNotificationResponseReceivedListener(async (javob) => {
      const { title, body } = javob.notification.request.content;
      if (tahrirBildirishnomasimi(title || '')) {
        await oxirgiJavobniSaqla(title, body);
      }
    });

    return () => {
      unsubscribe && unsubscribe();
      bildirishnomaListener.current && Notifications.removeNotificationSubscription(bildirishnomaListener.current);
      javobListener && Notifications.removeNotificationSubscription(javobListener);
    };
  }, []);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  if (!boshlangichSahifa) return null;

  return (
    <NavigationContainer>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Stack.Navigator initialRouteName={boshlangichSahifa} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} initialParams={{ isDarkMode, toggleTheme }} />
        <Stack.Screen name="NewReport" component={NewReportScreen} />
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen name="MyReports" component={MyReportsScreen} />
        <Stack.Screen name="PasswordChange" component={PasswordChangeScreen} />
        <Stack.Screen name="Stage" component={StageScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
