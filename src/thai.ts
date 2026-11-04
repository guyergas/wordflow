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
תודה רבה|ขอบคุณมากครับ|khàwp-khun mâak khráp
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
נתראה|แล้วเจอกัน|láeo joe kan
להתראות|บ๊ายบาย|baai-baai
לילה טוב|ฝันดี|fǎn dii
מאיפה אתה?|คุณมาจากไหน|khun maa jàak nǎi
אני מישראל|ผมมาจากอิสราเอล|phǒm maa jàak ìt-sà-raa-en
בן כמה אתה?|คุณอายุเท่าไหร่|khun aa-yú thâo-rài`,
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
בסדר|โอเค|oo-khee
נכון|ถูกต้อง|thùuk-tâwng
אפשר|ได้|dâai
אי אפשר|ไม่ได้|mâi dâai
אני רוצה|ผมอยาก|phǒm yàak
מספיק|พอแล้ว|phaw láeo
רק זה|แค่นี้|khâe níi
לא / זה לא נכון|ไม่ใช่|mâi châi
אפשר עזרה?|ช่วยหน่อยได้ไหม|chûay nàwy dâai mǎi
רגע אחד|รอแป๊บนึง|raw páep nueng`,
`יותר מ־|มากกว่า|mâak kwàa
פחות מ־|น้อยกว่า|náwy kwàa
עם (מישהו)|กับ|kàp
ו־ / וגם|แล้วก็|láeo kâw
או|หรือ|rǔe
אבל|แต่|tàe
כי|เพราะ|phráw
גם|ด้วย|dûay
להוסיף / לשים|ใส่|sài
בלי להוסיף|ไม่ใส่|mâi sài
עוד / שוב|อีก|ìik
יש / יש לי|มี|mii
אין / אין לי|ไม่มี|mâi mii
לא|ไม่|mâi
האם?|ไหม|mǎi
מי?|ใคร|khrai
מה?|อะไร|à-rai
למה?|ทำไม|tham-mai
מתי?|เมื่อไหร่|mûea-rài
איך?|ยังไง|yang-ngai
של|ของ|khǎwng
צריך|ต้อง|tâwng
עדיין / עוד לא|ยัง|yang
הזה / הזאת|นี้|níi
ההוא / ההיא|นั้น|nán
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
אפס|ศูนย์|sǔun
שמונה|แปด|pàet
תשעה|เก้า|kâo
עשרה|สิบ|sìp
אחת עשרה|สิบเอ็ด|sìp-èt
עשרים ואחת|ยี่สิบเอ็ด|yîi-sìp-èt
עשרים|ยี่สิบ|yîi-sìp
שלושים|สามสิบ|sǎam-sìp
ארבעים|สี่สิบ|sìi-sìp
חמישים|ห้าสิบ|hâa-sìp
שישים|หกสิบ|hòk-sìp
שבעים|เจ็ดสิบ|jèt-sìp
שמונים|แปดสิบ|pàet-sìp
תשעים|เก้าสิบ|kâo-sìp
מאה|ร้อย|ráwy
אלף|พัน|phan
עשרת אלפים|หมื่น|mùen
מאה אלף|แสน|sǎen
מיליון|ล้าน|láan
חצי|ครึ่ง|khrûeng
מונה אנשים|คน|khon
מונה חפצים|อัน|an
מונה בעלי חיים|ตัว|tua
כוס / מונה כוסות|แก้ว|kâew
בקבוק / מונה בקבוקים|ขวด|khùat
צלחת / מונה מנות|จาน|jaan
קערה|ชาม|chaam
שקית|ถุง|thǔng
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
בירה|เบียร์|bia
חלב|นม|nom
מיץ|น้ำผลไม้|nám phǒn-lá-máai
אורז|ข้าว|khâao
אורז מטוגן|ข้าวผัด|khâao-phàt
פאד תאי|ผัดไทย|phàt-thai
אטריות במרק|ก๋วยเตี๋ยว|kǔay-tǐao
מרק|ซุป|súp
תום יאם|ต้มยำ|tôm-yam
ביצה|ไข่|khài
עוף|ไก่|kài
חזיר|หมู|mǔu
בקר|เนื้อ|núea
צמחוני|มังสวิรัติ|mang-sà-wí-rát
קרח בבקשה|ขอน้ำแข็งหน่อย|khǎw náam-khǎeng nàwy
עוד כוס אחת בבקשה|ขออีกหนึ่งแก้ว|khǎw ìik nùeng kâew
רוצה לשתות|อยากดื่ม|yàak dùem
מה אתה ממליץ?|แนะนำอะไรดี|náe-nam à-rai dii
מה זה?|นี่คืออะไร|nîi khue à-rai
מעט חריף|เผ็ดนิดหน่อย|phèt nít-nàwy
לא חריף|ไม่เผ็ด|mâi phèt
חריף|เผ็ด|phèt
מתוק|หวาน|wǎan
מר|ขม|khǒm
מלוח|เค็ม|khem
חמוץ|เปรี้ยว|prîao
סוכר|น้ำตาล|nám-taan
מלח|เกลือ|kluea
בלי סוכר|ไม่ใส่น้ำตาล|mâi sài nám-taan
אפשר פחות מתוק?|หวานน้อยได้ไหม|wǎan náwy dâai mǎi
טעים|อร่อย|à-ràwy
אני שבע|อิ่มแล้ว|ìm láeo
לאכול כאן|กินที่นี่|kin thîi-nîi
לארוז לקחת|ห่อกลับบ้าน|hàw klàp bâan
כף|ช้อน|cháwn
מזלג|ส้อม|sâwm
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
ארוך|ยาว|yaao
קצר|สั้น|sân
גבוה|สูง|sǔung
נמוך|เตี้ย|tîa
חם|ร้อน|ráwn
קר|เย็น|yen
כבד|หนัก|nàk
קל (משקל)|เบา|bao
נקי|สะอาด|sà-àat
מלוכלך|สกปรก|sòk-kà-pròk
צבע|สี|sǐi
אדום|สีแดง|sǐi daeng
כחול (גוון עמוק)|สีน้ำเงิน|sǐi nám-ngoen
כחול בהיר / תכלת|สีฟ้า|sǐi fáa
ירוק|สีเขียว|sǐi khǐao
לבן|สีขาว|sǐi khǎao
שחור|สีดำ|sǐi dam
צהוב|สีเหลือง|sǐi lǔeang
כתום|สีส้ม|sǐi sôm
ורוד|สีชมพู|sǐi chom-phuu
סגול|สีม่วง|sǐi mûang
חום (צבע)|สีน้ำตาล|sǐi nám-taan
אפור|สีเทา|sǐi thao
כסוף|สีเงิน|sǐi ngoen
זהוב|สีทอง|sǐi thawng
טוב יותר|ดีกว่า|dii kwàa
אותו דבר|เหมือนกัน|mǔean-kan
שונה|ต่างกัน|tàang-kan
זה טוב יותר מזה|อันนี้ดีกว่าอันนั้น|an-níi dii kwàa an-nán`,
`פירות|ผลไม้|phǒn-lá-máai
בננה|กล้วย|klûay
מנגו|มะม่วง|má-mûang
אננס|สับปะรด|sàp-pà-rót
אבטיח|แตงโม|taeng-moo
פפאיה|มะละกอ|má-lá-kaw
קוקוס|มะพร้าว|má-phráao
תפוז|ส้ม|sôm
ליים|มะนาว|má-naao
תפוח|แอปเปิล|àep-pôen
דוריאן|ทุเรียน|thú-rian
רמבוטן|เงาะ|ngáw
מנגוסטין|มังคุด|mang-khút
ירקות|ผัก|phàk
עגבנייה|มะเขือเทศ|má-khǔea-thêet
מלפפון|แตงกวา|taeng-kwaa
בצל|หัวหอม|hǔa-hǎwm
שום|กระเทียม|krà-thiam
צ׳ילי|พริก|phrík
תירס|ข้าวโพด|khâao-phôot
תפוח אדמה|มันฝรั่ง|man-fà-ràng
דג|ปลา|plaa
שרימפס|กุ้ง|kûng
סרטן (ים)|ปู|puu
דיונון|ปลาหมึก|plaa-mùek
קילו|กิโล|kì-loo
כמה באט?|กี่บาท|kìi bàat
כמה הכול ביחד?|ทั้งหมดเท่าไหร่|tháng-mòt thâo-rài
יקר|แพง|phaeng
זול|ถูก|thùuk
כסף|เงิน|ngoen
מזומן|เงินสด|ngoen-sòt
לקנות|ซื้อ|súe
למכור|ขาย|khǎai
יקר מדי|แพงเกินไป|phaeng koen pai
אפשר הנחה?|ลดได้ไหม|lót dâai mǎi
אפשר לנסות?|ลองได้ไหม|lawng dâai mǎi
רוצה לנסות|อยากลอง|yàak lawng
יש מידה גדולה?|มีไซส์ใหญ่ไหม|mii sai yài mǎi
יש צבע אחר?|มีสีอื่นไหม|mii sǐi ùen mǎi
מקבלים כרטיס אשראי?|รับบัตรเครดิตไหม|ráp bàt khree-dìt mǎi
לשים בשקית|ใส่ถุง|sài thǔng
לא אקנה|ไม่ซื้อ|mâi súe
חולצה|เสื้อ|sûea
מכנסיים|กางเกง|kaang-keeng
נעליים|รองเท้า|rawng-tháao
כובע|หมวก|mùak
רק מסתכל|ดูเฉยๆ|duu chǒei-chǒei`,
`אני מדבר קצת תאית|ผมพูดไทยได้นิดหน่อย|phǒm phûut thai dâai nít-nàwy
אני לא מדבר תאית|ผมพูดไทยไม่ได้|phǒm phûut thai mâi dâai
אני לומד תאית|ผมเรียนภาษาไทย|phǒm rian phaa-sǎa thai
אפשר לדבר לאט?|พูดช้าๆ ได้ไหม|phûut cháa-cháa dâai mǎi
אפשר לומר שוב?|พูดอีกทีได้ไหม|phûut ìik thii dâai mǎi
מה זה אומר?|แปลว่าอะไร|plae wâa à-rai
אנגלית|ภาษาอังกฤษ|phaa-sǎa ang-krìt
אתה מדבר אנגלית?|คุณพูดอังกฤษได้ไหม|khun phûut ang-krìt dâai mǎi
איך אומרים את זה בתאית?|อันนี้ภาษาไทยเรียกว่าอะไร|an-níi phaa-sǎa thai rîak wâa à-rai
אני מבין|ผมเข้าใจ|phǒm khâo-jai
לא שמעתי|ผมไม่ได้ยิน|phǒm mâi dâai yin
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
לפנות שמאלה|เลี้ยวซ้าย|líao sáai
לפנות ימינה|เลี้ยวขวา|líao khwǎa
כאן|ที่นี่|thîi-nîi
שם|ที่นั่น|thîi-nân
קרוב|ใกล้|klâi
רחוק|ไกล|klai
זה רחוק?|ไกลไหม|klai mǎi
זה לוקח הרבה זמן?|ใช้เวลานานไหม|chái wee-laa naan mǎi
אפשר להגיע למלון הזה?|ไปโรงแรมนี้ได้ไหม|pai rong-raem níi dâai mǎi
לעצור כאן|จอดตรงนี้|jàwt trong-níi
שוק|ตลาด|tà-làat
מסעדה|ร้านอาหาร|ráan aa-hǎan
אופנוע|มอเตอร์ไซค์|maw-toe-sai
סירה|เรือ|ruea
מונית|แท็กซี่|tháek-sîi
אוטובוס|รถเมล์|rót-mee
מכונית|รถ|rót
טנדר הסעה (סונגטאו)|สองแถว|sǎwng-thǎeo
שדה תעופה|สนามบิน|sà-nǎam-bin
מלון|โรงแรม|rong-raem
ים|ทะเล|thá-lee
חוף|ชายหาด|chaai-hàat
אי|เกาะ|kàw
כרטיס נסיעה|ตั๋ว|tǔa
כמה עולה להגיע לשם?|ไปที่นั่นเท่าไหร่|pai thîi-nân thâo-rài
הלכתי לאיבוד|ผมหลงทาง|phǒm lǒng thaang`,
`משפחה|ครอบครัว|khrâwp-khrua
אמא|แม่|mâe
אבא|พ่อ|phâw
אח גדול|พี่ชาย|phîi-chaai
אחות גדולה|พี่สาว|phîi-sǎao
אח קטן / אחות קטנה|น้อง|náwng
בעל|สามี|sǎa-mii
בן (שלי)|ลูกชาย|lûuk-chaai
בת (שלי)|ลูกสาว|lûuk-sǎao
אשתי / אישה|ภรรยา|phan-rá-yaa
ילד / ילדים|เด็ก|dèk
חבר|เพื่อน|phûean
שכן|เพื่อนบ้าน|phûean-bâan
בית|บ้าน|bâan
נחמד / טוב לב|ใจดี|jai-dii
חמוד|น่ารัก|nâa-rák
לבשל|ทำอาหาร|tham aa-hǎan
לאכול|กิน|kin
לשתות|ดื่ม|dùem
ללכת / לנסוע|ไป|pai
לבוא|มา|maa
לראות / להסתכל|ดู|duu
לאהוב|ชอบ|châwp
לעבוד|ทำงาน|tham-ngaan
לישון|นอน|nawn
לאכול ארוחה|กินข้าว|kin khâao
רעב|หิว|hǐu
צמא|หิวน้ำ|hǐu náam
עייף|เหนื่อย|nùeay
שמח|ดีใจ|dii-jai
עצוב|เศร้า|sâo
חולה|ป่วย|pùay
לא מרגיש טוב|ไม่สบาย|mâi sà-baai
מרגיש יותר טוב|รู้สึกดีขึ้น|rúu-sùek dii khûen`,
`באמת?|จริงเหรอ|jing rǒe
באמת / בעצם|จริงๆ|jing-jing
מעניין|น่าสนใจ|nâa-sǒn-jai
מצחיק|ตลก|tà-lòk
טוב מאוד|ดีมาก|dii mâak
נהדר|เยี่ยม|yîam
כל הכבוד|เก่งมาก|kèng mâak
כמה יפה|สวยจัง|sǔay jang
מסכים|เห็นด้วย|hěn dûay
לא מסכים|ไม่เห็นด้วย|mâi hěn dûay
אני חושב ש…|ผมคิดว่า|phǒm khít wâa…
אני חושב שכן|ผมคิดว่าใช่|phǒm khít wâa châi
אני לא חושב ככה|ผมไม่คิดอย่างนั้น|phǒm mâi khít yàang-nán
אתה בטוח?|แน่ใจไหม|nâe-jai mǎi
אפשר / בטח|ได้สิ|dâai sì
אחשוב על זה|ขอคิดดูก่อน|khǎw khít duu kàwn
לא רוצה / לא מתחשק לי|ไม่อยาก|mâi yàak
מצטער על זה|ขอโทษด้วยครับ|khǎw-thôht dûay khráp
קדימה, אתה יכול!|สู้ๆ|sûu-sûu`,
`היום|วันนี้|wan-níi
מחר|พรุ่งนี้|phrûng-níi
אתמול|เมื่อวาน|mûea-waan
מחרתיים|มะรืนนี้|má-ruen-níi
עכשיו|ตอนนี้|tawn-níi
אחר כך|ทีหลัง|thii-lǎng
בוקר|ตอนเช้า|tawn cháao
צהריים|ตอนเที่ยง|tawn thîang
אחר הצהריים|ตอนบ่าย|tawn bàai
ערב|ตอนเย็น|tawn yen
לילה|กลางคืน|klaang-khuen
דקה|นาที|naa-thii
שעה|ชั่วโมง|chûa-moong
שבוע|อาทิตย์|aa-thít
חודש|เดือน|duean
שנה|ปี|pii
השבוע|อาทิตย์นี้|aa-thít níi
סוף שבוע|เสาร์อาทิตย์|sǎo aa-thít
תמיד|ตลอด|tà-làwt
לפעמים|บางที|baang-thii
אף פעם|ไม่เคย|mâi khoei
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
מפתח|กุญแจ|kun-jae
מיטה|เตียง|tiang
מקלחת|ฝักบัว|fàk-bua
מים חמים|น้ำอุ่น|nám-ùn
מאוורר|พัดลม|phát-lom
מקרר|ตู้เย็น|tûu-yen
חלון|หน้าต่าง|nâa-tàang
דלת|ประตู|prà-tuu
כביסה|ซักผ้า|sák-phâa
המזגן מקולקל|แอร์เสีย|ae sǐa
זה לא עובד|ใช้ไม่ได้|chái mâi dâai
האור לא נדלק|ไฟไม่ติด|fai mâi tìt
אפשר לתקן את זה?|ซ่อมได้ไหม|sâwm dâai mǎi
אפשר עוד מגבת?|ขอผ้าเช็ดตัวอีกผืน|khǎw phâa-chét-tua ìik phǔen
אפשר את סיסמת ה־Wi-Fi?|ขอรหัสไวไฟหน่อย|khǎw rá-hàt wai-fai nàwy
אין קליטה|ไม่มีสัญญาณ|mâi mii sǎn-yaan
האינטרנט איטי|เน็ตช้า|nét cháa
נגמרה הסוללה|แบตหมด|bàet mòt
טלפון נייד|มือถือ|mue-thǔe
מטען|ที่ชาร์จ|thîi-cháat`,
`הצילו / עזרה!|ช่วยด้วย|chûay dûay
בית מרקחת|ร้านขายยา|ráan khǎai yaa
רופא|หมอ|mǎw
בית חולים|โรงพยาบาล|rong-phá-yaa-baan
אמבולנס|รถพยาบาล|rót-phá-yaa-baan
משטרה|ตำรวจ|tam-rùat
סכנה|อันตราย|an-tà-raai
להיזהר|ระวัง|rá-wang
נפצעתי / כואב לי|ผมเจ็บ|phǒm jèp
יש חום|มีไข้|mii khâi
שיעול|ไอ|ai
כאב גרון|เจ็บคอ|jèp khaw
כאב ראש|ปวดหัว|pùat hǔa
כאב בטן|ปวดท้อง|pùat tháwng
כאב שיניים|ปวดฟัน|pùat fan
כאב גב|ปวดหลัง|pùat lǎng
שלשול|ท้องเสีย|tháwng-sǐa
הקאה|อ้วก|ûak
מסוחרר|เวียนหัว|wian hǔa
אלרגי לתרופה|แพ้ยา|pháe yaa
תרופה|ยา|yaa
קרם הגנה|ครีมกันแดด|khriim kan-dàet
דוחה יתושים|ยากันยุง|yaa kan-yung
יש תרופה לכאב ראש?|มียาแก้ปวดหัวไหม|mii yaa kâe pùat hǔa mǎi
כמה פעמים ביום לקחת את התרופה?|กินยาวันละกี่ครั้ง|kin yaa wan lá kìi khráng`,
`מואי תאי|มวยไทย|muay thai
כדורגל|ฟุตบอล|fút-bawn
לשחות|ว่ายน้ำ|wâai-náam
לצלול|ดำน้ำ|dam-náam
לטפס על הר|ปีนเขา|piin khǎo
לדוג|ตกปลา|tòk plaa
יוגה|โยคะ|yoo-khá
חדר כושר|ฟิตเนส|fít-nét
לרכב על אופניים|ขี่จักรยาน|khìi jàk-krà-yaan
להקשיב למוזיקה|ฟังเพลง|fang phleeng
לנגן|เล่นดนตรี|lên don-trii
לשיר|ร้องเพลง|ráwng phleeng
לרקוד|เต้น|tên
לקרוא ספר|อ่านหนังสือ|àan nǎng-sǔe
לצלם|ถ่ายรูป|thàai rûup
סרט|หนัง|nǎng
לרוץ|วิ่ง|wîng
אתה אוהב ספורט?|คุณชอบกีฬาไหม|khun châwp kii-laa mǎi
במה אתה אוהב לשחק?|คุณชอบเล่นอะไร|khun châwp lên à-rai
מה אתה עושה בזמן הפנוי?|เวลาว่างทำอะไร|wee-laa wâang tham à-rai
לטייל|ไปเที่ยว|pai thîao
קראבי|กระบี่|krà-bìi
טעים (דרום תאילנד)|หรอย|rǒi`,
];

