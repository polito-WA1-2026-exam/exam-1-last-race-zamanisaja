'use strict';

const LINES = [
  { id: 'L1', name_en: 'Line 1', color_hex: '#E31E24', sort_order: 1 }, // red
  { id: 'L2', name_en: 'Line 2', color_hex: '#233B8E', sort_order: 2 }, // dark blue
  { id: 'L3', name_en: 'Line 3', color_hex: '#00AEEF', sort_order: 3 }, // cyan
  { id: 'L4', name_en: 'Line 4', color_hex: '#F7D000', sort_order: 4 }, // yellow
];

// Helper for quick node creation
const S = (id, name_en, name_fa, x, y) => ({ id, name_en, name_fa, type: 'station', x, y });

/**
 * Coordinates are schematic, not geographic.
 * You will likely tweak x/y for readability after first render.
 */
const NODES = [
  // ---------------- L1 (Tajrish -> Kahrizak) ----------------
  // S('tajrish', 'Tajrish', 'تجریش', 670, 50),
  // S('gheytariyeh', 'Gheytariyeh', 'قیطریه', 670, 90),
  // S('shahid-sadr', 'Shahid Sadr', 'شهید صدر', 670, 120),
  // S('gholhak', 'Gholhak', 'قلهک', 670, 150),
  // S('dr-shariati', 'Doctor Shariati', 'دکتر شریعتی', 670, 180),
  // S('mirdamad', 'Mirdamad', 'میرداماد', 670, 205),
  S('shahid-haghani', 'Shahid Haghani', 'شهید حقانی', 650, 235),
  S('shahid-hemmat', 'Shahid Hemmat', 'شهید همت', 630, 265),
  S('mosalla', 'Mosalla-ye Imam Khomeini', 'مصلی امام خمینی', 630, 290),
  S('shahid-beheshti', 'Shahid Beheshti', 'شهید بهشتی', 630, 325), // intersection (L1/L3)
  S('shahid-mofatteh', 'Shahid Mofatteh', 'شهید مفتح', 630, 355),
  S('shohada-ye-haftom-e-tir', 'Shohada-ye Haftom-e Tir', 'شهدای هفتم تیر', 630, 390),
  S('taleghani', 'Taleghani', 'طالقانی', 630, 425),
  S('darvazeh-dowlat', 'Darvazeh Dowlat', 'دروازه دولت', 630, 460), // intersection (L1/L4)
  S('saadi', "Sa'di", 'سعدی', 630, 500),
  S('imam-khomeini', 'Imam Khomeini', 'امام خمینی', 630, 545), // intersection (L1/L2)
  S('panzdah-khordad', 'Panzdah-e Khordad', 'پانزده خرداد', 630, 580),
  S('khayyam', 'Khayyam', 'خیام', 630, 605),
  // S('meydan-e-mohammadiyeh', 'Meydan-e Mohammadiyeh', 'میدان محمدیه', 630, 640),
  // S('shoush', 'Shoush', 'شوش', 630, 670),
  // S('payane-jonoub', 'Payane Jonoob', 'پایانه جنوب', 630, 700),
  // S('shahr-e-rey', 'Shahr-e Rey', 'شهرری', 630, 820),
  // S('haram-e-motahhar', 'Haram-e Motahhar-e Emam Khomeini', 'حرم مطهر امام خمینی', 630, 910),
  // S('kahrizak', 'Kahrizak', 'کهریزک', 630, 945),

  // ---------------- L2 (Farhangsara -> Sadeghiyeh) ----------------
  // S('farhangsara', 'Farhangsara', 'فرهنگسرا', 950, 300),
  // S('tehranpars', 'Tehranpars', 'تهرانپارس', 920, 300),
  // S('shahid-bagheri', 'Shahid Bagheri', 'شهید باقری', 890, 300),
  // S('elm-o-sanat', 'Daneshgah-e Elm-o-Sanat', 'دانشگاه علم و صنعت', 860, 300),
  // S('janbazan', 'Janbazan', 'جانبازان', 810, 300),
  // S('fadaak', 'Fadak', 'فدک', 795, 325),
  // S('sabalan', 'Sabalan', 'سبلان', 780, 350),
  S('shahid-madani', 'Shahid Madani', 'شهید مدنی', 765, 375),
  S('emam-hossein', 'Emam Hossein', 'امام حسین', 750, 400),
  S('darvazeh-shemiran', 'Darvazeh Shemiran', 'دروازه شمیران', 695, 460), // intersection (L2/L4)
  S('baharestan', 'Baharestan', 'بهارستان', 680, 485),
  S('mellat', 'Mellat', 'ملت', 660, 510),
  // imam-khomeini is already defined above (intersection)
  S('hassan-abad', 'Hassan Abad', 'حسن‌آباد', 595, 545),
  S('meydan-e-horr', 'Meydan-e Horr', 'میدان حر', 545, 545),
  S('shademan', 'Shademan', 'شادمان', 460, 460), // intersection (L2/L4)
  S('sharif-university', 'Sharif University', 'دانشگاه شریف', 425, 425),
  S('tarasht', 'Tarasht', 'طرشت', 400, 400),
  S('sadeghiyeh', 'Sadeghiyeh', 'صادقیه', 375, 375),

  // ---------------- L3 (Qaem -> Azadegan) ----------------
  // S('ghaem', "Gha'em", 'قائم', 950, 120),
  // S('shahid-mahallati', 'Shahid Mahallati', 'شهید محلاتی', 915, 120),
  // S('aghdasieh', 'Aghdasieh', 'اقدسیه', 880, 120),
  // S('nobonyad', 'Nobonyad', 'نوبنیاد', 850, 120),
  // S('hossein-abad', 'Hossein Abad', 'حسین‌آباد', 820, 120),
  // S('meydan-e-heravi', 'Meydan-e Heravi', 'میدان هروی', 800, 160),
  // S('shahid-zeynoddin', 'Shahid Zeynoddin', 'شهید زین‌الدین', 780, 200),
  // S('khajeh-abdollah-ansari', 'Khajeh Abdollah Ansari', 'خواجه عبدالله انصاری', 755, 225),
  S('shahid-sayyad-shirazi', 'Shahid Sayyad-e Shirazi', 'شهید صیاد شیرازی', 725, 260),
  S('shahid-ghoddoosi', 'Shahid Ghoddoosi', 'شهید قدوسی', 700, 295),
  S('sohrevardi', 'Sohrevardi', 'سهروردی', 675, 325),
  // shahid-beheshti is already defined above (intersection)
  S('mirza-ye-shirazi', 'Mirza-ye Shirazi', 'میرزا شیرازی', 600, 325),
  S('meydan-e-jahad', 'Meydan-e Jahad', 'میدان جهاد', 575, 355),
  S('vali-asr', 'Meydan-e Vali Asr', 'میدان حضرت ولی‌عصر', 550, 390),
  S('teatr-e-shahr', 'Theatre Shahr', 'تئاتر شهر', 550, 460), // intersection (L3/L4)
  S('moniriyeh', 'Moniriyeh', 'منیریه', 550, 600),
  S('mahdiyeh', 'Mahdiyeh', 'مهدیه', 550, 640),
  S('rahahan', 'Rahahan (Central Railway Station)', 'راه‌آهن', 550, 680),
  // S('azadegan', 'Azadegan', 'آزادگان', 520, 850),

  // ---------------- L4 (Kolahdouz -> Mehrabad) ----------------
  // S('shahid-kolahdouz', 'Shahid Kolahdouz', 'شهید کلاهدوز', 950, 520),
  // S('nirou-havaei', 'Nirou Havaei', 'نیروی هوایی', 905, 520),
  // S('nabard', 'Nabard', 'نبرد', 855, 520),
  S('pirouzi', 'Pirouzi', 'پیروزی', 815, 520),
  S('meydan-shohada', 'Meydan-e Shohada', 'میدان شهدا', 740, 520),
  // darvazeh-shemiran is already defined above (intersection)
  // darvazeh-dowlat is already defined above (intersection)
  S('ferdowsi', 'Ferdowsi', 'فردوسی', 590, 460),
  // teatr-e-shahr is already defined above (intersection)
  S('meydan-e-enghelab', 'Meydan-e Enghelab', 'میدان انقلاب', 520, 460),
  S('towhid', 'Towhid', 'توحید', 485, 460),
  // shademan is already defined above (intersection)
  S('dr-habibollah', 'Dr. Habibollah', 'دکتر حبیب‌الله', 420, 460),
  S('ostad-moein', 'Ostad Moein', 'استاد معین', 385, 460),
  S('azadi-square', 'Azadi Square', 'میدان آزادی', 350, 460),
  S('bimeh', 'Bimeh', 'بیمه', 325, 460),
  S('mehrabad-t1-2', 'Mehrabad Airport Terminal 1&2', 'پایانه ۱ و ۲ فرودگاه مهرآباد', 325, 500),
  // S('mehrabad-t4-6', 'Mehrabad Airport Terminal 4&6', 'پایانه ۴ و ۶ فرودگاه مهرآباد', 325, 550),
];


