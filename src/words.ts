import { IS_THAI } from './course';
import { THAI_LEVELS, THAI_WORDS } from './thai';

// Word bank, easy to hard. Line format: word|hebrew|pos|example sentence (contains the exact word)|Hebrew translation of the sentence.
export type Pos = 'n' | 'v' | 'a' | 'd' | 'o';
/** In Thai mode `en` holds the transliteration, `th` the Thai text, and `ex` stays empty. */
export interface Word { id: string; en: string; he: string; pos: Pos; ex: string; level: number; order: number; exHe?: string; th?: string }

const EN_LEVELS: { name: string; cefr: string; blurb: string }[] = [
  { name: 'הבית', cefr: 'A1', blurb: 'המילים של כל יום' },
  { name: 'השכונה', cefr: 'A2', blurb: 'בית ספר, חברים ועיר' },
  { name: 'החיים', cefr: 'A2', blurb: 'רגשות, פעולות וגוף' },
  { name: 'הדרך', cefr: 'A2+', blurb: 'טיולים, טבע ומזג אוויר' },
  { name: 'הסיפור', cefr: 'B1', blurb: 'מילים שקוראים בספרים' },
  { name: 'הדעה', cefr: 'B1', blurb: 'לחשוב, להסביר ולהתווכח' },
  { name: 'העולם', cefr: 'B1+', blurb: 'מדע, חברה ועתיד' },
  { name: 'הפסגה', cefr: 'B2', blurb: 'מילים גדולות למתקדמים' },
  { name: 'הסדנה', cefr: 'B2+', blurb: 'לכתוב, להסביר ולנמק' },
  { name: 'הבמה', cefr: 'B2+', blurb: 'תרבות, אנשים ותקשורת' },
  { name: 'המפה', cefr: 'C1', blurb: 'חברה, סביבה והיסטוריה' },
  { name: 'השיא', cefr: 'C1', blurb: 'מילים של קוראים מנוסים' },
];