export interface ThaiWord { id: string; en: string; he: string; th: string; pos: 'n' | 'o'; ex: string; level: number; order: number }

/** A stable name for a recording, taken from the Thai text. The audio script uses the same value. */
export function audioName(th: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < th.length; i++) { h ^= th.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}

/** Whole things you say to someone, which take the polite ending. Every question does too, see `isPolite`. */
const SAID_TO_SOMEONE = new Set(`לא נורא / אין בעיה
אני לא מבין
הכול טוב
קוראים לי גיא
נעים להכיר
נתראה
להתראות
לילה טוב
אני מישראל
אקח את זה
אבקש את זה
לא אקח / לא, תודה
לא כל כך טוב
כן
לא / זה לא נכון
רגע אחד
בסדר
נכון
אפשר
אי אפשר
מספיק
רק זה
בקבוק אחד
עוד אחד
אקח שלושה כאלה
אפשר תפריט בבקשה
אני רוצה להזמין אוכל
מים בבקשה
קרח בבקשה
עוד כוס אחת בבקשה
רוצה לשתות
מעט חריף
לא חריף
בלי סוכר
טעים
אני שבע
לאכול כאן
לארוז לקחת
זה טוב יותר מזה
יקר מדי
רוצה לנסות
לשים בשקית
לא אקנה
רק מסתכל
אני מדבר קצת תאית
אני לא מדבר תאית
אני לומד תאית
אני מבין
לא שמעתי
הבנתי עכשיו
אני לא יודע
תודה על העזרה
ישר
לפנות שמאלה
לפנות ימינה
לעצור כאן
הלכתי לאיבוד
רעב
צמא
עייף
חולה
לא מרגיש טוב
מרגיש יותר טוב
מסכים
לא מסכים
טוב מאוד
כל הכבוד
כמה יפה
אני חושב שכן
אפשר / בטח
אחשוב על זה
לא רוצה / לא מתחשק לי
אני לא חושב ככה
לא פנוי
בטח
אולי
סגור / מוסכם
אני לא בטוח
המזגן מקולקל
זה לא עובד
האור לא נדלק
אין קליטה
האינטרנט איטי
נגמרה הסוללה
נפצעתי / כואב לי
יש חום
כאב גרון
כאב ראש
כאב בטן
כאב שיניים
כאב גב
מסוחרר
אלרגי לתרופה`.split('\n'));

