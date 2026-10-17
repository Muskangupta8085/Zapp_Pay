import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  OtpVerification: { contactInfo: string; isRegistered?: boolean };
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Buy: undefined;
  Sell: undefined;
  UPI: undefined;
  Wallet: undefined;
  Request: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Orders: undefined;
  Team: undefined;
  Rewards: undefined;
  Profile: undefined;
};
