// The Thai word bank. Line format: hebrew|thai|transliteration. The Thai text drives the audio and is not shown.
// Transliteration: a mark on the first vowel of a syllable shows its tone, à low, â falling, á high, ǎ rising, no mark mid.
// A doubled vowel is long. ae = แ, aw = อ, oe = เอิ, ue = อื. Speech is written for a male speaker (ผม, ครับ).
export const THAI_LEVELS = [
  { name: 'פותחים שיחה', cefr: '', blurb: 'ברכות, היכרות ופרידה' },
  { name: 'מבקשים ועונים', cefr: '', blurb: 'בקשות ותשובות יומיומיות' },
  { name: 'בונים משפטים', cefr: '', blurb: 'יש, אין, יותר ופחות' },
  { name: 'מספרים וכמויות', cefr: '', blurb: 'מספרים, מונים וקנייה' },
  { name: 'במסעדה ובבית קפה', cefr: '', blurb: 'הזמנה, טעמים ותשלום' },
  { name: 'כינויי גוף ותיאור דברים', cefr: '', blurb: 'גודל, צבעים והשוואות' },
  { name: 'בשוק ובחנות', cefr: '', blurb: 'מוצרים, מחירים ובחירה' },
  { name: 'כשלא מבינים', cefr: '', blurb: 'מתמודדים עם השפה' },
  { name: 'להגיע ממקום למקום', cefr: '', blurb: 'דרך, מרחק ונסיעה' },
  { name: 'אנשים ושיחת חולין', cefr: '', blurb: 'משפחה ושיחת יום־יום' },
  { name: 'תגובות טבעיות', cefr: '', blurb: 'דעות, תשובות ועידוד' },
  { name: 'זמן וקובעים תוכניות', cefr: '', blurb: 'זמן, ימי השבוע ופגישות' },
  { name: 'שירותים ובית', cefr: '', blurb: 'חדרים, תקלות ותקשורת' },
  { name: 'בריאות ובטיחות', cefr: '', blurb: 'עזרה, כאב ותרופות' },
  { name: 'תחביבים וחיים בקראבי', cefr: '', blurb: 'ספורט, מוזיקה ופנאי' },
];