const isPolite = (he: string, th: string) => !th.endsWith('ครับ') && (SAID_TO_SOMEONE.has(he) || (he.endsWith('?') && he !== 'האם?'));
const politeTh = (th: string) => `${th}ครับ`;
const politeEn = (en: string) => `${en} khráp`;

// The id comes from the Thai without the ending, so progress on a word survives changes to its ending.
export const THAI_WORDS: ThaiWord[] = RAW.flatMap((block, level) => block.split('\n').map((line, i) => {
  const [he, base, baseEn] = line.split('|');
  const polite = isPolite(he, base);
  const en = polite ? politeEn(baseEn) : baseEn;
  return { id: `t${audioName(base)}`, en, he, th: polite ? politeTh(base) : base, pos: /\s/.test(en) ? 'o' as const : 'n' as const, ex: '', level, order: level * 1000 + i };
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
  return { he, th: politeTh(th), en: politeEn(en), topic, key: th };
}));
const inPatterns = new Set(fromPatterns.map((s) => s.th));
const fromBank = THAI_WORDS.filter((w) => w.en.split(/\s+/).length >= 3 && !w.en.includes('…') && !inPatterns.has(w.th))
  .map((w) => ({ he: w.he, th: w.th, en: w.en, topic: `c${w.level}`, word: w.id, key: w.id.slice(1) }));

export const THAI_SENTENCES: ThaiSentence[] = [...fromPatterns, ...fromBank].map(({ key, ...s }, order) => ({
  ...s, id: `ts${/^[0-9a-f]{8}$/.test(key) ? key : audioName(key)}`, order,
}));

/** Everything that needs a recording. */
export const THAI_AUDIO: { th: string; en: string }[] = [...new Map([...THAI_WORDS, ...THAI_SENTENCES].map((e) => [e.th, { th: e.th, en: e.en }])).values()];