const E = (a, b, line_id, sort_order) => ({ from_node_id: a, to_node_id: b, line_id, sort_order });

const EDGES = [
  // ---------------- L1 ----------------
  // E('tajrish', 'gheytariyeh', 'L1', 10),
  // E('gheytariyeh', 'shahid-sadr', 'L1', 20),
  // E('shahid-sadr', 'gholhak', 'L1', 30),
  // E('gholhak', 'dr-shariati', 'L1', 40),
  // E('dr-shariati', 'mirdamad', 'L1', 50),
  // E('mirdamad', 'shahid-haghani', 'L1', 60),
  E('shahid-haghani', 'shahid-hemmat', 'L1', 70),
  E('shahid-hemmat', 'mosalla', 'L1', 80),
  E('mosalla', 'shahid-beheshti', 'L1', 90),
  E('shahid-beheshti', 'shahid-mofatteh', 'L1', 100),
  E('shahid-mofatteh', 'shohada-ye-haftom-e-tir', 'L1', 110),
  E('shohada-ye-haftom-e-tir', 'taleghani', 'L1', 120),
  E('taleghani', 'darvazeh-dowlat', 'L1', 130),
  E('darvazeh-dowlat', 'saadi', 'L1', 140),
  E('saadi', 'imam-khomeini', 'L1', 150),
  E('imam-khomeini', 'panzdah-khordad', 'L1', 160),
  E('panzdah-khordad', 'khayyam', 'L1', 170),
  // E('khayyam', 'meydan-e-mohammadiyeh', 'L1', 180),
  // E('meydan-e-mohammadiyeh', 'shoush', 'L1', 190),
  // E('shoush', 'payane-jonoub', 'L1', 200),
  // E('payane-jonoub', 'shahr-e-rey', 'L1', 210),
  // E('shahr-e-rey', 'haram-e-motahhar', 'L1', 220),
  // E('haram-e-motahhar', 'kahrizak', 'L1', 230),

  // ---------------- L2 ----------------
  // E('farhangsara', 'tehranpars', 'L2', 10),
  // E('tehranpars', 'shahid-bagheri', 'L2', 20),
  // E('shahid-bagheri', 'elm-o-sanat', 'L2', 30),
  // E('elm-o-sanat', 'janbazan', 'L2', 40),
  // E('janbazan', 'fadaak', 'L2', 50),
  // E('fadaak', 'sabalan', 'L2', 60),
  // E('sabalan', 'shahid-madani', 'L2', 70),
  E('shahid-madani', 'emam-hossein', 'L2', 80),
  E('emam-hossein', 'darvazeh-shemiran', 'L2', 90),
  E('darvazeh-shemiran', 'baharestan', 'L2', 100),
  E('baharestan', 'mellat', 'L2', 110),
  E('mellat', 'imam-khomeini', 'L2', 120),
  E('imam-khomeini', 'hassan-abad', 'L2', 130), // intersection
  E('hassan-abad', 'meydan-e-horr', 'L2', 140),
  E('meydan-e-horr', 'shademan', 'L2', 150),     // intersection
  E('shademan', 'sharif-university', 'L2', 160),
  E('sharif-university', 'tarasht', 'L2', 170),
  E('tarasht', 'sadeghiyeh', 'L2', 180),

  // ---------------- L3 ----------------
  // E('ghaem', 'shahid-mahallati', 'L3', 10),
  // E('shahid-mahallati', 'aghdasieh', 'L3', 20),
  // E('aghdasieh', 'nobonyad', 'L3', 30),
  // E('nobonyad', 'hossein-abad', 'L3', 40),
  // E('hossein-abad', 'meydan-e-heravi', 'L3', 50),
  // E('meydan-e-heravi', 'shahid-zeynoddin', 'L3', 60),
  // E('shahid-zeynoddin', 'khajeh-abdollah-ansari', 'L3', 70),
  // E('khajeh-abdollah-ansari', 'shahid-sayyad-shirazi', 'L3', 80),
  E('shahid-sayyad-shirazi', 'shahid-ghoddoosi', 'L3', 90),
  E('shahid-ghoddoosi', 'sohrevardi', 'L3', 100),
  E('sohrevardi', 'shahid-beheshti', 'L3', 110), // intersection
  E('shahid-beheshti', 'mirza-ye-shirazi', 'L3', 120),
  E('mirza-ye-shirazi', 'meydan-e-jahad', 'L3', 130),
  E('meydan-e-jahad', 'vali-asr', 'L3', 140),
  E('vali-asr', 'teatr-e-shahr', 'L3', 150),     // intersection
  E('teatr-e-shahr', 'moniriyeh', 'L3', 160),
  E('moniriyeh', 'mahdiyeh', 'L3', 170),
  E('mahdiyeh', 'rahahan', 'L3', 180),
  // E('rahahan', 'azadegan', 'L3', 190),

  // ---------------- L4 (Kolahdouz -> Mehrabad) ----------------
  // E('shahid-kolahdouz', 'nirou-havaei', 'L4', 10),
  // E('nirou-havaei', 'nabard', 'L4', 20),
  // E('nabard', 'pirouzi', 'L4', 30),
  E('pirouzi', 'meydan-shohada', 'L4', 40),
  E('meydan-shohada', 'darvazeh-shemiran', 'L4', 50),     // intersection
  E('darvazeh-shemiran', 'darvazeh-dowlat', 'L4', 60), // intersection
  E('darvazeh-dowlat', 'ferdowsi', 'L4', 70),
  E('ferdowsi', 'teatr-e-shahr', 'L4', 80),        // intersection
  E('teatr-e-shahr', 'meydan-e-enghelab', 'L4', 90), // intersection
  E('meydan-e-enghelab', 'towhid', 'L4', 100),
  E('towhid', 'shademan', 'L4', 110),              // intersection
  E('shademan', 'dr-habibollah', 'L4', 120),
  E('dr-habibollah', 'ostad-moein', 'L4', 130),
  E('ostad-moein', 'azadi-square', 'L4', 140),
  E('azadi-square', 'bimeh', 'L4', 150),
  E('bimeh', 'mehrabad-t1-2', 'L4', 160),
  // E('mehrabad-t1-2', 'mehrabad-t4-6', 'L4', 170),
];


module.exports = { LINES, NODES, EDGES };
