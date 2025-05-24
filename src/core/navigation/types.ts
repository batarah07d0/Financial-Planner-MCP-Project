import { NavigatorScreenParams } from '@react-navigation/native';

// Tipe untuk navigasi tab
export type TabParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  Budget: undefined;
  Analytics: undefined;
  More: undefined;
};

// Tipe untuk navigasi autentikasi
export type AuthStackParamList = {
  Login: {
    email?: string;
    password?: string;
  } | undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Tipe untuk navigasi transaksi
export type TransactionStackParamList = {
  TransactionsList: undefined;
  AddTransaction: undefined;
  EditTransaction: { id: string };
  TransactionDetail: { id: string };
};

// Tipe untuk navigasi budget
export type BudgetStackParamList = {
  BudgetList: undefined;
  AddBudget: undefined;
  EditBudget: { id: string };
  BudgetDetail: { id: string };
};

// Tipe untuk navigasi utama
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<TabParamList>;
  Onboarding: undefined;
  AddTransaction: {
    scannedData?: {
      amount?: number;
      date?: Date;
      description?: string;
      receiptImageUri?: string;
    };
  };
  EditTransaction: { id: string };
  TransactionDetail: { id: string };
  AddBudget: undefined;
  EditBudget: { id: string };
  BudgetDetail: { id: string };
  AddProduct: {
    barcode?: string;
  };
  BarcodeScanner: {
    onScanComplete?: (data: {
      productName: string;
      amount: number;
      category: string;
      barcode: string;
    }) => void;
  };
  BarcodeScanHistory: undefined;
  ReceiptScanner: undefined;
  ExpenseMap: undefined;
  SecuritySettings: undefined;
  BackupRestore: undefined;
  CameraTest: undefined;
  CameraTestSimple: undefined;
  Settings: undefined;
  Challenges: undefined;
  AddChallenge: undefined;
  ChallengeDetail: { id: string };
  SavingGoals: undefined;
  AddSavingGoal: undefined;
  EditSavingGoal: { goalId: string };
  SavingGoalDetail: { goalId: string };
  AccountInfo: undefined;
  ChangePassword: undefined;
  AboutApp: undefined;
  PrivacyPolicy: undefined;
  TermsConditions: undefined;
};
