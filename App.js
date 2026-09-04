// App.js — Xisobot Mobile V4
import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
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
import TasksScreen from './src/screens/TasksScreen';
import TaskDetailScreen from './src/screens/TaskDetailScreen';
import { avtoSyncYoq } from './src/queue';
import { tahrirBildirishnomasimi } from './src/utils/pushNotifications';
import { oxirgiJavobniSaqla } from './src/utils/tahrirKesh';

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

function pushdanOch(data = {}) {
  if (!navigationRef.isReady()) return;
  if (data?.turi === 'vazifa') {
    if (data?.vazifaId) navigationRef.navigate('TaskDetail', { vazifaId: data.vazifaId });
    else navigationRef.navigate('Tasks');
  }
}

export default function App() {
  const [boshlangichSahifa, setBoshlangichSahifa] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const bildirishnomaListener = useRef(null);

  useEffect(() => {
    const unsubscribe = avtoSyncYoq();

    (async () => {
      const xodim = await AsyncStorage.getItem('XODIM');
      setBoshlangichSahifa(xodim ? 'Home' : 'Login');
    })();

    bildirishnomaListener.current = Notifications.addNotificationReceivedListener(async (bildirishnoma) => {
      const { title, body } = bildirishnoma.request.content;
      if (tahrirBildirishnomasimi(title || '')) await oxirgiJavobniSaqla(title, body);
    });

    const javobListener = Notifications.addNotificationResponseReceivedListener(async (javob) => {
      const { title, body, data } = javob.notification.request.content;
      if (tahrirBildirishnomasimi(title || '')) await oxirgiJavobniSaqla(title, body);
      setTimeout(() => pushdanOch(data || {}), 150);
    });

    Notifications.getLastNotificationResponseAsync().then(javob => {
      if (javob?.notification?.request?.content?.data) {
        setTimeout(() => pushdanOch(javob.notification.request.content.data), 500);
      }
    }).catch(() => {});

    return () => {
      unsubscribe && unsubscribe();
      bildirishnomaListener.current && Notifications.removeNotificationSubscription(bildirishnomaListener.current);
      javobListener && Notifications.removeNotificationSubscription(javobListener);
    };
  }, []);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  if (!boshlangichSahifa) return null;

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Stack.Navigator initialRouteName={boshlangichSahifa} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} initialParams={{ isDarkMode, toggleTheme }} />
        <Stack.Screen name="NewReport" component={NewReportScreen} />
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen name="MyReports" component={MyReportsScreen} />
        <Stack.Screen name="PasswordChange" component={PasswordChangeScreen} />
        <Stack.Screen name="Stage" component={StageScreen} />
        <Stack.Screen name="Tasks" component={TasksScreen} />
        <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