const RAW: string[] = [
`שלום|สวัสดีครับ|sà-wàt-dii khráp
תודה|ขอบคุณครับ|khàwp-khun khráp
בשמחה / על לא דבר|ยินดีครับ|yin-dii khráp
סליחה / מצטער|ขอโทษครับ|khǎw-thôht khráp
לא נורא / אין בעיה|ไม่เป็นไร|mâi pen rai
אני לא מבין|ผมไม่เข้าใจ|phǒm mâi khâo-jai
מה נשמע?|สบายดีไหม|sà-baai dii mǎi
הכול טוב|สบายดี|sà-baai dii
איך קוראים לך?|คุณชื่ออะไร|khun chûe à-rai
קוראים לי…|ผมชื่อ|phǒm chûe…
קוראים לי גיא|ผมชื่อกาย|phǒm chûe kaai
נעים להכיר|ยินดีที่ได้รู้จัก|yin-dii thîi dâai rúu-jàk
נתראה|แล้วเจอกัน|láeo joe kan`,
`אפשר לקבל / אבקש|ขอ|khǎw
אקח את זה|เอาอันนี้|ao an-níi
אבקש את זה|ขออันนี้|khǎw an-níi
לא אקח / לא, תודה|ไม่เอา|mâi ao
טוב|ดี|dii
לא כל כך טוב|ไม่ค่อยดี|mâi khâwy dii
קצת|นิดหน่อย|nít-nàwy
מתאים בדיוק|พอดี|phaw-dii
הרבה / מאוד|มาก|mâak
כן|ใช่|châi
לא / זה לא נכון|ไม่ใช่|mâi châi
אפשר עזרה?|ช่วยหน่อยได้ไหม|chûay nàwy dâai mǎi
רגע אחד|รอสักครู่|raw sàk-khrûu`,
`יותר מ־|มากกว่า|mâak kwàa
פחות מ־|น้อยกว่า|náwy kwàa
עם (מישהו)|กับ|kàp
ו־ / וגם|และ|láe
או|หรือ|rǔe
להוסיף / לשים|ใส่|sài
בלי להוסיף|ไม่ใส่|mâi sài
עוד / שוב|อีก|ìik
יש / יש לי|มี|mii
אין / אין לי|ไม่มี|mâi mii
לא|ไม่|mâi
האם?|ไหม|mǎi
עומד ל־ / אעשה|จะ|jà
כבר / הסתיים|แล้ว|láeo
לתת / בשביל|ให้|hâi
אם|ถ้า|thâa`,
`אחד|หนึ่ง|nùeng
שניים|สอง|sǎwng
שלושה|สาม|sǎam
ארבעה|สี่|sìi
חמישה|ห้า|hâa
שישה|หก|hòk
שבעה|เจ็ด|jèt
שמונה|แปด|pàet
תשעה|เก้า|kâo
עשרה|สิบ|sìp
עשרים|ยี่สิบ|yîi-sìp
שלושים|สามสิบ|sǎam-sìp
ארבעים|สี่สิบ|sìi-sìp
חמישים|ห้าสิบ|hâa-sìp
שבעים|เจ็ดสิบ|jèt-sìp
מאה|ร้อย|ráwy
אלף|พัน|phan
חצי|ครึ่ง|khrûeng
מונה אנשים|คน|khon
מונה חפצים|อัน|an
כוס / מונה כוסות|แก้ว|kâew
בקבוק אחד|หนึ่งขวด|nùeng khùat
כמה אנשים?|กี่คน|kìi khon
באט|บาท|bàat
כמה?|เท่าไหร่|thâo-rài
עוד אחד|อีกอัน|ìik an
אקח שלושה כאלה|เอาแบบนี้สามอัน|ao bàep-níi sǎam an`,
`אפשר תפריט בבקשה|ขอเมนูหน่อย|khǎw mee-nuu nàwy
אני רוצה להזמין אוכל|ผมอยากสั่งอาหาร|phǒm yàak sàng aa-hǎan
מים בבקשה|ขอน้ำหน่อย|khǎw náam nàwy
קפה|กาแฟ|kaa-fae
תה|ชา|chaa
אורז|ข้าว|khâao
קרח בבקשה|ขอน้ำแข็งหน่อย|khǎw náam-khǎeng nàwy
רוצה לשתות|อยากดื่ม|yàak dùem
מה אתה ממליץ?|แนะนำอะไรดี|náe-nam à-rai dii
מה זה?|นี่คืออะไร|nîi khue à-rai
מעט חריף|เผ็ดนิดหน่อย|phèt nít-nàwy
לא חריף|ไม่เผ็ด|mâi phèt
מלוח|เค็ม|khem
חמוץ|เปรี้ยว|prîao
אפשר פחות מתוק?|หวานน้อยได้ไหม|wǎan náwy dâai mǎi
טעים|อร่อย|à-ràwy
אני שבע|อิ่มแล้ว|ìm láeo
לאכול כאן|กินที่นี่|kin thîi-nîi
לארוז לקחת|ห่อกลับบ้าน|hàw klàp bâan
אפשר חשבון?|เช็คบิลได้ไหม|chék-bin dâai mǎi`,
`אני (לגבר)|ผม|phǒm
את / אתה|คุณ|khun
הוא / היא|เขา|khǎo
אנחנו|เรา|rao
אתם / אתן|พวกคุณ|phûak-khun
הם / הן|พวกเขา|phûak-khǎo
גדול|ใหญ่|yài
קטן|เล็ก|lék
חדש|ใหม่|mài
ישן (חפץ)|เก่า|kào
יפה|สวย|sǔay
צבע|สี|sǐi
אדום|สีแดง|sǐi daeng
כחול (גוון עמוק)|สีน้ำเงิน|sǐi nám-ngoen
כחול בהיר / תכלת|สีฟ้า|sǐi fáa
ירוק|สีเขียว|sǐi khǐao
לבן|สีขาว|sǐi khǎao
שחור|สีดำ|sǐi dam
טוב יותר|ดีกว่า|dii kwàa
אותו דבר|เหมือนกัน|mǔean-kan
שונה|ต่างกัน|tàang-kan
זה טוב יותר מזה|อันนี้ดีกว่าอันนั้น|an-níi dii kwàa an-nán`,
`פירות|ผลไม้|phǒn-lá-máai
בננה|กล้วย|klûay
מנגו|มะม่วง|má-mûang
ירקות|ผัก|phàk
דג|ปลา|plaa
שרימפס|กุ้ง|kûng
כמה באט?|กี่บาท|kìi bàat
כמה הכול ביחד?|ทั้งหมดเท่าไหร่|tháng-mòt thâo-rài
יקר|แพง|phaeng
זול|ถูก|thùuk
יקר מדי|แพงเกินไป|phaeng koen pai
אפשר הנחה?|ลดได้ไหม|lót dâai mǎi
אפשר לנסות?|ลองได้ไหม|lawng dâai mǎi
רוצה לנסות|อยากลอง|yàak lawng
יש מידה גדולה?|มีไซส์ใหญ่ไหม|mii sai yài mǎi
יש צבע אחר?|มีสีอื่นไหม|mii sǐi ùen mǎi
מקבלים כרטיס אשראי?|รับบัตรเครดิตไหม|ráp bàt khree-dìt mǎi
לשים בשקית|ใส่ถุง|sài thǔng
לא אקנה|ไม่ซื้อ|mâi súe
רק מסתכל|ดูเฉยๆ|duu chǒei-chǒei`,
`אני מדבר קצת תאית|ผมพูดไทยได้นิดหน่อย|phǒm phûut thai dâai nít-nàwy
אני לא מדבר תאית|ผมพูดไทยไม่ได้|phǒm phûut thai mâi dâai
אני לומד תאית|ผมเรียนภาษาไทย|phǒm rian phaa-sǎa thai
אפשר לדבר לאט?|พูดช้าๆ ได้ไหม|phûut cháa-cháa dâai mǎi
אפשר לומר שוב?|พูดอีกทีได้ไหม|phûut ìik thii dâai mǎi
מה זה אומר?|แปลว่าอะไร|plae wâa à-rai
הבנתי עכשיו|เข้าใจแล้ว|khâo-jai láeo
אפשר לעזור לי?|ช่วยผมหน่อยได้ไหม|chûay phǒm nàwy dâai mǎi
אפשר לכתוב לי את זה?|เขียนให้หน่อยได้ไหม|khǐan hâi nàwy dâai mǎi
אפשר לשאול?|ขอถามหน่อย|khǎw thǎam nàwy
אני לא יודע|ผมไม่รู้|phǒm mâi rúu
תודה על העזרה|ขอบคุณที่ช่วย|khàwp-khun thîi chûay`,
`איפה?|ที่ไหน|thîi-nǎi
שירותים|ห้องน้ำ|hâwng-náam
שמאלה|ซ้าย|sáai
ימינה|ขวา|khwǎa
ישר|ตรงไป|trong pai
קרוב|ใกล้|klâi
זה רחוק?|ไกลไหม|klai mǎi
זה לוקח הרבה זמן?|ใช้เวลานานไหม|chái wee-laa naan mǎi
אפשר להגיע למלון הזה?|ไปโรงแรมนี้ได้ไหม|pai rong-raem níi dâai mǎi
לעצור כאן|จอดตรงนี้|jàwt trong-níi
שוק|ตลาด|tà-làat
מסעדה|ร้านอาหาร|ráan aa-hǎan
אופנוע|มอเตอร์ไซค์|maw-toe-sai
סירה|เรือ|ruea
הלכתי לאיבוד|ผมหลงทาง|phǒm lǒng thaang`,
`משפחה|ครอบครัว|khrâwp-khrua
אמא|แม่|mâe
אבא|พ่อ|phâw
אשתי / אישה|ภรรยา|phan-rá-yaa
ילד / ילדים|เด็ก|dèk
חבר|เพื่อน|phûean
שכן|เพื่อนบ้าน|phûean-bâan
נחמד / טוב לב|ใจดี|jai-dii
חמוד|น่ารัก|nâa-rák
לבשל|ทำอาหาร|tham aa-hǎan
לאכול ארוחה|กินข้าว|kin khâao
רעב|หิว|hǐu
צמא|หิวน้ำ|hǐu náam
עייף|เหนื่อย|nùeay
לא מרגיש טוב|ไม่สบาย|mâi sà-baai
מרגיש יותר טוב|รู้สึกดีขึ้น|rúu-sùek dii khûen`,
`באמת?|จริงเหรอ|jing rǒe
באמת / בעצם|จริงๆ|jing-jing
מעניין|น่าสนใจ|nâa-sǒn-jai
מסכים|เห็นด้วย|hěn dûay
לא מסכים|ไม่เห็นด้วย|mâi hěn dûay
אני חושב ש…|ผมคิดว่า|phǒm khít wâa…
אני חושב שכן|ผมคิดว่าใช่|phǒm khít wâa châi
אתה בטוח?|แน่ใจไหม|nâe-jai mǎi
אפשר / בטח|ได้สิ|dâai sì
אחשוב על זה|ขอคิดดูก่อน|khǎw khít duu kàwn
לא רוצה / לא מתחשק לי|ไม่อยาก|mâi yàak
מצטער על זה|ขอโทษด้วยครับ|khǎw-thôht dûay khráp
קדימה, אתה יכול!|สู้ๆ|sûu-sûu`,
`היום|วันนี้|wan-níi
מחר|พรุ่งนี้|phrûng-níi
אתמול|เมื่อวาน|mûea-waan
בוקר|ตอนเช้า|tawn cháao
אחר הצהריים|ตอนบ่าย|tawn bàai
ערב|ตอนเย็น|tawn yen
באיזו שעה?|กี่โมง|kìi moong
אתה פנוי?|คุณว่างไหม|khun wâang mǎi
יום שני|วันจันทร์|wan jan
יום שלישי|วันอังคาร|wan ang-khaan
יום רביעי|วันพุธ|wan phút
יום חמישי|วันพฤหัส|wan phá-rúe-hàt
יום שישי|วันศุกร์|wan sùk
יום שבת|วันเสาร์|wan sǎo
יום ראשון|วันอาทิตย์|wan aa-thít
לא פנוי|ไม่ว่าง|mâi wâang
איזו שעה נוחה?|สะดวกกี่โมง|sà-dùak kìi moong
איפה ניפגש?|เจอกันที่ไหน|joe kan thîi-nǎi
אפשר לדחות את הפגישה?|เลื่อนนัดได้ไหม|lûean nát dâai mǎi
בטח|แน่นอน|nâe-nawn
אולי|อาจจะ|àat-jà
סגור / מוסכם|ตกลง|tòk-long
אני לא בטוח|ไม่แน่ใจ|mâi nâe-jai`,
`יש חדר פנוי?|มีห้องว่างไหม|mii hâwng wâang mǎi
אפשר לראות קודם את החדר?|ขอดูห้องก่อนได้ไหม|khǎw duu hâwng kàwn dâai mǎi
כמה שכר הדירה לחודש?|ค่าเช่าเดือนละเท่าไหร่|khâa châo duean lá thâo-rài
מים וחשמל|ค่าน้ำค่าไฟ|khâa náam khâa fai
המזגן מקולקל|แอร์เสีย|ae sǐa
זה לא עובד|ใช้ไม่ได้|chái mâi dâai
אפשר לתקן את זה?|ซ่อมได้ไหม|sâwm dâai mǎi
אפשר עוד מגבת?|ขอผ้าเช็ดตัวอีกผืน|khǎw phâa-chét-tua ìik phǔen
אפשר את סיסמת ה־Wi-Fi?|ขอรหัสไวไฟหน่อย|khǎw rá-hàt wai-fai nàwy
אין קליטה|ไม่มีสัญญาณ|mâi mii sǎn-yaan
האינטרנט איטי|เน็ตช้า|nét cháa
נגמרה הסוללה|แบตหมด|bàet mòt`,
`הצילו / עזרה!|ช่วยด้วย|chûay dûay
בית מרקחת|ร้านขายยา|ráan khǎai yaa
רופא|หมอ|mǎw
בית חולים|โรงพยาบาล|rong-phá-yaa-baan
יש חום|มีไข้|mii khâi
שיעול|ไอ|ai
כאב גרון|เจ็บคอ|jèp khaw
כאב ראש|ปวดหัว|pùat hǔa
כאב בטן|ปวดท้อง|pùat tháwng
מסוחרר|เวียนหัว|wian hǔa
אלרגי לתרופה|แพ้ยา|pháe yaa
יש תרופה לכאב ראש?|มียาแก้ปวดหัวไหม|mii yaa kâe pùat hǔa mǎi
כמה פעמים ביום לקחת את התרופה?|กินยาวันละกี่ครั้ง|kin yaa wan lá kìi khráng`,
`מואי תאי|มวยไทย|muay thai
כדורגל|ฟุตบอล|fút-bawn
לשחות|ว่ายน้ำ|wâai-náam
להקשיב למוזיקה|ฟังเพลง|fang phleeng
לנגן|เล่นดนตรี|lên don-trii
לשיר|ร้องเพลง|ráwng phleeng
לרוץ|วิ่ง|wîng
אתה אוהב ספורט?|คุณชอบกีฬาไหม|khun châwp kii-laa mǎi
במה אתה אוהב לשחק?|คุณชอบเล่นอะไร|khun châwp lên à-rai
מה אתה עושה בזמן הפנוי?|เวลาว่างทำอะไร|wee-laa wâang tham à-rai
לטייל|ไปเที่ยว|pai thîao
טעים (דרום תאילנד)|หรอย|rǒi`,
];

