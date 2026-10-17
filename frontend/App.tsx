import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { AlertProvider } from './src/context/AlertContext';
import { AppNavigator } from './src/navigation';
import { WebContainer } from './src/components/layout/WebContainer';

export default function App() {
  return (
    <SafeAreaProvider>
      <AlertProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <WebContainer>
            <AppNavigator />
          </WebContainer>
        </AuthProvider>
      </AlertProvider>
    </SafeAreaProvider>
  );
}

