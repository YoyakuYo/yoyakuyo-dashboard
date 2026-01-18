// lib/regions.ts
// Region definitions and prefecture-to-region mapping for Japan

import { PREFECTURES, type Prefecture } from './prefectures';

export interface Region {
  key: string;
  name: string;
  nameJa: string;
  prefectures: string[]; // Array of prefecture keys
}

// 8 regions of Japan
export const REGIONS: Region[] = [
  {
    key: 'hokkaido',
    name: 'Hokkaido',
    nameJa: '北海道',
    prefectures: ['hokkaido'],
  },
  {
    key: 'tohoku',
    name: 'Tohoku',
    nameJa: '東北',
    prefectures: ['aomori', 'iwate', 'miyagi', 'akita', 'yamagata', 'fukushima'],
  },
  {
    key: 'kanto',
    name: 'Kanto',
    nameJa: '関東',
    prefectures: ['ibaraki', 'tochigi', 'gunma', 'saitama', 'chiba', 'tokyo', 'kanagawa'],
  },
  {
    key: 'chubu',
    name: 'Chubu',
    nameJa: '中部',
    prefectures: ['niigata', 'toyama', 'ishikawa', 'fukui', 'yamanashi', 'nagano', 'gifu', 'shizuoka', 'aichi'],
  },
  {
    key: 'kansai',
    name: 'Kansai (Kinki)',
    nameJa: '関西（近畿）',
    prefectures: ['mie', 'shiga', 'kyoto', 'osaka', 'hyogo', 'nara', 'wakayama'],
  },
  {
    key: 'chugoku',
    name: 'Chugoku',
    nameJa: '中国',
    prefectures: ['tottori', 'shimane', 'okayama', 'hiroshima', 'yamaguchi'],
  },
  {
    key: 'shikoku',
    name: 'Shikoku',
    nameJa: '四国',
    prefectures: ['tokushima', 'kagawa', 'ehime', 'kochi'],
  },
  {
    key: 'kyushu_okinawa',
    name: 'Kyushu–Okinawa',
    nameJa: '九州・沖縄',
    prefectures: ['fukuoka', 'saga', 'nagasaki', 'kumamoto', 'oita', 'miyazaki', 'kagoshima', 'okinawa'],
  },
];

// Get region by key
export function getRegionByKey(key: string): Region | undefined {
  return REGIONS.find(r => r.key === key);
}

// Get region for a prefecture
export function getRegionForPrefecture(prefectureKey: string): Region | undefined {
  return REGIONS.find(r => r.prefectures.includes(prefectureKey));
}

// Get all prefectures in a region
export function getPrefecturesInRegion(regionKey: string): Prefecture[] {
  const region = getRegionByKey(regionKey);
  if (!region) return [];
  
  return PREFECTURES.filter(p => region.prefectures.includes(p.key));
}

// Get all region keys
export function getAllRegionKeys(): string[] {
  return REGIONS.map(r => r.key);
}

