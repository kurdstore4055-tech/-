
export type RegistrationSource = 'web' | 'mobile_app' | 'admin_entry';

export interface Voter {
  id: string;
  fullName: string;
  phone: string;
  district: District;
  subClan: string; // The specific branch of the tribe (e.g., Abde, Aslam, etc.)
  notes?: string;
  registeredAt: string;
  voterCardImage?: string; // Base64 string of the Front
  voterCardBackImage?: string; // Base64 string of the Back
  frontImageUrl?: string; // Cloud URL (Google Drive) for Front
  backImageUrl?: string; // Cloud URL (Google Drive) for Back
  voterIdNumber?: string; // رقم الناخب (8 digits typically)
  familyIdNumber?: string; // رقم العائلة
  birthYear?: string; // المواليد
  source: RegistrationSource;
}

export interface Candidate {
  id: string;
  name: string;
  title: string; // e.g. Sheikh, Dr.
  votes: number;
}

// Salah al-Din Districts and Administrative Units
export enum District {
  Tikrit = 'تكريت',
  Samarra = 'سامراء',
  Baiji = 'بيجي',
  Balad = 'بلد',
  AlDour = 'الدور',
  TuzKhurmatu = 'طوز خورماتو',
  AlShirqat = 'الشرقاط',
  AlAlam = 'العلم',
  AlDhuluiya = 'الضلوعية',
  AlIshaqi = 'الإسحاقي',
  Amerli = 'آمرلي',
  Yathrib = 'يثرب',
  SuleimanBeg = 'سليمان بيك',
  AlSiniyah = 'الصينية',
  AlMutasim = 'المعتصم',
  Dijlah = 'ناحية دجلة',
  Other = 'أخرى'
}

export interface DashboardStats {
  totalVoters: number;
  byDistrict: { name: string; count: number }[];
  byClan: { name: string; count: number }[];
}
