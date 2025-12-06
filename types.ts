export interface Diagnosis {
  nama: string;
  namaLatin: string;
  isHama: boolean;
  gejala: string[];
  solusi: string[];
  pencegahan: string[];
  tingkatBahaya: 'Rendah' | 'Sedang' | 'Tinggi';
}

export interface PestReport {
  id: string;
  timestamp: number;
  latitude: number;
  longitude: number;
  imageUrl: string;
  diagnosis: Diagnosis;
}

export type AppView = 'home' | 'scan' | 'map' | 'history';
