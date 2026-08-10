// App.js
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import NewReportScreen from './src/screens/NewReportScreen';
import CameraScreen from './src/screens/CameraScreen';
import MyReportsScreen from './src/screens/MyReportsScreen';
import PasswordChangeScreen from './src/screens/PasswordChangeScreen';
import StageScreen from './src/screens/StageScreen';
import { avtoSyncYoq } from './src/queue';

const Stack = createNativeStackNavigator();

export default function App() {
  const [boshlangichSahifa, setBoshlangichSahifa] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Ilova ochilishi bilan internet kelganda offline hisobotlarni avtomatik yuborishni yoqamiz
    const unsubscribe = avtoSyncYoq();

    (async () => {
      const xodim = await AsyncStorage.getItem('XODIM');
      setBoshlangichSahifa(xodim ? 'Home' : 'Login');
    })();

    return () => unsubscribe();
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