const RAW: string[] = [
`family|משפחה|n|My family lives in a small house.|המשפחה שלי גרה בבית קטן.
friend|חבר|n|She is my best friend.|היא החברה הכי טובה שלי.
house|בית|n|Their house has a red door.|לבית שלהם יש דלת אדומה.
school|בית ספר|n|I walk to school every day.|אני הולך ברגל לבית הספר כל יום.
water|מים|n|Please drink some water.|בבקשה תשתה קצת מים.
food|אוכל|n|The food smells great.|האוכל מריח נהדר.
apple|תפוח|n|He ate a green apple.|הוא אכל תפוח ירוק.
bread|לחם|n|We bought fresh bread.|קנינו לחם טרי.
chair|כיסא|n|Sit on this chair.|שב על הכיסא הזה.
table|שולחן|n|The keys are on the table.|המפתחות על השולחן.
window|חלון|n|Open the window, please.|תפתח את החלון, בבקשה.
door|דלת|n|Someone is at the door.|מישהו בדלת.
kitchen|מטבח|n|Dad is cooking in the kitchen.|אבא מבשל במטבח.
bedroom|חדר שינה|n|My bedroom is very small.|חדר השינה שלי קטן מאוד.
morning|בוקר|n|I run every morning.|אני רץ כל בוקר.
night|לילה|n|The stars shine at night.|הכוכבים זורחים בלילה.
today|היום|d|It is very hot today.|חם מאוד היום.
tomorrow|מחר|d|We have a test tomorrow.|יש לנו מבחן מחר.
yesterday|אתמול|d|I saw him yesterday.|ראיתי אותו אתמול.
always|תמיד|d|She is always happy.|היא תמיד שמחה.
never|אף פעם|d|I never eat meat.|אני אף פעם לא אוכל בשר.
often|לעתים קרובות|d|We often play outside.|אנחנו משחקים בחוץ לעתים קרובות.
big|גדול|a|That is a big dog.|זה כלב גדול.
small|קטן|a|I have a small bag.|יש לי תיק קטן.
happy|שמח|a|The children are happy.|הילדים שמחים.
sad|עצוב|a|Why are you so sad?|למה אתה כל כך עצוב?
hungry|רעב|a|I am hungry after school.|אני רעב אחרי בית הספר.
tired|עייף|a|He felt tired after the game.|הוא הרגיש עייף אחרי המשחק.
cold|קר|a|The water is too cold.|המים קרים מדי.
hot|חם|a|This soup is hot.|המרק הזה חם.
new|חדש|a|I got a new phone.|קיבלתי טלפון חדש.
old|ישן|a|This is an old book.|זה ספר ישן.
young|צעיר|a|My sister is very young.|אחותי צעירה מאוד.
beautiful|יפה|a|What a beautiful flower!|איזה פרח יפה!
eat|לאכול|v|We eat dinner at seven.|אנחנו אוכלים ארוחת ערב בשבע.
drink|לשתות|v|Cats drink milk.|חתולים שותים חלב.
sleep|לישון|v|Babies sleep a lot.|תינוקות ישנים הרבה.
walk|ללכת ברגל|v|Let's walk to the park.|בואו נלך ברגל לפארק.
run|לרוץ|v|I can run very fast.|אני יכול לרוץ מהר מאוד.
read|לקרוא|v|I read before bed.|אני קורא לפני השינה.
write|לכתוב|v|Please write your name here.|בבקשה כתבו את השם שלכם כאן.
speak|לדבר|v|Do you speak Hebrew?|את מדברת עברית?
listen|להקשיב|v|Listen to the teacher.|הקשיבי למורה.
open|לפתוח|v|Can you open the box?|את יכולה לפתוח את הקופסה?
close|לסגור|v|Please close your eyes.|בבקשה עצמי את העיניים.
buy|לקנות|v|I want to buy new shoes.|אני רוצה לקנות נעליים חדשות.
give|לתת|v|Give me the ball.|תני לי את הכדור.
take|לקחת|v|Take an umbrella with you.|קחי איתך מטרייה.
want|לרצות|v|I want some ice cream.|אני רוצה קצת גלידה.
help|לעזור|v|Can you help me?|את יכולה לעזור לי?
brother|אח|n|My brother plays guitar.|אחי מנגן בגיטרה.
sister|אחות|n|My sister likes to dance.|אחותי אוהבת לרקוד.
mother|אמא|n|My mother works at a hospital.|אמא שלי עובדת בבית חולים.
father|אבא|n|My father drives a bus.|אבא שלי נוהג באוטובוס.
teacher|מורה|n|Our teacher is very funny.|המורה שלנו מצחיקה מאוד.
student|תלמיד|n|Every student has a notebook.|לכל תלמיד יש מחברת.
color|צבע|n|Blue is my favorite color.|כחול הוא הצבע האהוב עליי.
shoes|נעליים|n|These shoes are too small.|הנעליים האלה קטנות מדי.
money|כסף|n|I saved money for a bike.|חסכתי כסף בשביל אופניים.
music|מוזיקה|n|I love listening to music.|אני אוהבת להקשיב למוזיקה.
spoon|כף|n|I eat my soup with a spoon.|אני אוכל את המרק שלי עם כף.
fork|מזלג|n|Put the fork next to the plate.|שים את המזלג ליד הצלחת.
plate|צלחת|n|The plate is on the table.|הצלחת על השולחן.
pillow|כרית|n|My pillow is very soft.|הכרית שלי רכה מאוד.
blanket|שמיכה|n|This blanket keeps me warm.|השמיכה הזאת מחממת אותי.
towel|מגבת|n|Take a towel to the beach.|קח מגבת לחוף.
sock|גרב|n|I can only find one sock.|אני מוצא רק גרב אחת.
button|כפתור|n|Press the green button.|לחץ על הכפתור הירוק.
cup|כוס|n|I drink tea from a blue cup.|אני שותה תה מכוס כחולה.
carrot|גזר|n|The rabbit ate a big carrot.|הארנב אכל גזר גדול.
lemon|לימון|n|This lemon is very sour.|הלימון הזה חמוץ מאוד.
rabbit|ארנב|n|My rabbit sleeps in a small box.|הארנב שלי ישן בקופסה קטנה.
duck|ברווז|n|A duck swims on the lake.|ברווז שוחה באגם.
garden|גינה|n|We grow flowers in our garden.|אנחנו מגדלים פרחים בגינה שלנו.
sofa|ספה|n|We sat on the sofa and watched a movie.|ישבנו על הספה וצפינו בסרט.
onion|בצל|n|Mom cuts an onion for the soup.|אמא חותכת בצל למרק.
soap|סבון|n|Wash your hands with soap.|רחץ את הידיים בסבון.
grape|ענב|n|I ate a sweet grape from the bowl.|אכלתי ענב מתוק מהקערה.
cheese|גבינה|n|I like cheese on my bread.|אני אוהב גבינה על הלחם שלי.
lamp|מנורה|n|Please turn on the lamp.|בבקשה תדליק את המנורה.
roof|גג|n|A bird is sitting on the roof.|ציפור יושבת על הגג.
moon|ירח|n|The moon is bright tonight.|הירח בהיר הלילה.
key|מפתח|n|I lost the key to my room.|איבדתי את המפתח לחדר שלי.
shelf|מדף|n|The books are on the top shelf.|הספרים על המדף העליון.
jacket|מעיל קצר|n|Take your jacket, it is cold outside.|קח את המעיל שלך, קר בחוץ.
candle|נר|n|She lit a candle on the cake.|היא הדליקה נר על העוגה.
wing|כנף|n|The bird hurt its wing.|הציפור פצעה את הכנף שלה.
tail|זנב|n|The dog wagged its tail.|הכלב כשכש בזנב.
add|להוסיף|v|We add two eggs to the bowl.|אנחנו מוסיפים שתי ביצים לקערה.
ask|לשאול|v|You can ask the teacher for help.|אפשר לשאול את המורה כשצריך עזרה.
bad|רע|a|The milk smells bad.|החלב מריח רע.
bag|תיק|n|My books are in my bag.|הספרים שלי בתיק.
bed|מיטה|n|I go to bed at eight.|אני הולך למיטה בשמונה.
box|קופסה|n|The toys are in a big box.|הצעצועים בקופסה גדולה.
boy|ילד|n|The boy is playing with a ball.|הילד משחק בכדור.
bus|אוטובוס|n|We take the bus to school.|אנחנו נוסעים לבית הספר באוטובוס.
but|אבל|o|I like tea, but I don't like coffee.|אני אוהב תה, אבל אני לא אוהב קפה.
can|יכול|v|I can swim.|אני יכול לשחות.
cat|חתול|n|The cat is sleeping on the sofa.|החתול ישן על הספה.
cut|לחתוך|v|Mom will cut the cake.|אמא תחתוך את העוגה.
dad|אבא|n|My dad makes the best pancakes.|אבא שלי מכין את הפנקייקים הכי טובים.
desk|שולחן כתיבה|n|My books are on my desk.|הספרים שלי על שולחן הכתיבה שלי.
do|לעשות|v|I do my homework after lunch.|אני עושה את שיעורי הבית אחרי ארוחת הצהריים.
dog|כלב|n|The dog runs in the park.|הכלב רץ בפארק.
egg|ביצה|n|I eat an egg for breakfast.|אני אוכלת ביצה לארוחת הבוקר.
end|סוף|n|We clapped at the end of the show.|מחאנו כפיים בסוף ההצגה.
fan|מאוורר|n|The fan keeps the room cool.|המאוורר שומר על החדר קריר.
fast|מהר|d|She can run very fast.|היא יכולה לרוץ מהר מאוד.
fifth|חמישי|a|We live on the fifth floor.|אנחנו גרים בקומה החמישית.
film|סרט|n|We watched a funny film last night.|ראינו אתמול בערב סרט מצחיק.
fun|כיף|n|The trip was a lot of fun.|הטיול היה כיף גדול.
get|לקבל|v|I get a present on my birthday.|אני מקבלת מתנה ביום ההולדת שלי.
gift|מתנה|n|This gift is for you.|המתנה הזאת בשבילך.
go|ללכת|v|We go to the park on Friday.|אנחנו הולכים לפארק ביום שישי.
hand|יד|n|Raise your hand, please.|הרימי את היד, בבקשה.
have|יש ל-|v|We have a big garden.|יש לנו גינה גדולה.
hello|שלום|o|Say hello to your grandma.|תגידי שלום לסבתא שלך.
in|בתוך|o|The cat is in the box.|החתול בתוך הקופסה.
man|איש, גבר|n|The man is reading a newspaper.|האיש קורא עיתון.
milk|חלב|n|I drink milk every morning.|אני שותה חלב כל בוקר.`,
`neighbor|שכן|n|Our neighbor has three cats.|לשכן שלנו יש שלושה חתולים.
street|רחוב|n|We live on a quiet street.|אנחנו גרים ברחוב שקט.
library|ספרייה|n|I borrowed it from the library.|שאלתי את זה מהספרייה.
hospital|בית חולים|n|The nurse works at the hospital.|האחות עובדת בבית החולים.
store|חנות|n|The store closes at nine.|החנות נסגרת בתשע.
restaurant|מסעדה|n|We ate at a new restaurant.|אכלנו במסעדה חדשה.
ticket|כרטיס|n|I bought a ticket for the movie.|קניתי כרטיס לסרט.
homework|שיעורי בית|n|I finished my homework early.|סיימתי את שיעורי הבית מוקדם.
lesson|שיעור|n|The English lesson was fun.|השיעור באנגלית היה כיף.
question|שאלה|n|May I ask a question?|אפשר לשאול שאלה?
answer|תשובה|n|I know the answer.|אני יודע את התשובה.
mistake|טעות|n|Everyone makes a mistake sometimes.|כל אחד עושה לפעמים טעות.
pencil|עיפרון|n|Can I borrow a pencil?
notebook|מחברת|n|Write it in your notebook.
language|שפה|n|English is a useful language.
holiday|חג|n|Passover is my favorite holiday.
birthday|יום הולדת|n|Her birthday is in June.
present|מתנה|n|I wrapped the present in blue paper.
party|מסיבה|n|Are you coming to the party?
game|משחק|n|We won the game!
team|קבוצה|n|Our team practices on Monday.
sport|ספורט|n|Swimming is my favorite sport.
weekend|סוף שבוע|n|We visit grandma every weekend.
minute|דקה|n|Wait a minute, please.
hour|שעה|n|The trip takes one hour.
month|חודש|n|We move next month.
middle|אמצע|n|The ball is in the middle.
different|שונה|a|We have very different ideas.
same|אותו דבר|a|We wear the same shirt.
easy|קל|a|This puzzle is easy.
difficult|קשה|a|The test was difficult.
expensive|יקר|a|That phone is too expensive.
cheap|זול|a|These shoes were cheap.
early|מוקדם|a|I woke up early.
late|מאוחר|a|Sorry, I am late.
quiet|שקט|a|The library is very quiet.
loud|רועש|a|The music is too loud.
clean|נקי|a|My room is clean now.
dirty|מלוכלך|a|Your hands are dirty.
favorite|אהוב ביותר|a|Pizza is my favorite food.
important|חשוב|a|This is an important message.
ready|מוכן|a|Are you ready to go?
learn|ללמוד|v|I want to learn French.
teach|ללמד|v|She can teach you to swim.
understand|להבין|v|I do not understand this word.
remember|לזכור|v|I remember your name.
forget|לשכוח|v|Don't forget your keys.
borrow|לשאול (לזמן מה)|v|Can I borrow your ruler?
choose|לבחור|v|You can choose any color.
finish|לסיים|v|I will finish it tonight.
begin|להתחיל|v|The movie will begin soon.
wait|לחכות|v|Please wait for me.
meet|לפגוש|v|Let's meet after school.
visit|לבקר|v|We visit the museum on Sunday.
send|לשלוח|v|I will send you a message.
carry|לסחוב|v|Can you carry this bag?
because|כי|o|I stayed home because it rained.
between|בין|o|Sit between us.
before|לפני|o|Wash your hands before lunch.
after|אחרי|o|We play after dinner.
wash|לשטוף|v|I wash my hands before lunch.
thirsty|צמא|a|The thirsty boy drank some water.
shirt|חולצה|n|He is wearing a clean white shirt.
hat|כובע|n|Put on your hat when it is sunny.
sing|לשיר|v|We sing together in music class.
tall|גבוה|a|My brother is very tall.
stairs|מדרגות|n|We walked up the stairs to our flat.
mirror|מראה|n|She looked at her hair in the mirror.
farmer|חקלאי|n|The farmer feeds his cows every morning.
belong|להשתייך|v|These books belong to my sister.
collect|לאסוף|v|My brother likes to collect old coins.
celebrate|לחגוג|v|We celebrate my birthday with a big cake.
glove|כפפה|n|I lost one glove in the snow.
basket|סל|n|We put the apples in a basket.
noisy|רועש|a|The classroom was very noisy today.
sleepy|מנומנם|a|The baby is sleepy after lunch.
hurry|למהר|v|We must hurry or we will miss the bus.
guest|אורח|n|Our guest stayed for dinner.
puddle|שלולית|n|The kids jumped into a puddle.
recipe|מתכון|n|Grandma gave me her cake recipe.
best|הכי טוב|a|This is the best cake I have ever eaten.|זו העוגה הכי טובה שאכלתי אי פעם.
bit|קצת|n|Can I have a bit of your sandwich?|אפשר לקבל קצת מהכריך שלך?
both|שניהם|o|Both of my sisters like to sing.|שתי האחיות שלי אוהבות לשיר.
accident|תאונה|n|Nobody was hurt in the accident.|אף אחד לא נפגע בתאונה.
ache|כאב|n|I have an ache in my back.|יש לי כאב בגב.
activity|פעילות|n|Swimming is my favorite activity.|שחייה היא הפעילות האהובה עליי.
camp|מחנה|n|We sleep in tents at camp.|אנחנו ישנים באוהלים במחנה.
cost|לעלות (מחיר)|v|How much does this book cost?|כמה עולה הספר הזה?
album|אלבום|n|She showed me her photo album.|היא הראתה לי את אלבום התמונות שלה.
amazing|מדהים|a|The view from the mountain is amazing.|הנוף מההר מדהים.
apartment|דירה|n|We live in an apartment on the third floor.|אנחנו גרים בדירה בקומה השלישית.
area|אזור|n|This area has many parks.|באזור הזה יש הרבה פארקים.
army|צבא|n|My brother joined the army last year.|אחי התגייס לצבא בשנה שעברה.
awake|ער|a|I was still awake at midnight.|בחצות עוד הייתי ערה.
baker|אופה|n|The baker makes fresh bread every morning.|האופה מכין לחם טרי בכל בוקר.
glad|שמח|a|I am glad you came.|אני שמח שבאת.
half|חצי|n|I ate half of the cake.|אכלתי חצי מהעוגה.
hit|לחבוט, להכות|v|She hit the ball over the fence.|היא חבטה בכדור מעל הגדר.
if|אם|o|We stay home if it rains.|אנחנו נשארים בבית אם יורד גשם.
job|עבודה|n|My dad has a new job.|לאבא שלי יש עבודה חדשה.
balloon|בלון|n|The red balloon flew away.|הבלון האדום עף.
baseball|בייסבול|n|They play baseball after school.|הם משחקים בייסבול אחרי בית הספר.
bear|דוב|n|A brown bear lives in the forest.|דוב חום חי ביער.
bedtime|שעת השינה|n|At bedtime, Mom reads me a story.|בשעת השינה, אמא מקריאה לי סיפור.
kid|ילד|n|Every kid in the class got a sticker.|כל ילד בכיתה קיבל מדבקה.
last|אחרון|a|This is the last cookie.|זאת העוגייה האחרונה.
left|שמאלה, שמאל|d|Turn left at the corner.|פנה שמאלה בפינה.
let|לתת, להרשות|v|Mom let us stay up late.|אמא נתנה לנו להישאר ערים עד מאוחר.
lost|אבוד|a|We found a lost puppy.|מצאנו גור כלבים אבוד.
lot|הרבה|n|I have a lot of friends.|יש לי הרבה חברים.
mad|כועס|a|Dad was mad about the broken window.|אבא כעס בגלל החלון השבור.
mix|לערבב|v|Please mix the flour and the eggs.|בבקשה ערבבי את הקמח ואת הביצים.
boot|מגף|n|I can't find my left boot.|אני לא מוצאת את המגף השמאלי שלי.
bowl|קערה|n|She ate a bowl of cereal.|היא אכלה קערה של דגני בוקר.`,
`feeling|הרגשה|n|I had a strange feeling.
angry|כועס|a|She was angry at her brother.
afraid|מפחד|a|He is afraid of spiders.
excited|נרגש|a|I am so excited about the trip.
bored|משועמם|a|I get bored on long drives.
surprised|מופתע|a|We were surprised by the news.
worried|מודאג|a|Mom is worried about the storm.
proud|גאה|a|I am proud of my work.
lonely|בודד|a|The old man felt lonely.
nervous|לחוץ|a|I get nervous before a test.
funny|מצחיק|a|That movie was really funny.
kind|אדיב|a|She is kind to everyone.
polite|מנומס|a|Always be polite to guests.
honest|ישר|a|Please give me an honest answer.
brave|אמיץ|a|The brave girl saved the cat.
shy|ביישן|a|He is too shy to sing.
lazy|עצלן|a|My lazy cat sleeps all day.
strong|חזק|a|She is strong enough to lift it.
weak|חלש|a|I felt weak after the flu.
healthy|בריא|a|Vegetables keep you healthy.
sick|חולה|a|I stayed home because I was sick.
pain|כאב|n|I have a pain in my leg.
headache|כאב ראש|n|Loud noise gives me a headache.
stomach|קיבה|n|My stomach hurts.
shoulder|כתף|n|She hurt her shoulder.
knee|ברך|n|He fell and cut his knee.
tooth|שן|n|My tooth fell out.
blood|דם|n|There was blood on his shirt.
medicine|תרופה|n|Take this medicine twice a day.
doctor|רופא|n|The doctor checked my throat.
laugh|לצחוק|v|Her jokes make me laugh.
cry|לבכות|v|Sad movies make me cry.
smile|לחייך|v|Smile for the camera!
shout|לצעוק|v|Please don't shout at me.
whisper|ללחוש|v|She began to whisper a secret.
hurt|לכאוב|v|Does your arm hurt?
feel|להרגיש|v|I feel much better now.
believe|להאמין|v|I believe you.
hope|לקוות|v|I hope you win.
worry|לדאוג|v|Don't worry about it.
share|לחלוק|v|We share a room.
hug|לחבק|v|I want to hug my dog.
argue|להתווכח|v|My brothers always argue.
agree|להסכים|v|I agree with you.
promise|להבטיח|v|I promise to call you.
apologize|להתנצל|v|You should apologize to her.
forgive|לסלוח|v|Please forgive me.
trust|לסמוך על|v|You can trust me.
secret|סוד|n|Can you keep a secret?
advice|עצה|n|She gave me good advice.
habit|הרגל|n|Reading is a good habit.
dream|חלום|n|I had a weird dream.
memory|זיכרון|n|That is my favorite memory.
luck|מזל|n|Good luck on your test!
weight|משקל|n|The bag's weight is two kilos.
height|גובה|n|What is the height of that wall?
enough|מספיק|d|We have enough chairs.
almost|כמעט|d|I almost missed the bus.
maybe|אולי|d|Maybe we can go tomorrow.
suddenly|פתאום|d|Suddenly the lights went out.
lend|להשאיל|v|Can you lend me your book?
invite|להזמין|v|I want to invite my class to the party.
village|כפר|n|My grandmother lives in a small village.
careful|זהיר|a|Be careful when you cross the road.
wallet|ארנק|n|He keeps his money in a wallet.
ceiling|תקרה|n|A spider is walking on the ceiling.
accept|לקבל|v|Please accept this small gift.
connect|לחבר|v|This cable will connect the phone to the computer.
traffic|תנועת כלי רכב|n|There is a lot of traffic in the morning.
notice|להבחין|v|Did you notice the new sign on the door?
chew|ללעוס|v|Please chew your food slowly.
tidy|מסודר|a|Her room is always tidy.
stir|לערבב|v|Stir the soup with a big spoon.
remind|להזכיר|v|Please remind me to call Grandma.
accent|מבטא|n|Her grandmother speaks with a French accent.|סבתא שלה מדברת במבטא צרפתי.
achieve|להשיג|v|If you work hard, you can achieve your goals.|אם תעבדו קשה, תוכלו להשיג את המטרות שלכם.
adjective|שם תואר|n|"Happy" is an adjective.|"שמח" הוא שם תואר.
adverb|תואר הפועל|n|"Quickly" is an adverb.|"מהר" הוא תואר הפועל.
aim|מטרה|n|Our aim is to finish the project by Friday.|המטרה שלנו היא לסיים את הפרויקט עד יום שישי.
alive|חי|a|The fish is still alive.|הדג עדיין חי.
aloud|בקול|d|The teacher read the story aloud.|המורה הקריאה את הסיפור בקול.
anymore|כבר לא|d|We don't live there anymore.|אנחנו כבר לא גרים שם.
apology|התנצלות|n|He wrote a short apology to his friend.|הוא כתב התנצלות קצרה לחבר שלו.
appointment|תור, פגישה|n|I have a dentist appointment on Monday.|יש לי תור לרופא שיניים ביום שני.
arrival|הגעה|n|We waited for the arrival of the train.|חיכינו להגעת הרכבת.
attention|תשומת לב|n|The children gave the story all their attention.|הילדים הקדישו לסיפור את כל תשומת הלב שלהם.
available|פנוי, זמין|a|Is this seat available?|המקום הזה פנוי?
bar|חטיף, מוט|n|I ate a chocolate bar.|אכלתי חטיף שוקולד.
barbecue|מנגל|n|We had a barbecue in the park.|עשינו מנגל בפארק.
battery|סוללה|n|My phone battery is empty.|הסוללה של הטלפון שלי ריקה.
behave|להתנהג|v|Please behave well in class.|בבקשה תתנהגו יפה בכיתה.
beside|ליד|o|Come and sit beside me.|בואי שבי לידי.
blow|לנשוף|v|Make a wish and blow out the candles.|תביעי משאלה ותכבי את הנרות.
boil|להרתיח|v|We boil water for tea.|אנחנו מרתיחים מים לתה.
boss|בוס, מנהל|n|My mom is the boss at her office.|אמא שלי היא המנהלת במשרד שלה.
boyfriend|חבר (בן זוג)|n|My big sister has a boyfriend.|לאחותי הגדולה יש חבר.
brain|מוח|n|Your brain needs sleep.|המוח שלך צריך שינה.
burn|לשרוף, לכוות|v|Be careful, the stove can burn you.|זהירות, הכיריים יכולות לכוות אותך.`,
`journey|מסע|n|The journey took two days.
passport|דרכון|n|Don't lose your passport.
luggage|מזוודות|n|Our luggage is at the airport.
airport|שדה תעופה|n|We arrived at the airport early.
flight|טיסה|n|Our flight leaves at noon.
station|תחנה|n|The train station is close.
bridge|גשר|n|We crossed the old bridge.
map|מפה|n|Look at the map.
guide|מדריך|n|Our guide told us a story.
tourist|תייר|n|A tourist asked me for directions.
abroad|בחו״ל|d|We travel abroad every summer.
weather|מזג אוויר|n|The weather is lovely today.
storm|סערה|n|The storm broke a big tree.
cloud|ענן|n|That cloud looks like a dog.
wind|רוח|n|The wind blew my hat away.
rain|גשם|n|The rain stopped at noon.
snow|שלג|n|The snow covered the road.
lightning|ברק|n|We saw lightning over the sea.
thunder|רעם|n|The thunder scared my dog.
season|עונה|n|Spring is my favorite season.
forest|יער|n|Bears live in the forest.
mountain|הר|n|We climbed the mountain.
valley|עמק|n|A river runs through the valley.
river|נהר|n|The river is very wide.
lake|אגם|n|We swam in the lake.
ocean|אוקיינוס|n|Whales live in the ocean.
island|אי|n|They live on a small island.
desert|מדבר|n|It rarely rains in the desert.
beach|חוף|n|We played on the beach.
sand|חול|n|The sand was very hot.
shell|צדף|n|I found a shell by the sea.
leaf|עלה|n|A yellow leaf fell on my head.
branch|ענף|n|The bird sat on a branch.
root|שורש|n|This root is very deep.
grass|דשא|n|The grass is wet.
insect|חרק|n|An insect landed on my arm.
butterfly|פרפר|n|A butterfly landed on the flower.
camel|גמל|n|We rode a camel in the desert.
danger|סכנה|n|There is danger in these waters.
adventure|הרפתקה|n|Our trip was a real adventure.
tent|אוהל|n|We slept in a tent.
wild|פראי|a|Wild animals live here.
deep|עמוק|a|The pool is very deep.
narrow|צר|a|This road is very narrow.
wide|רחב|a|The door is wide.
dangerous|מסוכן|a|This road is dangerous at night.
foreign|זר|a|She speaks a foreign language.
crowded|צפוף|a|The bus was very crowded.
empty|ריק|a|The room was empty.
far|רחוק|a|The city is far from here.
travel|לטייל|v|I love to travel by train.
arrive|להגיע|v|We will arrive at eight.
leave|לעזוב|v|We must leave right now.
cross|לחצות|v|Look before you cross the road.
climb|לטפס|v|Monkeys climb trees.
swim|לשחות|v|Can you swim?
follow|לעקוב אחרי|v|Follow me to the door.
pack|לארוז|v|I need to pack my bag.
explore|לחקור|v|Let's explore the cave.
grow|לגדול|v|Flowers grow fast in spring.
receive|לקבל|v|Did you receive my letter?
prepare|להכין|v|We prepare for the test together.
support|לתמוך|v|Good friends support each other.
describe|לתאר|v|Can you describe your new school?
fence|גדר|n|The cat jumped over the fence.
ladder|סולם|n|He climbed the ladder to the roof.
scissors|מספריים|n|Use the scissors to cut the paper.
envelope|מעטפה|n|Put the letter in the envelope.
nearby|בקרבת מקום|d|My aunt lives nearby, so we often visit.
receipt|קבלה|n|Keep the receipt in case the shoes are too small.
repair|לתקן|v|Dad can repair my broken bike.
forecast|תחזית|n|The forecast says it will rain tomorrow.
prevent|למנוע|v|Washing your hands can prevent illness.
translate|לתרגם|v|Can you translate this letter into Hebrew?
responsible|אחראי|a|She is responsible for feeding the dog.
sew|לתפור|v|My aunt can sew a button on a shirt.
parcel|חבילה|n|A parcel arrived for you this morning.
harvest|קציר|n|The farmers finished the wheat harvest in spring.
accompany|ללוות|v|My mom will accompany us on the trip.|אמא שלי תלווה אותנו בטיול.
adjust|לכוונן|v|You can adjust the seat to your height.|אפשר לכוונן את המושב לגובה שלך.
admit|להודות|v|He did not want to admit his mistake.|הוא לא רצה להודות בטעות שלו.
advertise|לפרסם|v|Companies advertise their products on TV.|חברות מפרסמות את המוצרים שלהן בטלוויזיה.
alter|לשנות|v|We had to alter our plans because of the rain.|היינו צריכים לשנות את התוכניות שלנו בגלל הגשם.
announce|להכריז|v|The principal will announce the winners tomorrow.|המנהלת תכריז מחר על הזוכים.
approximately|בערך|d|The trip takes approximately two hours.|הנסיעה נמשכת בערך שעתיים.
battle|קרב|n|The two armies fought a long battle.|שני הצבאות נלחמו בקרב ארוך.
beauty|יופי|n|We loved the beauty of the sea.|אהבנו את היופי של הים.
belief|אמונה|n|She has a strong belief in herself.|יש לה אמונה חזקה בעצמה.`,
`knight|אביר|n|The knight rode a white horse.
castle|טירה|n|The king lives in a castle.
sword|חרב|n|He pulled out his sword.
queen|מלכה|n|The queen wore a gold crown.
treasure|אוצר|n|They found a hidden treasure.
ghost|רוח רפאים|n|She saw a ghost in the mirror.
stranger|זר (אדם)|n|A stranger knocked on our door.
enemy|אויב|n|The two kings were each other's enemy.
hero|גיבור|n|The hero saved the whole town.
crowd|קהל|n|The crowd began to cheer.
shadow|צל|n|I saw a shadow on the wall.
silence|שקט מוחלט|n|There was a long silence.
noise|רעש|n|What was that noise?
smell|ריח|n|I love the smell of bread.
sound|צליל|n|We heard a strange sound.
escape|בריחה|n|Their escape was very clever.
clue|רמז|n|The detective found a clue.
mystery|תעלומה|n|The missing key is a mystery.
journal|יומן|n|She writes in her journal at night.
author|סופר|n|The author signed my book.
character|דמות|n|Who is your favorite character?
ending|סוף|n|The ending made me cry.
fear|פחד|n|He hid his fear.
courage|אומץ|n|It takes courage to tell the truth.
wisdom|חוכמה|n|The old woman was famous for her wisdom.
gentle|עדין|a|Be gentle with the baby.
fierce|עז|a|The fierce dog guards the gate.
ancient|עתיק|a|We visited an ancient temple.
huge|ענק|a|A huge wave hit the boat.
tiny|קטנטן|a|Look at that tiny bug!
strange|מוזר|a|What a strange idea!
magic|קסום|a|He has a magic ring.
hidden|חבוי|a|We found a hidden door.
broken|שבור|a|My phone screen is broken.
silent|שותק|a|The room went silent.
terrible|נורא|a|We had terrible weather.
wonderful|נפלא|a|What a wonderful surprise!
curious|סקרן|a|The curious cat opened the box.
clever|פיקח|a|That was a clever plan.
foolish|טיפשי|a|It was a foolish mistake.
gradually|בהדרגה|d|The sky gradually turned dark.
slowly|לאט|d|She slowly opened the door.
quickly|במהירות|d|He quickly ran away.
quietly|בשקט|d|They walked quietly past the door.
finally|לבסוף|d|We finally reached the top.
through|דרך|o|We walked through the forest.
toward|לעבר|o|She ran toward the gate.
against|נגד|o|We played against a good team.
legend|אגדה|n|The old legend is about a dragon.
hide|להתחבא|v|Let's hide behind the tree.
chase|לרדוף|v|Dogs love to chase cats.
catch|לתפוס|v|Try to catch the ball.
steal|לגנוב|v|They tried to steal the gold.
search|לחפש|v|We search for the key.
discover|לגלות|v|They discover a secret room.
destroy|להרוס|v|The fire could destroy the village.
protect|להגן|v|The wall will protect the city.
rescue|להציל|v|They came to rescue the sailors.
imagine|לדמיין|v|Imagine a world without rain.
disappear|להיעלם|v|The sun will disappear soon.`,
`opinion|דעה|n|What is your opinion?
reason|סיבה|n|Give me one good reason.
example|דוגמה|n|Can you give an example?
problem|בעיה|n|We can solve this problem.
solution|פתרון|n|She found a simple solution.
choice|בחירה|n|You made a good choice.
decision|החלטה|n|It was a hard decision.
idea|רעיון|n|That is a great idea!
difference|הבדל|n|What is the difference?
result|תוצאה|n|The result surprised us.
purpose|מטרה|n|What is the purpose of this meeting?
chance|הזדמנות|n|Give me one more chance.
experience|ניסיון|n|She has a lot of experience.
knowledge|ידע|n|Books give you knowledge.
ability|יכולת|n|He has the ability to learn fast.
success|הצלחה|n|Hard work leads to success.
failure|כישלון|n|One failure is not the end.
rule|כלל|n|Every game has a rule like this.
truth|אמת|n|Tell me the truth.
fact|עובדה|n|That is a fact.
rumor|שמועה|n|I heard a rumor about her.
attitude|גישה|n|She has a positive attitude.
respect|כבוד|n|Treat others with respect.
behavior|התנהגות|n|His behavior surprised everyone.
responsibility|אחריות|n|Feeding the dog is my responsibility.
necessary|הכרחי|a|Is it necessary to wait?
possible|אפשרי|a|Is it possible to fix it?
impossible|בלתי אפשרי|a|Nothing is impossible.
certain|בטוח|a|I am certain about this.
obvious|ברור מאליו|a|The answer is obvious.
useful|שימושי|a|This is a useful tool.
useless|חסר תועלת|a|This old map is useless.
fair|הוגן|a|That is not fair!
serious|רציני|a|This is a serious problem.
similar|דומה|a|Our bags are similar.
wrong|שגוי|a|That answer is wrong.
correct|נכון|a|Your spelling is correct.
popular|פופולרי|a|This game is very popular.
ordinary|רגיל|a|It was an ordinary day.
special|מיוחד|a|Today is a special day.
actually|בעצם|d|Actually, I like it.
probably|כנראה|d|He will probably come.
especially|במיוחד|d|I love fruit, especially mango.
however|עם זאת|d|It was late; however, we kept going.
therefore|לכן|d|It rained; therefore, we stayed home.
although|למרות ש|o|I went although I was tired.
unless|אלא אם כן|o|We will go unless it rains.
despite|למרות|o|We won despite the rain.
explain|להסביר|v|Can you explain this?
suggest|להציע|v|I suggest a short break.
decide|להחליט|v|We must decide today.
compare|להשוות|v|Compare these two pictures.
prefer|להעדיף|v|I prefer tea.
consider|לשקול|v|Please consider my offer.
improve|לשפר|v|I want to improve my English.
prove|להוכיח|v|Can you prove it?
convince|לשכנע|v|You can't convince me.
realize|להבין פתאום|v|I realize that I was wrong.
recognize|לזהות|v|I did not recognize him.
expect|לצפות|v|I expect a good grade.`,
`science|מדע|n|Science explains how things work.
experiment|ניסוי|n|We did an experiment with water.
research|מחקר|n|Her research is about whales.
scientist|מדען|n|A scientist studies the stars.
planet|כוכב לכת|n|Mars is a red planet.
energy|אנרגיה|n|Solar energy comes from the sun.
pollution|זיהום|n|Pollution harms the sea.
environment|סביבה|n|We must protect the environment.
climate|אקלים|n|The climate is changing.
disease|מחלה|n|This disease spreads quickly.
vaccine|חיסון|n|The vaccine protects children.
government|ממשלה|n|The government made a new law.
election|בחירות|n|The election is in November.
law|חוק|n|Everyone must obey the law.
society|חברה (ציבור)|n|Society needs good teachers.
population|אוכלוסייה|n|The city's population is growing.
culture|תרבות|n|I love learning about Thai culture.
tradition|מסורת|n|It is a family tradition.
religion|דת|n|We studied religion in class.
history|היסטוריה|n|History is my best subject.
century|מאה (שנים)|n|This house is a century old.
generation|דור|n|Each generation learns something new.
technology|טכנולוגיה|n|Technology changes fast.
device|מכשיר|n|This device measures heat.
machine|מכונה|n|The machine makes coffee.
engine|מנוע|n|The engine is very loud.
invention|המצאה|n|The phone was a great invention.
factory|מפעל|n|The factory makes toys.
industry|תעשייה|n|The car industry is huge.
economy|כלכלה|n|Tourism helps the economy.
company|חברה (עסק)|n|My aunt runs a small company.
salary|משכורת|n|He earns a good salary.
article|כתבה|n|I read an article about bees.
journalist|עיתונאי|n|The journalist asked hard questions.
audience|קהל צופים|n|The audience clapped loudly.
survey|סקר|n|We filled out a survey.
amount|כמות|n|That is a huge amount of sugar.
average|ממוצע|n|My average went up.
percent|אחוז|n|Ten percent of us were absent.
global|עולמי|a|This is a global problem.
local|מקומי|a|We buy from a local farm.
modern|מודרני|a|They live in a modern building.
natural|טבעי|a|This juice is natural.
public|ציבורי|a|This is a public park.
private|פרטי|a|This is a private beach.
powerful|עוצמתי|a|This is a powerful computer.
rapid|מהיר|a|The town saw rapid growth.
rare|נדיר|a|This is a rare bird.
measure|למדוד|v|We measure the room.
invent|להמציא|v|Who did invent the telephone?
develop|לפתח|v|They develop new games.
produce|לייצר|v|Bees produce honey.
increase|להגדיל|v|We need to increase our speed.
reduce|להפחית|v|We must reduce waste.
recycle|למחזר|v|We recycle paper and glass.
vote|להצביע|v|Adults can vote in the election.
predict|לחזות|v|Nobody can predict the future.
affect|להשפיע על|v|Sleep can affect your mood.
depend|להיות תלוי|v|Plants depend on the sun.
survive|לשרוד|v|Few animals survive here.`,
`achievement|הישג|n|Winning the prize was a big achievement.
advantage|יתרון|n|Being tall is an advantage in basketball.
disadvantage|חיסרון|n|The only disadvantage is the price.
challenge|אתגר|n|Learning piano is a real challenge.
consequence|השלכה|n|Every choice has a consequence.
conscience|מצפון|n|My conscience told me to return it.
curiosity|סקרנות|n|Curiosity drives every scientist.
determination|נחישות|n|Her determination helped her win.
embarrassment|מבוכה|n|His face went red with embarrassment.
encouragement|עידוד|n|A little encouragement goes a long way.
independence|עצמאות|n|Teens want more independence.
influence|השפעה|n|Friends have a big influence on us.
opportunity|הזדמנות פז|n|This is a great opportunity.
perspective|נקודת מבט|n|Try to see it from her perspective.
prejudice|דעה קדומה|n|Prejudice hurts people.
privilege|זכות יתר|n|It is a privilege to be here.
recommendation|המלצה|n|Thanks for the book recommendation.
sacrifice|הקרבה|n|Parents often make a sacrifice for their kids.
strategy|אסטרטגיה|n|We need a better strategy.
tendency|נטייה|n|He has a tendency to arrive late.
accurate|מדויק|a|This clock is very accurate.
anxious|חרד|a|She felt anxious before the show.
awkward|מביך|a|There was an awkward silence.
capable|מסוגל|a|You are capable of great things.
confident|בטוח בעצמו|a|She looks confident on stage.
conscious|מודע|a|He is conscious of his mistakes.
convenient|נוח|a|This bus is very convenient.
definite|מוחלט|a|We need a definite answer.
enthusiastic|נלהב|a|The kids were enthusiastic about the trip.
essential|חיוני|a|Water is essential for life.
generous|נדיב|a|She is a generous friend.
independent|עצמאי|a|She is an independent thinker.
inevitable|בלתי נמנע|a|Change is inevitable.
reliable|אמין|a|He is a reliable friend.
stubborn|עקשן|a|My stubborn brother never gives up.
sufficient|מספק|a|One cup is sufficient.
unique|ייחודי|a|Every snowflake is unique.
vulnerable|פגיע|a|Baby birds are vulnerable.
absolutely|בהחלט|d|You are absolutely right.
definitely|בוודאות|d|I will definitely be there.
eventually|בסופו של דבר|d|We eventually found the way.
immediately|מיד|d|Call me immediately.
occasionally|לפעמים|d|We occasionally eat out.
unfortunately|לצערי|d|Unfortunately, the shop was closed.
accomplish|להשיג|v|You can accomplish a lot in a year.
acknowledge|להודות ב|v|You must acknowledge your mistake.
appreciate|להעריך|v|I appreciate your help.
assume|להניח|v|Don't assume I know.
avoid|להימנע|v|Try to avoid sugar.
concentrate|להתרכז|v|I can't concentrate with this noise.
criticize|למתוח ביקורת|v|Don't criticize her work.
emphasize|להדגיש|v|Teachers emphasize good habits.
exaggerate|להגזים|v|Don't exaggerate the story.
hesitate|להסס|v|Don't hesitate to ask.
interrupt|להפריע|v|Please don't interrupt me.
overcome|להתגבר|v|We can overcome this fear.
persuade|לשכנע בטיעונים|v|Try to persuade your parents.
pronounce|להגות|v|How do you pronounce this word?
recommend|להמליץ|v|I recommend this book.
succeed|להצליח|v|I know you will succeed.`,
`analyze|לנתח|v|Scientists analyze the data carefully.
conclude|להסיק|v|We can conclude that the plan worked.
contrast|ניגוד|n|There is a sharp contrast between the two cities.
define|להגדיר|v|Can you define this term?
demonstrate|להדגים|v|The teacher will demonstrate the experiment.
evaluate|לשקול ולהעריך|v|We must evaluate every option.
evidence|ראיה|n|There is no evidence against him.
assumption|הנחה|n|That assumption turned out to be wrong.
illustrate|להמחיש|v|These pictures illustrate the idea.
indicate|להצביע על|v|The dark clouds indicate a storm.
interpret|לפרש|v|People interpret the poem differently.
justify|להצדיק|v|Nothing can justify such behavior.
outline|מתווה|n|Write an outline before the essay.
summarize|לסכם|v|Please summarize the article in two lines.
argument|טיעון|n|Her argument was very clear.
paragraph|פסקה|n|The first paragraph is too long.
essay|חיבור|n|I wrote an essay about the sea.
source|מקור|n|Check the source of this story.
criticism|ביקורת|n|He did not take the criticism well.
approach|דרך פעולה|n|We need a new approach to this problem.
aspect|היבט|n|Money is only one aspect of the job.
concept|מושג|n|Gravity is a difficult concept.
context|הקשר|n|The word changes with the context.
factor|גורם|n|Sleep is an important factor in health.
issue|סוגיה|n|Pollution is a serious issue.
method|שיטה|n|This method saves a lot of time.
principle|עיקרון|n|Honesty is my main principle.
theory|תיאוריה|n|Nobody could prove the theory.
significant|משמעותי|a|This is a significant change.
relevant|רלוונטי|a|Your question is very relevant.
complex|מורכב|a|The human brain is complex.
consistent|עקבי|a|Be consistent and practice daily.
logical|הגיוני|a|That is a logical next step.
vague|מעורפל|a|His directions were vague.
valid|תקף|a|Your ticket is still valid.
moreover|יתרה מזאת|d|It is cheap; moreover, it works well.
nevertheless|אף על פי כן|d|She was tired; nevertheless, she finished.
whereas|בעוד ש|d|He likes tea, whereas I prefer coffee.
furthermore|נוסף על כך|d|The hotel is clean; furthermore, it is quiet.
consequently|כתוצאה מכך|d|He missed the bus and consequently came late.
roughly|בערך|d|The trip takes roughly two hours.
mainly|בעיקר|d|The team is mainly young players.
briefly|בקצרה|d|Let me explain it briefly.
contribute|לתרום|v|Everyone can contribute an idea.
establish|לבסס|v|They want to establish clear rules.
identify|לאתר ולזהות|v|Can you identify this bird?
involve|לערב|v|The game will involve the whole class.
maintain|לשמור על|v|It is hard to maintain this speed.
obtain|לקבל, להשיג|v|You must obtain permission first.
occur|להתרחש|v|Accidents occur on this road.
require|לדרוש|v|Good photos require patience.
respond|להגיב|v|She did not respond to my message.
assess|להעריך מצב|v|The doctor will assess the injury.
clarify|להבהיר|v|Could you clarify your question?`,
`performance|הופעה|n|Her performance moved everyone.
rehearsal|חזרה (להצגה)|n|The rehearsal starts at five.
stage|במה|n|He walked nervously onto the stage.
script|תסריט|n|The actor forgot the script.
director|במאי|n|The director shouted, "Cut!"
masterpiece|יצירת מופת|n|This painting is a masterpiece.
exhibition|תערוכה|n|We saw an exhibition of old photos.
sculpture|פסל|n|The sculpture stands in the garden.
novel|רומן|n|I could not put the novel down.
biography|ביוגרפיה|n|She read a biography of Einstein.
plot|עלילה|n|The plot has a surprising ending.
custom|מנהג|n|Every country has its own custom.
heritage|מורשת|n|We are proud of our heritage.
ceremony|טקס|n|The ceremony ended with a song.
identity|זהות|n|Language is part of our identity.
reputation|מוניטין|n|The school has a good reputation.
headline|כותרת|n|The headline shocked the readers.
interview|ראיון|n|The interview lasted an hour.
broadcast|שידור|n|We watched the live broadcast.
advertisement|פרסומת|n|That advertisement is really annoying.
gossip|רכילות|n|I try to stay away from gossip.
ambitious|שאפתן|a|She is ambitious and works hard.
humble|צנוע|a|He stayed humble after the win.
sensitive|רגיש|a|She is sensitive to loud noise.
cautious|זהיר|a|Be cautious on the wet road.
embarrassed|נבוך|a|I felt embarrassed by my mistake.
exhausted|מותש|a|We were exhausted after the climb.
frustrated|מתוסכל|a|He got frustrated with the puzzle.
grateful|אסיר תודה|a|I am grateful for your help.
jealous|מקנא|a|She was jealous of her sister.
overwhelmed|מוצף|a|I feel overwhelmed by all this homework.
relieved|חש הקלה|a|We were relieved to hear the news.
encourage|לעודד|v|Good teachers encourage their students.
admire|להעריץ|v|I admire your courage.
complain|להתלונן|v|Customers often complain about the price.
insist|להתעקש|v|They insist on paying.
negotiate|לנהל משא ומתן|v|They had to negotiate a better price.
mention|להזכיר|v|Did she mention the party?
pretend|להעמיד פנים|v|He likes to pretend he is asleep.
reveal|לחשוף|v|The final scene will reveal the truth.
compliment|מחמאה|n|That was a lovely compliment.
conversation|שיחה|n|We had a long conversation.
misunderstanding|אי הבנה|n|It was just a misunderstanding.`,
`drought|בצורת|n|The drought killed the crops.
earthquake|רעידת אדמה|n|The earthquake woke the whole city.
flood|שיטפון|n|The flood destroyed the bridge.
resource|משאב|n|Water is a precious resource.
extinct|נכחד|a|Dinosaurs have been extinct for millions of years.
endangered|בסכנת הכחדה|a|The tiger is an endangered animal.
renewable|מתחדש|a|Wind is a renewable source of energy.
sustainable|בר קיימא|a|We need a sustainable way of life.
agriculture|חקלאות|n|Agriculture needs a lot of water.
community|קהילה|n|Our community built a new park.
democracy|דמוקרטיה|n|In a democracy people can vote.
parliament|פרלמנט|n|The parliament will meet tomorrow.
citizen|אזרח|n|Every citizen has a duty to vote.
president|נשיא|n|The president gave a speech.
minister|שר|n|The minister answered the question.
policy|מדיניות|n|The school changed its policy on phones.
budget|תקציב|n|We have a small budget for the trip.
poverty|עוני|n|Many families live in poverty.
wealth|עושר|n|Wealth does not buy happiness.
inequality|אי שוויון|n|The report shows growing inequality.
justice|צדק|n|They marched for justice.
freedom|חופש|n|Freedom is worth fighting for.
protest|מחאה|n|Thousands joined the protest.
treaty|הסכם בין מדינות|n|The two nations signed a treaty.
border|גבול|n|We crossed the border at night.
empire|אימפריה|n|The Roman empire was huge.
colony|מושבה|n|It was once a British colony.
medieval|מימי הביניים|a|The town has a medieval castle.
revolution|מהפכה|n|The revolution changed the country.
civilization|ציוויליזציה|n|Egypt had a great civilization.
ancestor|אב קדמון|n|My ancestor came from Spain.
archaeology|ארכאולוגיה|n|She wants to study archaeology.
immigrant|מהגר|n|His father was an immigrant.
refugee|פליט|n|The refugee found a safe home.
conflict|סכסוך|n|The conflict lasted many years.
peace|שלום|n|Everyone hopes for peace.
crisis|משבר|n|The crisis forced many shops to close.
disaster|אסון|n|The fire was a terrible disaster.
impact|השפעה ניכרת|n|The film had a huge impact.
trend|מגמה|n|The trend is moving upward.
statistics|סטטיסטיקה|n|The statistics surprised everyone.
majority|רוב|n|The majority voted yes.
minority|מיעוט|n|Only a minority agreed.
urban|עירוני|a|Urban life can be noisy.
rural|כפרי|a|She grew up in a rural area.
abolish|לבטל (חוק)|v|They voted to abolish the rule.
conquer|לכבוש|v|The army tried to conquer the city.
migrate|לנדוד|v|Birds migrate south in winter.
preserve|לשמר|v|We must preserve these old buildings.`,
`abandon|לנטוש|v|They had to abandon the ship.
absurd|אבסורדי|a|What an absurd idea!
abundant|בשפע|a|Fish are abundant in this lake.
accumulate|להצטבר|v|Dust will accumulate under the bed.
adequate|מספיק לצורך|a|The room has adequate light.
adversity|מצוקה|n|She showed courage in adversity.
ambiguous|דו משמעי|a|His reply was ambiguous.
anticipate|לצפות מראש|v|We did not anticipate this delay.
apparent|נראה לעין|a|The problem became apparent quickly.
arbitrary|שרירותי|a|The decision seemed arbitrary.
astonishing|מדהים|a|The view from the top was astonishing.
authentic|אותנטי|a|This is an authentic Italian recipe.
bewildered|מבולבל לגמרי|a|He looked bewildered by the question.
bizarre|מוזר מאוד|a|What a bizarre dream!
blunt|בוטה|a|Sorry to be blunt about it.
compassion|חמלה|n|She treated him with compassion.
comprehend|לתפוס (להבין)|v|I cannot comprehend this math.
conceal|להסתיר|v|He tried to conceal his fear.
controversial|שנוי במחלוקת|a|The new law is controversial.
convey|להעביר (מסר)|v|Music can convey strong feelings.
crucial|מכריע|a|This is a crucial moment.
deceive|להונות|v|Don't try to deceive me.
deliberate|מכוון|a|It was a deliberate choice.
despair|ייאוש|n|He sat down in despair.
devastating|הרסני|a|The storm was devastating.
dilemma|דילמה|n|I face a real dilemma.
diminish|להצטמצם|v|The pain will diminish with time.
distinct|מובחן|a|There are two distinct groups.
elaborate|מפורט ומורכב|a|They made an elaborate plan.
eloquent|רהוט|a|She gave an eloquent speech.
elusive|חמקמק|a|Success remained elusive.
endure|לעמוד ב (סבל)|v|They had to endure the long winter.
enormous|עצום|a|An enormous wave hit the boat.
evident|ברור|a|Her joy was evident to all.
exceed|לעלות על|v|Costs may exceed the budget.
fragile|שביר|a|Be careful, the glass is fragile.
futile|חסר תוחלת|a|Our efforts proved futile.
genuine|אמיתי|a|Her smile looked genuine.
hostile|עוין|a|The crowd became hostile.
immense|עצום בגודלו|a|The castle is immense.
ingenious|גאוני|a|What an ingenious solution!
integrity|יושרה|n|He is a man of integrity.
intricate|מסובך ומפורט|a|The clock has an intricate design.
irony|אירוניה|n|The irony of the story made us laugh.
legitimate|לגיטימי|a|That is a legitimate question.
meticulous|קפדני|a|He is meticulous about details.
notorious|ידוע לשמצה|a|The road is notorious for accidents.
obstacle|מכשול|n|Fear is the biggest obstacle.
ominous|מבשר רעות|a|We heard an ominous sound.
paradox|פרדוקס|n|It is a strange paradox.
persistent|עיקש|a|She is a persistent student.
plausible|סביר ומתקבל|a|That sounds like a plausible story.
profound|עמוק ומשמעותי|a|The book had a profound effect on me.
reluctant|מסרב בלב כבד|a|He was reluctant to leave.
resilient|חסין ומתאושש|a|Children are often resilient.
scarce|נדיר ומועט|a|Food was scarce that winter.
skeptical|ספקן|a|I am skeptical about this plan.
subtle|מעודן|a|There is a subtle difference.
tedious|מייגע|a|Copying the list was tedious.
thrive|לשגשג|v|These plants thrive in the sun.
trivial|זניח|a|It was a trivial mistake.
ubiquitous|נמצא בכל מקום|a|Phones are ubiquitous today.
unprecedented|חסר תקדים|a|This was an unprecedented event.
vivid|חי וצבעוני|a|I have a vivid memory of that day.`,
];

const seen = new Set<string>();
const EN_WORDS: Word[] = RAW.flatMap((block, level) =>
  block.split('\n').map((line, i) => {
    const [en, he, pos, ex, exHe] = line.split('|');
    let id = en;
    if (seen.has(id)) id = `${en}-${level}`;
    seen.add(id);
    return { id, en, he, pos: pos as Pos, ex, level, order: level * 1000 + i, ...(exHe ? { exHe } : {}) };
  }),
);
export const LEVELS = IS_THAI ? THAI_LEVELS : EN_LEVELS;
export const WORDS: Word[] = IS_THAI ? THAI_WORDS : EN_WORDS;
export const WORD: Record<string, Word> = Object.fromEntries(WORDS.map((w) => [w.id, w]));