export interface ThaiWord { id: string; en: string; he: string; th: string; pos: 'n' | 'o'; ex: string; level: number; order: number }

/** A stable name for a recording, taken from the Thai text. The audio script uses the same value. */
export function audioName(th: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < th.length; i++) { h ^= th.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}

export const THAI_WORDS: ThaiWord[] = RAW.flatMap((block, level) => block.split('\n').map((line, i) => {
  const [he, th, en] = line.split('|');
  return { id: `t${audioName(th)}`, en, he, th, pos: /\s/.test(en) ? 'o' as const : 'n' as const, ex: '', level, order: level * 1000 + i };
}));

// The sentence patterns from the list. Longer phrases from the bank join them once their word has been met.
const PATTERNS: Record<string, string> = {
  ask: `אבקש מים|ขอน้ำ|khǎw náam
אבקש תפריט|ขอเมนู|khǎw mee-nuu
אבקש קפה|ขอกาแฟ|khǎw kaa-fae
אבקש תה|ขอชา|khǎw chaa
אבקש את זה|ขออันนี้|khǎw an-níi`,
  without: `בלי להוסיף קרח|ไม่ใส่น้ำแข็ง|mâi sài náam-khǎeng
בלי להוסיף ירקות|ไม่ใส่ผัก|mâi sài phàk`,
  have: `יש קפה?|มีกาแฟไหม|mii kaa-fae mǎi
יש תה?|มีชาไหม|mii chaa mǎi
יש מנגו?|มีมะม่วงไหม|mii má-mûang mǎi
יש שרימפס?|มีกุ้งไหม|mii kûng mǎi`,
  spicy: `לא חריף|ไม่เผ็ด|mâi phèt
מעט חריף|เผ็ดนิดหน่อย|phèt nít-nàwy`,
};

