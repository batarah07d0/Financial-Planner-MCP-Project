export interface SavingZone {
  id: string;
  name: string;
  description?: string;
  radius: number; // dalam meter
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  type: 'high_expense' | 'saving_opportunity';
  notificationEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavingZoneInput {
  name: string;
  description?: string;
  radius: number;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  type: 'high_expense' | 'saving_opportunity';
  notificationEnabled: boolean;
}
