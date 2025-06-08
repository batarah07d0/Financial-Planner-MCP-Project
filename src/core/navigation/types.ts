import { NavigatorScreenParams } from '@react-navigation/native';

// Tipe untuk navigasi tab
export type TabParamList = {
  Dashboard: undefined;
  Transactions: {
    categoryId?: string;
    type?: 'income' | 'expense';
    budgetId?: string;
  } | undefined;
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
    type?: 'income' | 'expense';
    categoryId?: string;
    budgetId?: string;
    scannedData?: {
      amount?: number;
      date?: Date;
      description?: string;
      receiptImageUri?: string;
    };
    barcodeData?: {
      productName: string;
      amount: number;
      category: string;
      barcode: string;
    };
  };
  EditTransaction: { id: string };
  TransactionDetail: { id: string };
  AddBudget: {
    selectedCategoryFromPicker?: string;
  };
  EditBudget: { id: string };
  BudgetDetail: { id: string };
  CategoryPicker: {
    selectedCategoryId?: string;
  };
  AddProduct: {
    barcode?: string;
  };
  BarcodeScanner: {
    returnTo?: 'Transactions' | 'BarcodeScanHistory';
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