export interface ThaiSentence { id: string; en: string; he: string; th: string; topic: string; order: number; word?: string }

export const THAI_TOPICS: Record<string, string> = {
  ask: 'מבקשים משהו', without: 'בלי תוספת', have: 'לשאול אם יש', spicy: 'לא חריף / מעט חריף',
  ...Object.fromEntries(THAI_LEVELS.map((l, i) => [`c${i}`, l.name])),
};

const fromPatterns = Object.entries(PATTERNS).flatMap(([topic, block]) => block.split('\n').map((line) => {
  const [he, th, en] = line.split('|');
  return { he, th, en, topic } as Omit<ThaiSentence, 'id' | 'order'>;
}));
const fromBank = THAI_WORDS.filter((w) => w.en.split(/\s+/).length >= 3 && !w.en.includes('…'))
  .map((w) => ({ he: w.he, th: w.th, en: w.en, topic: `c${w.level}`, word: w.id }));

export const THAI_SENTENCES: ThaiSentence[] = [...fromPatterns, ...fromBank].map((s, order) => ({ ...s, id: `ts${audioName(s.th)}`, order }));

/** Everything that needs a recording. */
export const THAI_AUDIO: { th: string; en: string }[] = [...new Map([...THAI_WORDS, ...THAI_SENTENCES].map((e) => [e.th, { th: e.th, en: e.en }])).values()];
