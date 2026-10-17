import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  SendCoin: { tokenSymbol?: string };
  ReceiveCoin: { tokenSymbol?: string; address?: string };
  TransactionDetails: { txId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Wallet: undefined;
  Swap: undefined;
  Profile: undefined;
};
