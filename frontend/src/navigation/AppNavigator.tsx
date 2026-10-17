import React from 'react';
import { Text, StyleSheet } from 'react-native';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { RootStackParamList, MainTabParamList } from './types';
import { SplashScreen } from '../screens/splash/SplashScreen';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { OtpVerificationScreen } from '../screens/auth/OtpVerificationScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { OrdersScreen } from '../screens/orders/OrdersScreen';
import { TeamScreen } from '../screens/team/TeamScreen';
import { RewardsScreen } from '../screens/rewards/RewardsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { BuyScreen } from '../screens/buy/BuyScreen';
import { SellScreen } from '../screens/sell/SellScreen';
import { UpiScreen } from '../screens/upi/UpiScreen';
import { WalletScreen } from '../screens/wallet/WalletScreen';
import { RequestScreen } from '../screens/request/RequestScreen';
import { Colors } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Bottom Tab Navigation for logged-in users
const BottomTabs: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 4,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      >
        {(props) => (
          <HomeScreen
            onNavigateToProfile={() => props.navigation.navigate('Profile')}
            onNavigateToOrders={() => props.navigation.navigate('Orders')}
            onNavigateToTeam={() => props.navigation.navigate('Team')}
            onNavigateToRewards={() => props.navigation.navigate('Rewards')}
            onNavigateToBuy={() => {
              if (navigationRef.isReady()) {
                navigationRef.navigate('Buy');
              }
            }}
            onNavigateToSell={() => {
              if (navigationRef.isReady()) {
                navigationRef.navigate('Sell');
              }
            }}
            onNavigateToUpi={() => {
              if (navigationRef.isReady()) {
                navigationRef.navigate('UPI');
              }
            }}
            onNavigateToRequest={() => {
              if (navigationRef.isReady()) {
                navigationRef.navigate('Request');
              }
            }}
            onNavigateToWallet={() => {
              if (navigationRef.isReady()) {
                navigationRef.navigate('Wallet');
              }
            }}
          />
        )}
      </Tab.Screen>


      <Tab.Screen
        name="Orders"
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'swap-horizontal' : 'swap-horizontal-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      >
        {(props) => (
          <OrdersScreen
            onNavigateToProfile={() => props.navigation.navigate('Profile')}
            onNavigateToBuy={() => {
              if (navigationRef.isReady()) {
                navigationRef.navigate('Buy');
              }
            }}
            onNavigateToSell={() => {
              if (navigationRef.isReady()) {
                navigationRef.navigate('Sell');
              }
            }}
            onNavigateToWallet={() => {
              if (navigationRef.isReady()) {
                navigationRef.navigate('Wallet');
              }
            }}
          />
        )}
      </Tab.Screen>

      <Tab.Screen
        name="Team"
        options={{
          tabBarLabel: 'Team',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'people' : 'people-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      >
        {(props) => (
          <TeamScreen
            onNavigateToProfile={() => props.navigation.navigate('Profile')}
            onNavigateToWallet={() => {
              if (navigationRef.isReady()) {
                navigationRef.navigate('Wallet');
              }
            }}
          />
        )}
      </Tab.Screen>

      <Tab.Screen
        name="Rewards"
        options={{
          tabBarLabel: 'Rewards',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'gift' : 'gift-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      >
        {(props) => (
          <RewardsScreen
            onNavigateToBuy={() => {
              if (navigationRef.isReady()) {
                navigationRef.navigate('Buy');
              }
            }}
            onNavigateToWallet={() => {
              if (navigationRef.isReady()) {
                navigationRef.navigate('Wallet');
              }
            }}
            onNavigateToTeam={() => props.navigation.navigate('Team')}
          />
        )}
      </Tab.Screen>

      <Tab.Screen
        name="Profile"
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      >
        {(props) => (
          <ProfileScreen
            onLogout={() => {
              if (navigationRef.isReady()) {
                navigationRef.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }
            }}
            onNavigateToBuy={() => {
              if (navigationRef.isReady()) {
                navigationRef.navigate('Buy');
              }
            }}
            onNavigateToSell={() => {
              if (navigationRef.isReady()) {
                navigationRef.navigate('Sell');
              }
            }}
            onNavigateToOrders={() => {
              props.navigation.navigate('Orders');
            }}
            onNavigateToWallet={() => {
              if (navigationRef.isReady()) {
                navigationRef.navigate('Wallet');
              }
            }}
            onNavigateToTeam={() => {
              props.navigation.navigate('Team');
            }}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        {/* Step 1: Splash Screen */}
        <Stack.Screen name="Splash">
          {(props) => (
            <SplashScreen
              onContinue={() => props.navigation.replace('Onboarding')}
            />
          )}
        </Stack.Screen>

        {/* Step 2: 3-Slide Onboarding Flow */}
        <Stack.Screen name="Onboarding">
          {(props) => (
            <OnboardingScreen
              onFinish={() => props.navigation.replace('Register')}
            />
          )}
        </Stack.Screen>

        {/* Step 3: Login Screen (Registered user flow) */}
        <Stack.Screen name="Login">
          {(props) => (
            <LoginScreen
              onLoginSubmit={(contact, _isRegistered, devOtp) =>
                props.navigation.navigate('OtpVerification', {
                  contactInfo: contact,
                  isRegistered: true,
                  devOtp,
                })
              }
              onNavigateToRegister={() => props.navigation.navigate('Register')}
              onBack={() => props.navigation.replace('Onboarding')}
            />
          )}
        </Stack.Screen>

        {/* Step 3: Register Screen (New user flow) */}
        <Stack.Screen name="Register">
          {(props) => (
            <RegisterScreen
              onRegisterSubmit={(contact, devOtp) =>
                props.navigation.navigate('OtpVerification', {
                  contactInfo: contact,
                  isRegistered: false,
                  devOtp,
                })
              }
              onNavigateToLogin={() => props.navigation.navigate('Login')}
              onBack={() => props.navigation.replace('Onboarding')}
            />
          )}
        </Stack.Screen>

        {/* Step 4: Verify OTP Screen */}
        <Stack.Screen name="OtpVerification">
          {(props: any) => (
            <OtpVerificationScreen
              contactInfo={props.route.params?.contactInfo || ''}
              isRegistered={props.route.params?.isRegistered ?? false}
              devOtp={props.route.params?.devOtp}
              onVerifySuccess={() =>
                props.navigation.reset({
                  index: 0,
                  routes: [{ name: 'MainTabs' }],
                })
              }
              onBack={() => props.navigation.goBack()}
            />
          )}
        </Stack.Screen>

        {/* Step 5: Main Home & App Tabs */}
        <Stack.Screen name="MainTabs" component={BottomTabs} />

        {/* Dedicated Buy Screen */}
        <Stack.Screen name="Buy">
          {(props) => (
            <BuyScreen
              onBack={() => props.navigation.goBack()}
              onNavigateToOrders={() =>
                props.navigation.navigate('MainTabs', { screen: 'Orders' } as any)
              }
            />
          )}
        </Stack.Screen>

        {/* Dedicated Sell Screen */}
        <Stack.Screen name="Sell">
          {(props) => (
            <SellScreen
              onBack={() => props.navigation.goBack()}
              onNavigateToOrders={() =>
                props.navigation.navigate('MainTabs', { screen: 'Orders' } as any)
              }
            />
          )}
        </Stack.Screen>

        {/* Dedicated UPI Screen */}
        <Stack.Screen name="UPI">
          {(props) => (
            <UpiScreen
              onBack={() => props.navigation.goBack()}
              onNavigateToRequest={() => props.navigation.navigate('Request')}
              onNavigateToOrders={() =>
                props.navigation.navigate('MainTabs', { screen: 'Orders' } as any)
              }
            />
          )}
        </Stack.Screen>

        {/* Dedicated Wallet Screen */}
        <Stack.Screen name="Wallet">
          {(props) => (
            <WalletScreen
              onBack={() => props.navigation.goBack()}
              onNavigateToBuy={() => props.navigation.navigate('Buy')}
              onNavigateToSell={() => props.navigation.navigate('Sell')}
              onNavigateToRequest={() => props.navigation.navigate('Request')}
              onNavigateToOrders={() =>
                props.navigation.navigate('MainTabs', { screen: 'Orders' } as any)
              }
            />
          )}
        </Stack.Screen>

        {/* Dedicated Request Screen */}
        <Stack.Screen name="Request">
          {(props) => (
            <RequestScreen
              onBack={() => props.navigation.goBack()}
              onNavigateToOrders={() =>
                props.navigation.navigate('MainTabs', { screen: 'Orders' } as any)
              }
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
