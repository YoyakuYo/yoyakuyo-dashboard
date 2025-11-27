// lib/prefectures.ts
// Prefecture definitions and utilities for Japan

export interface Prefecture {
  key: string;
  name: string;
  nameJa: string;
  code?: string;
}

// All 47 prefectures of Japan
export const PREFECTURES: Prefecture[] = [
  { key: 'hokkaido', name: 'Hokkaido', nameJa: '北海道', code: '01' },
  { key: 'aomori', name: 'Aomori', nameJa: '青森県', code: '02' },
  { key: 'iwate', name: 'Iwate', nameJa: '岩手県', code: '03' },
  { key: 'miyagi', name: 'Miyagi', nameJa: '宮城県', code: '04' },
  { key: 'akita', name: 'Akita', nameJa: '秋田県', code: '05' },
  { key: 'yamagata', name: 'Yamagata', nameJa: '山形県', code: '06' },
  { key: 'fukushima', name: 'Fukushima', nameJa: '福島県', code: '07' },
  { key: 'ibaraki', name: 'Ibaraki', nameJa: '茨城県', code: '08' },
  { key: 'tochigi', name: 'Tochigi', nameJa: '栃木県', code: '09' },
  { key: 'gunma', name: 'Gunma', nameJa: '群馬県', code: '10' },
  { key: 'saitama', name: 'Saitama', nameJa: '埼玉県', code: '11' },
  { key: 'chiba', name: 'Chiba', nameJa: '千葉県', code: '12' },
  { key: 'tokyo', name: 'Tokyo', nameJa: '東京都', code: '13' },
  { key: 'kanagawa', name: 'Kanagawa', nameJa: '神奈川県', code: '14' },
  { key: 'niigata', name: 'Niigata', nameJa: '新潟県', code: '15' },
  { key: 'toyama', name: 'Toyama', nameJa: '富山県', code: '16' },
  { key: 'ishikawa', name: 'Ishikawa', nameJa: '石川県', code: '17' },
  { key: 'fukui', name: 'Fukui', nameJa: '福井県', code: '18' },
  { key: 'yamanashi', name: 'Yamanashi', nameJa: '山梨県', code: '19' },
  { key: 'nagano', name: 'Nagano', nameJa: '長野県', code: '20' },
  { key: 'gifu', name: 'Gifu', nameJa: '岐阜県', code: '21' },
  { key: 'shizuoka', name: 'Shizuoka', nameJa: '静岡県', code: '22' },
  { key: 'aichi', name: 'Aichi', nameJa: '愛知県', code: '23' },
  { key: 'mie', name: 'Mie', nameJa: '三重県', code: '24' },
  { key: 'shiga', name: 'Shiga', nameJa: '滋賀県', code: '25' },
  { key: 'kyoto', name: 'Kyoto', nameJa: '京都府', code: '26' },
  { key: 'osaka', name: 'Osaka', nameJa: '大阪府', code: '27' },
  { key: 'hyogo', name: 'Hyogo', nameJa: '兵庫県', code: '28' },
  { key: 'nara', name: 'Nara', nameJa: '奈良県', code: '29' },
  { key: 'wakayama', name: 'Wakayama', nameJa: '和歌山県', code: '30' },
  { key: 'tottori', name: 'Tottori', nameJa: '鳥取県', code: '31' },
  { key: 'shimane', name: 'Shimane', nameJa: '島根県', code: '32' },
  { key: 'okayama', name: 'Okayama', nameJa: '岡山県', code: '33' },
  { key: 'hiroshima', name: 'Hiroshima', nameJa: '広島県', code: '34' },
  { key: 'yamaguchi', name: 'Yamaguchi', nameJa: '山口県', code: '35' },
  { key: 'tokushima', name: 'Tokushima', nameJa: '徳島県', code: '36' },
  { key: 'kagawa', name: 'Kagawa', nameJa: '香川県', code: '37' },
  { key: 'ehime', name: 'Ehime', nameJa: '愛媛県', code: '38' },
  { key: 'kochi', name: 'Kochi', nameJa: '高知県', code: '39' },
  { key: 'fukuoka', name: 'Fukuoka', nameJa: '福岡県', code: '40' },
  { key: 'saga', name: 'Saga', nameJa: '佐賀県', code: '41' },
  { key: 'nagasaki', name: 'Nagasaki', nameJa: '長崎県', code: '42' },
  { key: 'kumamoto', name: 'Kumamoto', nameJa: '熊本県', code: '43' },
  { key: 'oita', name: 'Oita', nameJa: '大分県', code: '44' },
  { key: 'miyazaki', name: 'Miyazaki', nameJa: '宮崎県', code: '45' },
  { key: 'kagoshima', name: 'Kagoshima', nameJa: '鹿児島県', code: '46' },
  { key: 'okinawa', name: 'Okinawa', nameJa: '沖縄県', code: '47' },
];

// Get prefecture by key
export function getPrefectureByKey(key: string): Prefecture | undefined {
  return PREFECTURES.find(p => p.key === key);
}

// Get prefecture name in Japanese
export function getPrefectureNameJa(key: string): string {
  const prefecture = getPrefectureByKey(key);
  return prefecture?.nameJa || key;
}

// Get prefecture name in English
export function getPrefectureNameEn(key: string): string {
  const prefecture = getPrefectureByKey(key);
  return prefecture?.name || key;
}

// Get all prefecture keys
export function getAllPrefectureKeys(): string[] {
  return PREFECTURES.map(p => p.key);
}

