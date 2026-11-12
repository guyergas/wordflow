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
milk|חלב|n|I drink milk every morning.|אני שותה חלב כל בוקר.
mom|אמא|n|My mom makes the best pancakes.|אמא שלי מכינה את הפנקייקים הכי טובים.
no|לא, אין|o|There is no milk in the fridge.|אין חלב במקרר.
not|לא|o|I am not afraid of the dark.|אני לא מפחד מהחושך.
on|על|o|The cat is sleeping on the bed.|החתול ישן על המיטה.
pen|עט|n|Write your name with a pen.|כתבי את השם שלך בעט.
pet|חיית מחמד|n|A dog is a good pet.|כלב הוא חיית מחמד טובה.
red|אדום|a|I have a red ball.|יש לי כדור אדום.
sit|לשבת|v|Please sit next to me.|בבקשה שבי לידי.
six|שש|n|My little brother is six years old.|אחי הקטן בן שש.
so|כל כך|d|I am so happy today!|אני כל כך שמח היום!
stand|לעמוד|v|We stand in a line.|אנחנו עומדים בשורה.
stop|לעצור|v|Please stop at the red light.|בבקשה תעצרו ברמזור האדום.
sun|שמש|n|The sun is very bright today.|השמש בהירה מאוד היום.
talk|לדבר|v|I like to talk with my grandma.|אני אוהבת לדבר עם סבתא שלי.
ten|עשר|n|I have ten fingers.|יש לי עשר אצבעות.
that|ההוא, ההיא|o|I want that red ball.|אני רוצה את הכדור האדום ההוא.
their|שלהם|o|I like their little dog.|אני אוהב את הכלב הקטן שלהם.
them|אותם|o|I see them in the park every day.|אני רואה אותם בפארק כל יום.
then|אחר כך|d|We eat lunch and then we play.|אנחנו אוכלים ארוחת צהריים ואחר כך משחקים.
they|הם, הן|o|My friends say they are hungry.|החברים שלי אומרים שהם רעבים.
this|זה, זאת|o|I love this song.|אני אוהבת את השיר הזה.
three|שלוש|n|I have three pencils in my bag.|יש לי שלושה עפרונות בתיק.
to|אל, ל-|o|We go to the park after school.|אנחנו הולכים לפארק אחרי בית הספר.
top|ראש, חלק עליון|n|The cat is on the top of the tree.|החתול בראש העץ.
up|למעלה|d|Look up at the sky!|תסתכלו למעלה לשמיים!
us|אותנו, לנו|o|Mom takes us to school.|אמא לוקחת אותנו לבית הספר.
yes|כן|o|I said yes to the party.|אמרתי כן למסיבה.
you|אתה, את|o|Can you help me, please?|אתה יכול לעזור לי, בבקשה?
about|על, בערך|o|This story is about a little fox.|הסיפור הזה הוא על שועל קטן.
above|מעל|o|The bird is flying above the house.|הציפור עפה מעל הבית.
afternoon|אחר הצהריים|n|We play in the park in the afternoon.|אנחנו משחקים בפארק אחר הצהריים.
again|שוב|d|Please read the story again.|בבקשה תקרא את הסיפור שוב.
air|אוויר|n|Open the window to let in fresh air.|תפתח את החלון כדי להכניס אוויר צח.
also|גם|d|I like dogs, and I also like cats.|אני אוהב כלבים, ואני גם אוהב חתולים.
animal|חיה|n|My favorite animal is the lion.|החיה האהובה עליי היא האריה.
another|עוד, אחר|o|Can I have another cookie?|אפשר לקבל עוד עוגייה?
any|קצת, כלשהו|o|Is there any milk left?|נשאר קצת חלב?
anyone|מישהו, כל אחד|o|Is anyone at home?|יש מישהו בבית?
anything|משהו|o|Do you want anything to eat?|אתה רוצה משהו לאכול?
arm|זרוע, יד|n|I hurt my arm when I fell.|נפגעתי ביד כשנפלתי.
art|אמנות|n|We paint pictures in art class.|אנחנו מציירים ציורים בשיעור אמנות.
baby|תינוק|n|The baby is sleeping in her bed.|התינוקת ישנה במיטה שלה.
back|גב|n|I carry my bag on my back.|אני סוחב את התיק שלי על הגב.
ball|כדור|n|Throw the ball to me!|תזרוק לי את הכדור!
bath|אמבטיה|n|I take a bath before bed.|אני מתרחץ באמבטיה לפני השינה.
behind|מאחורי|o|The cat is hiding behind the door.|החתול מתחבא מאחורי הדלת.
bird|ציפור|n|A little bird is singing in the tree.|ציפור קטנה שרה על העץ.
black|שחור|a|My dog is black and white.|הכלב שלי שחור-לבן.
blue|כחול|a|The sky is blue today.|השמיים כחולים היום.
boat|סירה|n|We sailed in a small boat on the lake.|שטנו בסירה קטנה באגם.
body|גוף|n|Running is good for your body.|ריצה טובה לגוף שלך.
book|ספר|n|I read a book before I go to sleep.|אני קורא ספר לפני שאני הולך לישון.
bottle|בקבוק|n|I take a bottle of water to school.|אני לוקח בקבוק מים לבית הספר.
breakfast|ארוחת בוקר|n|I eat eggs for breakfast.|אני אוכל ביצים לארוחת בוקר.
bring|להביא|v|Please bring your pencils tomorrow.|בבקשה תביאו מחר את העפרונות שלכם.
brown|חום|a|My teddy bear is brown.|הדובי שלי חום.
butter|חמאה|n|I put butter on my bread.|אני מורח חמאה על הלחם שלי.
bye|ביי, להתראות|o|Bye, see you tomorrow!|ביי, נתראה מחר!
cake|עוגה|n|Grandma made a chocolate cake for my birthday.|סבתא הכינה עוגת שוקולד ליום ההולדת שלי.
car|מכונית|n|Dad drives a red car.|אבא נוהג במכונית אדומה.
chicken|עוף, תרנגולת|n|We have chicken and rice for dinner.|יש לנו עוף ואורז לארוחת ערב.
child|ילד|n|The child is playing in the sand.|הילד משחק בחול.
chocolate|שוקולד|n|Can I have a piece of chocolate?|אפשר לקבל חתיכת שוקולד?
city|עיר|n|Tel Aviv is a big city.|תל אביב היא עיר גדולה.
class|כיתה, שיעור|n|There are thirty children in my class.|יש שלושים ילדים בכיתה שלי.
clock|שעון|n|The clock on the wall is slow.|השעון על הקיר מאחר.
clothes|בגדים|n|I put my clothes in the closet.|אני שם את הבגדים שלי בארון.
coat|מעיל|n|It is cold, so wear your coat.|קר, אז תלבש את המעיל שלך.
coffee|קפה|n|Mom drinks coffee every morning.|אמא שותה קפה כל בוקר.
come|לבוא|v|Please come to my party.|בבקשה תבוא למסיבה שלי.
computer|מחשב|n|I play games on the computer.|אני משחק משחקים במחשב.
cook|לבשל|v|Dad likes to cook pasta.|אבא אוהב לבשל פסטה.
cow|פרה|n|The cow gives us milk.|הפרה נותנת לנו חלב.
daddy|אבא|n|My daddy reads me a story every night.|אבא שלי מקריא לי סיפור כל לילה.
dark|חשוך, כהה|a|It is dark outside at night.|בלילה חשוך בחוץ.
day|יום|n|Today is a sunny day.|היום יום שמשי.
dinner|ארוחת ערב|n|We eat dinner at seven.|אנחנו אוכלים ארוחת ערב בשבע.
down|למטה|d|The cat jumped down from the table.|החתול קפץ למטה מהשולחן.
draw|לצייר|v|I like to draw cats.|אני אוהב לצייר חתולים.
dress|שמלה|n|She wears a pink dress.|היא לובשת שמלה ורודה.
dry|יבש|a|My towel is dry.|המגבת שלי יבשה.
ear|אוזן|n|The dog has one black ear.|לכלב יש אוזן שחורה אחת.
eight|שמונה|n|A spider has eight legs.|לעכביש יש שמונה רגליים.
eleven|אחת עשרה|n|My sister is eleven years old.|אחותי בת אחת עשרה.
evening|ערב|n|We read a story in the evening.|אנחנו קוראים סיפור בערב.
eye|עין|n|I have something in my eye.|יש לי משהו בעין.
face|פנים|n|Wash your face before bed.|תשטוף את הפנים לפני השינה.
farm|חווה|n|There are cows on the farm.|יש פרות בחווה.
fifteen|חמש עשרה|n|There are fifteen kids in my class.|יש חמישה עשר ילדים בכיתה שלי.
finger|אצבע|n|I cut my finger.|חתכתי את האצבע.
fish|דג|n|The fish swims in the water.|הדג שוחה במים.
five|חמש|n|I have five pencils.|יש לי חמישה עפרונות.
floor|רצפה|n|The ball is on the floor.|הכדור על הרצפה.
flower|פרח|n|I gave Mom a red flower.|נתתי לאמא פרח אדום.
fly|לעוף|v|Birds can fly high.|ציפורים יכולות לעוף גבוה.
foot|כף רגל|n|My left foot hurts.|כף הרגל השמאלית שלי כואבת.
four|ארבע|n|A dog has four legs.|לכלב יש ארבע רגליים.
fruit|פרי|n|An apple is a fruit.|תפוח הוא פרי.
girl|ילדה|n|The girl has long hair.|לילדה יש שיער ארוך.
glass|כוס זכוכית, זכוכית|n|Can I have a glass of water?|אפשר לקבל כוס מים?
good|טוב|a|This cake is very good.|העוגה הזאת טובה מאוד.
grandfather|סבא|n|My grandfather tells funny stories.|סבא שלי מספר סיפורים מצחיקים.
grandmother|סבתא|n|My grandmother bakes cookies for us.|סבתא שלי אופה לנו עוגיות.
gray|אפור|a|The elephant is gray.|הפיל אפור.
green|ירוק|a|The grass is green.|הדשא ירוק.
hair|שיער|n|She has long black hair.|יש לה שיער שחור וארוך.
head|ראש|n|I put a hat on my head.|שמתי כובע על הראש.
hear|לשמוע|v|I can hear the birds.|אני שומע את הציפורים.
heart|לב|n|My heart beats fast when I run.|הלב שלי דופק מהר כשאני רץ.
here|כאן|d|Come here, please.|בוא לכאן, בבקשה.
his|שלו|o|This is his bike.|אלה האופניים שלו.
hers|שלה|o|The red bag is hers.|התיק האדום הוא שלה.
hi|היי, שלום|o|Hi, my name is Dan.|היי, קוראים לי דן.
hold|להחזיק|v|Hold my hand, please.|תחזיק לי את היד, בבקשה.
home|בית, הביתה|n|I go home after school.|אני הולך הביתה אחרי בית הספר.
horse|סוס|n|The horse runs fast.|הסוס רץ מהר.
how|איך|o|How do you make a cake?|איך מכינים עוגה?
husband|בעל|n|Her husband is a doctor.|בעלה הוא רופא.
inside|בפנים|d|It is cold, so we play inside.|קר, אז אנחנו משחקים בפנים.
juice|מיץ|n|I drink orange juice every morning.|אני שותה מיץ תפוזים כל בוקר.
keep|לשמור|v|Can I keep this drawing?|אפשר לשמור את הציור הזה?
king|מלך|n|The king lives in a big castle.|המלך גר בטירה גדולה.
know|לדעת, להכיר|v|I know the answer.|אני יודע את התשובה.
leg|רגל|n|The dog hurt its leg.|הכלב נפגע ברגל.
letter|מכתב, אות|n|I wrote a letter to my grandma.|כתבתי מכתב לסבתא שלי.
light|אור|n|Please turn on the light.|בבקשה תדליק את האור.
like|לאהוב, לחבב|v|I like ice cream.|אני אוהב גלידה.
little|קטן|a|We have a little dog.|יש לנו כלב קטן.
look|להסתכל|v|Look at the bird!|תסתכל על הציפור!
lunch|ארוחת צהריים|n|We eat lunch at school.|אנחנו אוכלים ארוחת צהריים בבית הספר.
make|להכין, לעשות|v|Let's make a cake.|בואו נכין עוגה.
many|הרבה|a|There are many birds in the tree.|יש הרבה ציפורים על העץ.
monkey|קוף|n|The monkey is eating a banana.|הקוף אוכל בננה.
more|עוד, יותר|d|Can I have more water, please?|אפשר עוד מים, בבקשה?
mouth|פה|n|Open your mouth, please.|תפתח את הפה, בבקשה.
movie|סרט|n|We watched a funny movie.|צפינו בסרט מצחיק.
my|שלי|o|This is my dog.|זה הכלב שלי.
name|שם|n|Her name is Noa.|השם שלה הוא נועה.
neck|צוואר|n|The giraffe has a long neck.|לג'ירפה יש צוואר ארוך.
need|להיות צריך|v|I need a new pencil.|אני צריך עיפרון חדש.
nice|נחמד|a|She is a nice girl.|היא ילדה נחמדה.
nine|תשע|n|My little brother is nine years old.|אחי הקטן בן תשע.
now|עכשיו|d|Let's go home now.|בואו נלך הביתה עכשיו.
one|אחד, אחת|n|I have one sister.|יש לי אחות אחת.
or|או|o|Do you want tea or juice?|אתה רוצה תה או מיץ?
orange|תפוז, כתום|n|I eat an orange every morning.|אני אוכל תפוז כל בוקר.
our|שלנו|o|This is our house.|זה הבית שלנו.
out|החוצה, בחוץ|d|The kids went out to play.|הילדים יצאו החוצה לשחק.
nose|אף|n|The clown has a red nose.|לליצן יש אף אדום.
paper|נייר|n|I need a piece of paper.|אני צריך דף נייר.
park|פארק, גן ציבורי|n|We play in the park after school.|אנחנו משחקים בפארק אחרי בית הספר.
people|אנשים|n|There are many people at the beach.|יש הרבה אנשים בחוף.
picture|תמונה, ציור|n|Look at this picture of a cat.|תסתכל על התמונה הזאת של חתול.
pink|ורוד|a|She has a pink dress.|יש לה שמלה ורודה.
pizza|פיצה|n|We eat pizza on Friday.|אנחנו אוכלים פיצה ביום שישי.
play|לשחק|v|The children play in the yard.|הילדים משחקים בחצר.
please|בבקשה|o|Can you help me, please?|אתה יכול לעזור לי, בבקשה?
potato|תפוח אדמה|n|Mom cut a potato for the soup.|אמא חתכה תפוח אדמה למרק.
radio|רדיו|n|Grandpa listens to the radio.|סבא מקשיב לרדיו.
rice|אורז|n|We eat rice with chicken.|אנחנו אוכלים אורז עם עוף.
road|כביש, דרך|n|Look both ways before you cross the road.|תסתכל לשני הצדדים לפני שאתה חוצה את הכביש.
room|חדר|n|My room is very small.|החדר שלי קטן מאוד.
salad|סלט|n|I made a salad for lunch.|הכנתי סלט לארוחת צהריים.
salt|מלח|n|Please pass me the salt.|בבקשה תעביר לי את המלח.
sandwich|כריך|n|I have a cheese sandwich for lunch.|יש לי כריך גבינה לארוחת צהריים.
sea|ים|n|We swim in the sea in summer.|אנחנו שוחים בים בקיץ.
see|לראות|v|I can see a bird in the tree.|אני יכול לראות ציפור על העץ.
seven|שבע, שבעה|n|My brother is seven years old.|אחי בן שבע.
she|היא|o|She is my little sister.|היא אחותי הקטנה.
sheep|כבשה|n|The sheep eats green grass.|הכבשה אוכלת דשא ירוק.
shoe|נעל|n|I lost my left shoe.|איבדתי את הנעל השמאלית שלי.
show|להראות|v|Show me your new bag.|תראה לי את התיק החדש שלך.
sky|שמיים|n|The sky is blue today.|השמיים כחולים היום.
slow|איטי|a|The turtle is very slow.|הצב איטי מאוד.
some|קצת, כמה|o|I want some milk.|אני רוצה קצת חלב.
son|בן|n|Their son is five years old.|הבן שלהם בן חמש.
song|שיר, מנגינה|n|We sang a happy song.|שרנו שיר שמח.
soon|בקרוב|d|Dinner will be ready soon.|ארוחת הערב תהיה מוכנה בקרוב.
sorry|מצטער|a|I am sorry I was late.|אני מצטער שאיחרתי.
start|להתחיל, לפתוח|v|Let's start the game!|בואו נתחיל את המשחק!
story|סיפור|n|Mom reads me a story at night.|אמא מקריאה לי סיפור בלילה.
sugar|סוכר|n|I don't put sugar in my tea.|אני לא שם סוכר בתה שלי.
summer|קיץ|n|We go to the beach in summer.|אנחנו הולכים לים בקיץ.
sunny|שמשי|a|It is a sunny day.|זה יום שמשי.
tea|תה|n|Grandma drinks hot tea.|סבתא שותה תה חם.
there|שם|d|Put the box over there.|שים את הקופסה שם.
these|אלה, האלה|o|These shoes are new.|הנעליים האלה חדשות.
thin|דק, רזה|a|This book is very thin.|הספר הזה דק מאוד.
thing|דבר|n|What is this thing?|מה הדבר הזה?
think|לחשוב|v|I think it will rain.|אני חושב שירד גשם.
time|זמן, שעה|n|What time is it?|מה השעה?
too|גם|d|I want to come too.|גם אני רוצה לבוא.
train|רכבת|n|We go to the city by train.|אנחנו נוסעים לעיר ברכבת.
together|ביחד|d|We play together every day.|אנחנו משחקים ביחד כל יום.
those|ההם, ההן|o|Those birds are very loud.|הציפורים ההן רועשות מאוד.
tonight|הערב, הלילה|d|We will watch a movie tonight.|נראה סרט הערב.
tree|עץ|n|A bird sits in the tree.|ציפור יושבת על העץ.
two|שתיים, שניים|n|I have two hands.|יש לי שתי ידיים.
under|מתחת ל-|o|The cat is under the table.|החתול מתחת לשולחן.
uncle|דוד|n|My uncle has a red car.|לדוד שלי יש מכונית אדומה.
try|לנסות|v|Try again, you can do it!|תנסה שוב, אתה יכול!
use|להשתמש|v|Can I use your pencil?|אפשר להשתמש בעיפרון שלך?
very|מאוד|d|The soup is very hot.|המרק חם מאוד.
wall|קיר|n|There is a picture on the wall.|יש תמונה על הקיר.
warm|חמים|a|The water is warm.|המים חמימים.
watch|לצפות ב-|v|I watch cartoons after school.|אני צופה בסרטים מצוירים אחרי בית הספר.
way|דרך|n|This is the way to the park.|זאת הדרך לפארק.
vegetable|ירק|n|A carrot is a vegetable.|גזר הוא ירק.
we|אנחנו|o|We are best friends.|אנחנו החברים הכי טובים.
week|שבוע|n|There are seven days in a week.|יש שבעה ימים בשבוע.
what|מה|o|What is your name?|מה השם שלך?
when|מתי|o|When is your birthday?|מתי יום ההולדת שלך?
where|איפה|o|Where is my bag?|איפה התיק שלי?
white|לבן|a|Snow is white.|השלג לבן.
wear|ללבוש|v|I wear a coat in winter.|אני לובש מעיל בחורף.
who|מי|o|Who is at the door?|מי בדלת?
why|למה|o|Why are you sad?|למה אתה עצוב?
win|לנצח|v|I hope our team will win.|אני מקווה שהקבוצה שלנו תנצח.
winter|חורף|n|It is cold in winter.|קר בחורף.
with|עם|o|I play with my sister.|אני משחקת עם אחותי.
woman|אישה|n|The woman has a red umbrella.|לאישה יש מטרייה אדומה.
word|מילה|n|Write a new word in your notebook.|כתוב מילה חדשה במחברת שלך.
work|לעבוד|v|My parents work in the city.|ההורים שלי עובדים בעיר.
world|עולם|n|I want to travel around the world.|אני רוצה לטייל מסביב לעולם.
year|שנה|n|This year I am in third grade.|השנה אני בכיתה ג'.
yellow|צהוב|a|The sun is yellow.|השמש צהובה.
your|שלך|o|Is this your bag?|זה התיק שלך?
zoo|גן חיות|n|We saw lions at the zoo.|ראינו אריות בגן החיות.
all|כל, כולם|o|All the children are in the garden.|כל הילדים בגינה.
around|מסביב ל-|o|We sat around the table.|ישבנו מסביב לשולחן.
artist|אמן, צייר|n|The artist painted a big picture.|האמן צייר תמונה גדולה.
away|הרחק, משם|d|The bird flew away.|הציפור עפה משם.
bathroom|חדר אמבטיה|n|I brush my teeth in the bathroom.|אני מצחצח שיניים בחדר האמבטיה.
bicycle|אופניים|n|I ride my bicycle to the park.|אני רוכב על האופניים שלי לפארק.
camera|מצלמה|n|I took a photo with my new camera.|צילמתי תמונה עם המצלמה החדשה שלי.
candy|ממתק, סוכריה|n|I got a candy from my teacher.|קיבלתי סוכריה מהמורה שלי.
circle|עיגול|n|Draw a circle on the page.|צייר עיגול על הדף.
classmate|חבר לכיתה|n|My classmate sits next to me.|החבר שלי לכיתה יושב לידי.
clown|ליצן|n|The clown made us laugh.|הליצן הצחיק אותנו.
cookie|עוגייה|n|I ate a chocolate cookie.|אכלתי עוגיית שוקולד.
cream|קצפת, שמנת|n|I like strawberries with cream.|אני אוהב תותים עם קצפת.
dance|לרקוד|v|We dance at the party.|אנחנו רוקדים במסיבה.
crazy|משוגע, מטורף|a|My cat runs around like crazy.|החתול שלי מתרוצץ כמו משוגע.
doll|בובה|n|My sister plays with her doll.|אחותי משחקת עם הבובה שלה.
downstairs|למטה (בקומה)|d|Mom is waiting downstairs.|אמא מחכה למטה.
drawing|ציור|n|Look at my drawing of a horse.|תסתכל על הציור שלי של סוס.
each|כל אחד|o|The teacher gave each child a balloon.|המורה נתנה לכל ילד בלון.
elephant|פיל|n|The elephant has big ears.|לפיל יש אוזניים גדולות.
exam|מבחן|n|I studied hard for the exam.|למדתי קשה למבחן.
eighth|שמיני|a|Our class is on the eighth floor.|הכיתה שלנו בקומה השמינית.
field|שדה, מגרש|n|The cows eat grass in the field.|הפרות אוכלות עשב בשדה.
fill|למלא|v|Please fill the glass with water.|בבקשה מלא את הכוס במים.
feed|להאכיל|v|I feed my dog every morning.|אני מאכיל את הכלב שלי כל בוקר.
famous|מפורסם|a|She wants to be a famous singer.|היא רוצה להיות זמרת מפורסמת.
fire|אש, שריפה|n|We sat around the fire and sang songs.|ישבנו מסביב למדורה ושרנו שירים.
football|כדורגל|n|We play football after school.|אנחנו משחקים כדורגל אחרי בית הספר.
full|מלא|a|My bag is full of books.|התיק שלי מלא בספרים.
gate|שער|n|Please close the gate.|בבקשה סגור את השער.
glasses|משקפיים|n|Grandma can't read without her glasses.|סבתא לא יכולה לקרוא בלי המשקפיים שלה.
front|קדמה, חזית|n|I sit in the front of the class.|אני יושב בקדמת הכיתה.
great|נהדר|a|We had a great day at the beach.|היה לנו יום נהדר בחוף הים.
guess|לנחש|v|Can you guess my name?|אתה יכול לנחש את השם שלי?
hard|קשה, לא קל|a|This puzzle is very hard.|הפאזל הזה קשה מאוד.
hate|לשנוא|v|I hate getting up early.|אני שונא לקום מוקדם.
hill|גבעה|n|We ran up the hill.|רצנו במעלה הגבעה.
hole|חור|n|There is a hole in my sock.|יש חור בגרב שלי.
ice|קרח|n|I put ice in my drink.|שמתי קרח במשקה שלי.
jam|ריבה|n|I like bread with jam.|אני אוהב לחם עם ריבה.
jeans|ג'ינס|n|He is wearing blue jeans.|הוא לובש ג'ינס כחולים.
jump|לקפוץ|v|The frog can jump very high.|הצפרדע יכולה לקפוץ גבוה מאוד.
kick|לבעוט|v|Kick the ball to me!|תבעט אליי את הכדור!
kiss|נשיקה; לנשק|n|Mom gave me a kiss goodnight.|אמא נתנה לי נשיקת לילה טוב.`,
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
pencil|עיפרון|n|Can I borrow a pencil?|אפשר לשאול עיפרון?
notebook|מחברת|n|Write it in your notebook.|כתוב את זה במחברת שלך.
language|שפה|n|English is a useful language.|אנגלית היא שפה שימושית.
holiday|חג|n|Passover is my favorite holiday.|פסח הוא החג האהוב עליי.
birthday|יום הולדת|n|Her birthday is in June.|יום ההולדת שלה ביוני.
present|מתנה|n|I wrapped the present in blue paper.|עטפתי את המתנה בנייר כחול.
party|מסיבה|n|Are you coming to the party?|אתה בא למסיבה?
game|משחק|n|We won the game!|ניצחנו במשחק!
team|קבוצה|n|Our team practices on Monday.|הקבוצה שלנו מתאמנת ביום שני.
sport|ספורט|n|Swimming is my favorite sport.|שחייה היא הספורט האהוב עליי.
weekend|סוף שבוע|n|We visit grandma every weekend.|אנחנו מבקרים את סבתא כל סוף שבוע.
minute|דקה|n|Wait a minute, please.|חכה רגע, בבקשה.
hour|שעה|n|The trip takes one hour.|הנסיעה נמשכת שעה אחת.
month|חודש|n|We move next month.|אנחנו עוברים דירה בחודש הבא.
middle|אמצע|n|The ball is in the middle.|הכדור נמצא באמצע.
different|שונה|a|We have very different ideas.|יש לנו רעיונות שונים מאוד.
same|אותו דבר|a|We wear the same shirt.|אנחנו לובשים את אותה חולצה.
easy|קל|a|This puzzle is easy.|הפאזל הזה קל.
difficult|קשה|a|The test was difficult.|המבחן היה קשה.
expensive|יקר|a|That phone is too expensive.|הטלפון הזה יקר מדי.
cheap|זול|a|These shoes were cheap.|הנעליים האלה היו זולות.
early|מוקדם|a|I woke up early.|התעוררתי מוקדם.
late|מאוחר|a|Sorry, I am late.|סליחה, איחרתי.
quiet|שקט|a|The library is very quiet.|בספרייה שקט מאוד.
loud|רועש|a|The music is too loud.|המוזיקה רועשת מדי.
clean|נקי|a|My room is clean now.|החדר שלי נקי עכשיו.
dirty|מלוכלך|a|Your hands are dirty.|הידיים שלך מלוכלכות.
favorite|אהוב ביותר|a|Pizza is my favorite food.|פיצה היא האוכל האהוב עליי.
important|חשוב|a|This is an important message.|זו הודעה חשובה.
ready|מוכן|a|Are you ready to go?|אתם מוכנים לצאת?
learn|ללמוד|v|I want to learn French.|אני רוצה ללמוד צרפתית.
teach|ללמד|v|She can teach you to swim.|היא יכולה ללמד אותך לשחות.
understand|להבין|v|I do not understand this word.|אני לא מבין את המילה הזאת.
remember|לזכור|v|I remember your name.|אני זוכרת את השם שלך.
forget|לשכוח|v|Don't forget your keys.|אל תשכח את המפתחות שלך.
borrow|לשאול (לזמן מה)|v|Can I borrow your ruler?|אפשר לשאול את הסרגל שלך?
choose|לבחור|v|You can choose any color.|אפשר לבחור כל צבע.
finish|לסיים|v|I will finish it tonight.|אני אסיים את זה הערב.
begin|להתחיל|v|The movie will begin soon.|הסרט יתחיל בקרוב.
wait|לחכות|v|Please wait for me.|בבקשה חכי לי.
meet|לפגוש|v|Let's meet after school.|בואו ניפגש אחרי בית הספר.
visit|לבקר|v|We visit the museum on Sunday.|אנחנו מבקרים במוזיאון ביום ראשון.
send|לשלוח|v|I will send you a message.|אני אשלח לך הודעה.
carry|לסחוב|v|Can you carry this bag?|אתה יכול לסחוב את התיק הזה?
because|כי|o|I stayed home because it rained.|נשארתי בבית כי ירד גשם.
between|בין|o|Sit between us.|שב בינינו.
before|לפני|o|Wash your hands before lunch.|תשטוף ידיים לפני ארוחת הצהריים.
after|אחרי|o|We play after dinner.|אנחנו משחקים אחרי ארוחת הערב.
wash|לשטוף|v|I wash my hands before lunch.|אני שוטף ידיים לפני ארוחת הצהריים.
thirsty|צמא|a|The thirsty boy drank some water.|הילד הצמא שתה קצת מים.
shirt|חולצה|n|He is wearing a clean white shirt.|הוא לובש חולצה לבנה ונקייה.
hat|כובע|n|Put on your hat when it is sunny.|תחבוש את הכובע שלך כשיש שמש.
sing|לשיר|v|We sing together in music class.|אנחנו שרים יחד בשיעור מוזיקה.
tall|גבוה|a|My brother is very tall.|אחי גבוה מאוד.
stairs|מדרגות|n|We walked up the stairs to our flat.|עלינו במדרגות לדירה שלנו.
mirror|מראה|n|She looked at her hair in the mirror.|היא הסתכלה על השיער שלה במראה.
farmer|חקלאי|n|The farmer feeds his cows every morning.|החקלאי מאכיל את הפרות שלו כל בוקר.
belong|להשתייך|v|These books belong to my sister.|הספרים האלה שייכים לאחותי.
collect|לאסוף|v|My brother likes to collect old coins.|אחי אוהב לאסוף מטבעות ישנים.
celebrate|לחגוג|v|We celebrate my birthday with a big cake.|אנחנו חוגגים את יום ההולדת שלי עם עוגה גדולה.
glove|כפפה|n|I lost one glove in the snow.|איבדתי כפפה אחת בשלג.
basket|סל|n|We put the apples in a basket.|שמנו את התפוחים בסל.
noisy|רועש|a|The classroom was very noisy today.|הכיתה הייתה רועשת מאוד היום.
sleepy|מנומנם|a|The baby is sleepy after lunch.|התינוק מנומנם אחרי ארוחת הצהריים.
hurry|למהר|v|We must hurry or we will miss the bus.|אנחנו חייבים למהר, אחרת נפספס את האוטובוס.
guest|אורח|n|Our guest stayed for dinner.|האורח שלנו נשאר לארוחת ערב.
puddle|שלולית|n|The kids jumped into a puddle.|הילדים קפצו לתוך שלולית.
recipe|מתכון|n|Grandma gave me her cake recipe.|סבתא נתנה לי את המתכון שלה לעוגה.
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
bowl|קערה|n|She ate a bowl of cereal.|היא אכלה קערה של דגני בוקר.
net|רשת|n|The ball went into the net.|הכדור נכנס לרשת.
next|הבא|a|We will meet next week.|ניפגש בשבוע הבא.
past|אחרי (בשעה), עבר|o|It is ten past five.|השעה חמש ועשרה.
plan|תוכנית|n|We have a plan for the weekend.|יש לנו תוכנית לסוף השבוע.
calendar|לוח שנה|n|Mark the party on the calendar.|סמני את המסיבה בלוח השנה.
cap|כובע מצחייה|n|He wears a blue cap.|הוא חובש כובע מצחייה כחול.
cent|סנט|n|I found a cent on the floor.|מצאתי סנט על הרצפה.
plus|ועוד (פלוס)|o|Two plus two is four.|שתיים ועוד שתיים זה ארבע.
rent|שכר דירה|n|My parents pay the rent every month.|ההורים שלי משלמים שכר דירה כל חודש.
rest|לנוח|v|Let's rest under the tree.|בואו ננוח מתחת לעץ.
soft|רך|a|My kitten is very soft.|החתלתול שלי רך מאוד.
spend|לבלות, להוציא (כסף)|v|We spend the summer at the beach.|אנחנו מבלים את הקיץ בחוף הים.
chat|לשוחח, צ'אט|v|I like to chat with my friends.|אני אוהבת לשוחח עם החברים שלי.
check|לבדוק|v|Please check your answers.|בבקשה בדקו את התשובות שלכם.
chef|שף|n|The chef made a delicious soup.|השף הכין מרק טעים.
chip|צ'יפס, שבב|n|Can I have a chip?|אפשר צ'יפס אחד?
test|מבחן|n|I studied hard for the test.|למדתי קשה למבחן.
than|מאשר, מ-|o|My brother is taller than me.|אחי גבוה ממני.
circus|קרקס|n|We saw a funny clown at the circus.|ראינו ליצן מצחיק בקרקס.
clap|למחוא כפיים|v|Let's clap for the singer!|בואו נמחא כפיים לזמרת!
coin|מטבע|n|I put a coin in my piggy bank.|שמתי מטבע בקופה שלי.
comb|מסרק|n|I need a comb for my hair.|אני צריכה מסרק לשיער שלי.
trip|טיול|n|We went on a school trip to the zoo.|יצאנו לטיול כיתתי לגן החיות.
concert|הופעה, קונצרט|n|We went to a concert in the park.|הלכנו להופעה בפארק.
cooking|בישול|n|My dad loves cooking for the family.|אבא שלי אוהב בישול בשביל המשפחה.
copy|להעתיק|v|Please copy the words from the board.|בבקשה העתיקו את המילים מהלוח.
adult|מבוגר|n|A child must swim with an adult.|ילד חייב לשחות עם מבוגר.
age|גיל|n|At the age of six, I started school.|בגיל שש התחלתי ללכת לבית הספר.
ago|לפני (זמן)|d|We moved here two years ago.|עברנו לגור כאן לפני שנתיים.
alphabet|האלף-בית|n|There are 26 letters in the English alphabet.|יש 26 אותיות באלף-בית האנגלי.
corn|תירס|n|We ate hot corn at the beach.|אכלנו תירס חם בחוף.
cough|להשתעל, שיעול|v|The sick boy began to cough.|הילד החולה התחיל להשתעל.
could|יכול (בעבר)|v|I could swim when I was five.|יכולתי לשחות כשהייתי בן חמש.
cousin|בן דוד, בת דודה|n|My cousin is coming to visit us.|בן הדוד שלי בא לבקר אותנו.
ambulance|אמבולנס|n|The ambulance took the man to the hospital.|האמבולנס לקח את האיש לבית החולים.
among|בין, בקרב|o|The cat is hiding among the flowers.|החתול מתחבא בין הפרחים.
anybody|מישהו, כל אחד|o|Did anybody see my pencil?|מישהו ראה את העיפרון שלי?
anyway|בכל מקרה|d|It was raining, but we played outside anyway.|ירד גשם, אבל שיחקנו בחוץ בכל מקרה.
anywhere|בשום מקום, בכל מקום|d|I can't find my shoes anywhere.|אני לא מוצא את הנעליים שלי בשום מקום.
cupboard|ארון|n|The cups are in the kitchen cupboard.|הכוסות בארון המטבח.
curtain|וילון|n|Please close the curtain, the sun is too bright.|בבקשה סגרי את הווילון, השמש חזקה מדי.
dentist|רופא שיניים|n|I go to the dentist twice a year.|אני הולך לרופא השיניים פעמיים בשנה.
autumn|סתיו|n|The leaves fall in autumn.|העלים נושרים בסתיו.
badly|רע, קשות|d|I slept badly last night.|ישנתי רע בלילה.
bake|לאפות|v|Let's bake a cake for Mom.|בואו נאפה עוגה לאמא.
banana|בננה|n|I eat a banana every morning.|אני אוכל בננה כל בוקר.
band|להקה|n|My brother plays the drums in a band.|אחי מתופף בלהקה.
dessert|קינוח|n|We had ice cream for dessert.|אכלנו גלידה לקינוח.
diary|יומן|n|I write in my diary every night.|אני כותבת ביומן שלי כל ערב.
dig|לחפור|v|The dog likes to dig in the garden.|הכלב אוהב לחפור בגינה.
bank|בנק|n|Mom keeps her money in the bank.|אמא שומרת את הכסף שלה בבנק.
below|מתחת, למטה|o|Write your name below the picture.|כתבו את השם שלכם מתחת לתמונה.
better|טוב יותר|a|I feel better today.|אני מרגיש טוב יותר היום.
biscuit|ביסקוויט|n|Can I have a biscuit with my tea?|אפשר לקבל ביסקוויט עם התה?
blouse|חולצה (לנשים)|n|Mom is wearing a pink blouse.|אמא לובשת חולצה ורודה.
dish|צלחת, מנה|n|Pizza is my favorite dish.|פיצה היא המנה האהובה עליי.
drawer|מגירה|n|My socks are in the top drawer.|הגרביים שלי במגירה העליונה.
drop|להפיל|v|Be careful not to drop the eggs.|תיזהרו לא להפיל את הביצים.
drum|תוף|n|He plays the drum in the school band.|הוא מנגן בתוף בלהקה של בית הספר.
board|לוח|n|The teacher writes on the board.|המורה כותבת על הלוח.
build|לבנות|v|Let's build a tower with the blocks.|בואו נבנה מגדל מהקוביות.
busy|עסוק|a|Mom is busy right now.|אמא עסוקה עכשיו.
earring|עגיל|n|I lost my earring in the garden.|איבדתי את העגיל שלי בגינה.
elevator|מעלית|n|We took the elevator to the tenth floor.|עלינו במעלית לקומה העשירית.
email|אימייל|n|I sent my teacher an email.|שלחתי אימייל למורה שלי.
emoji|אימוג'י|n|She sent me a smiling emoji.|היא שלחה לי אימוג'י מחייך.
call|להתקשר, לקרוא|v|I call my grandpa every Friday.|אני מתקשר לסבא שלי בכל יום שישי.
card|כרטיס, כרטיסייה|n|I made a birthday card for my mom.|הכנתי כרטיס ברכה ליום ההולדת של אמא שלי.
care|לדאוג, אכפת|v|I care about my friends.|אכפת לי מהחברים שלי.
cellphone|טלפון נייד|n|My sister got a new cellphone.|אחותי קיבלה טלפון נייד חדש.
center|מרכז|n|There is a big tree in the center of the park.|יש עץ גדול במרכז הפארק.
enter|להיכנס|v|Please knock before you enter the room.|בבקשה תדפקו לפני שאתם נכנסים לחדר.
euro|יורו|n|This pen costs one euro.|העט הזה עולה יורו אחד.
exit|יציאה|n|The exit is next to the stairs.|היציאה נמצאת ליד המדרגות.
cinema|קולנוע|n|We saw a funny movie at the cinema.|ראינו סרט מצחיק בקולנוע.
classroom|כיתה|n|Our classroom has big windows.|בכיתה שלנו יש חלונות גדולים.
club|מועדון, חוג|n|I go to the chess club after school.|אני הולך לחוג שחמט אחרי בית הספר.
fantastic|נהדר, מדהים|a|We had a fantastic day at the beach.|היה לנו יום נהדר בים.
feather|נוצה|n|I found a white feather in the yard.|מצאתי נוצה לבנה בחצר.
fight|לריב, להילחם|v|My cats fight over the toy.|החתולים שלי רבים על הצעצוע.
fishing|דיג|n|Grandpa takes me fishing at the lake.|סבא לוקח אותי לדוג באגם.
cool|קריר, מגניב|a|The water in the pool is cool.|המים בבריכה קרירים.
corner|פינה|n|The shop is on the corner.|החנות נמצאת בפינה.
count|לספור|v|Can you count to ten?|אתה יודע לספור עד עשר?
country|ארץ, מדינה|n|Israel is a small country.|ישראל היא מדינה קטנה.
customer|לקוח|n|The first customer bought bread.|הלקוח הראשון קנה לחם.
flag|דגל|n|The flag is blue and white.|הדגל כחול ולבן.
fix|לתקן|v|Dad can fix my bike.|אבא יכול לתקן את האופניים שלי.
free|חופשי, חינם|a|The tickets are free for children.|הכרטיסים בחינם לילדים.
fresh|טרי|a|We bought fresh bread.|קנינו לחם טרי.
date|תאריך|n|What is the date today?|מה התאריך היום?
daughter|בת|n|She has one daughter and two sons.|יש לה בת אחת ושני בנים.
document|מסמך|n|Mom signed an important document.|אמא חתמה על מסמך חשוב.
dollar|דולר|n|This toy costs one dollar.|הצעצוע הזה עולה דולר אחד.
gas|גז, דלק|n|The car needs gas.|המכונית צריכה דלק.
garbage|זבל|n|Please take out the garbage.|בבקשה תוציא את הזבל.
geography|גאוגרפיה|n|In geography we learn about maps.|בגאוגרפיה אנחנו לומדים על מפות.
drive|לנהוג|v|Mom will drive us to school.|אמא תסיע אותנו לבית הספר.
driver|נהג|n|The bus driver says good morning.|נהג האוטובוס אומר בוקר טוב.
easily|בקלות|d|She can easily climb the tree.|היא יכולה לטפס על העץ בקלות.
east|מזרח|n|The sun comes up in the east.|השמש זורחת במזרח.
eighteen|שמונה עשרה|n|My cousin is eighteen years old.|בן הדוד שלי בן שמונה עשרה.
eighty|שמונים|n|My grandpa is eighty years old.|סבא שלי בן שמונים.
gold|זהב|n|The queen has a crown of gold.|למלכה יש כתר מזהב.
gym|אולם ספורט, חדר כושר|n|We play basketball in the gym.|אנחנו משחקים כדורסל באולם הספורט.
enjoy|ליהנות|v|I enjoy swimming in the sea.|אני נהנה לשחות בים.
every|כל|o|I brush my teeth every morning.|אני מצחצח שיניים כל בוקר.
everything|הכול|o|I told Mom everything.|סיפרתי לאמא הכול.
everywhere|בכל מקום|d|There are toys everywhere in my room.|יש צעצועים בכל מקום בחדר שלי.
fall|ליפול|v|Hold on so you don't fall off the bike.|תחזיק חזק כדי שלא תיפול מהאופניים.
honey|דבש|n|Bees make honey.|דבורים מכינות דבש.
hobby|תחביב|n|My hobby is painting.|התחביב שלי הוא ציור.
helpful|מועיל, עוזר|a|The map was very helpful.|המפה עזרה מאוד.
fat|שמן|a|Our cat is very fat.|החתול שלנו שמן מאוד.
fifty|חמישים|n|My dad is fifty years old.|אבא שלי בן חמישים.
find|למצוא|v|I can't find my shoes.|אני לא מוצא את הנעליים שלי.
first|ראשון|a|I was first in the race.|הייתי ראשון במרוץ.
flat|שטוח|a|The table is flat.|השולחן שטוח.
hundreds|מאות|n|There are hundreds of birds in the sky.|יש מאות ציפורים בשמיים.
ill|חולה|a|I stayed home because I was ill.|נשארתי בבית כי הייתי חולה.
forty|ארבעים|n|There are forty chairs in the hall.|יש ארבעים כיסאות באולם.
fourteen|ארבע עשרה|n|My brother is fourteen years old.|אחי בן ארבע עשרה.
fourth|רביעי|a|We live on the fourth floor.|אנחנו גרים בקומה הרביעית.
friendly|ידידותי|a|Our new neighbor is very friendly.|השכן החדש שלנו מאוד ידידותי.
garlic|שום|n|Dad puts garlic in the soup.|אבא שם שום במרק.
instrument|כלי נגינה, מכשיר|n|The piano is my favorite instrument.|הפסנתר הוא כלי הנגינה האהוב עליי.
interest|עניין|n|He has a big interest in stars.|יש לו עניין גדול בכוכבים.
goal|שער (בכדורגל), מטרה|n|He scored a goal in the game.|הוא הבקיע שער במשחק.
grade|ציון, כיתה|n|I got a good grade on the test.|קיבלתי ציון טוב במבחן.
grandchild|נכד|n|Grandma has one grandchild.|לסבתא יש נכד אחד.
grandparent|סבא או סבתא|n|A grandparent is the parent of your mom or dad.|סבא או סבתא הם ההורים של אמא או של אבא.
joke|בדיחה|n|Tell me a funny joke.|ספר לי בדיחה מצחיקה.
kite|עפיפון|n|We flew a kite at the beach.|הטסנו עפיפון בחוף.
ground|קרקע, אדמה|n|The apple fell to the ground.|התפוח נפל על האדמה.
group|קבוצה, חבורה|n|We work in a group of four.|אנחנו עובדים בקבוצה של ארבעה.
guitar|גיטרה|n|My sister plays the guitar.|אחותי מנגנת בגיטרה.
heavy|כבד|a|This box is too heavy.|הארגז הזה כבד מדי.
lemonade|לימונדה|n|We drank cold lemonade.|שתינו לימונדה קרה.
lick|ללקק|v|The dog likes to lick my hand.|הכלב אוהב ללקק לי את היד.
hey|הֵי (קריאה)|o|Hey, look at that bird!|הֵי, תראה את הציפור הזאת!
hotel|מלון|n|We stayed in a hotel by the sea.|לנו במלון ליד הים.
hundred|מאה|n|My grandpa is almost a hundred years old.|סבא שלי כמעט בן מאה.
lion|אריה|n|The lion is the king of the jungle.|האריה הוא מלך הג'ונגל.
lucky|בר מזל|a|I am lucky to have a dog.|יש לי מזל שיש לי כלב.
lock|לנעול|v|Please lock the door.|בבקשה תנעל את הדלת.
interesting|מעניין|a|This book is very interesting.|הספר הזה מעניין מאוד.
into|לתוך|o|The cat jumped into the box.|החתול קפץ לתוך הקופסה.
just|רק, בדיוק|d|I just want one cookie.|אני רק רוצה עוגייה אחת.
midnight|חצות|n|We stayed up until midnight.|נשארנו ערים עד חצות.
knife|סכין|n|Be careful with the knife.|תיזהר עם הסכין.
lie|שקר|n|Don't tell a lie.|אל תגיד שקר.
life|חיים|n|My grandpa had a long and happy life.|לסבא שלי היו חיים ארוכים ומאושרים.
line|שורה, קו|n|Please stand in a line.|בבקשה לעמוד בשורה.
lose|לאבד, להפסיד|v|Don't lose your key.|אל תאבד את המפתח שלך.
myself|בעצמי, את עצמי|o|I made this cake myself.|הכנתי את העוגה הזאת בעצמי.
meal|ארוחה|n|Breakfast is my favorite meal.|ארוחת הבוקר היא הארוחה האהובה עליי.
meat|בשר|n|My brother does not eat meat.|אחי לא אוכל בשר.
mobile|נייד|a|My mom has a new mobile phone.|לאמא שלי יש טלפון נייד חדש.
nothing|כלום|o|There is nothing in the box.|אין כלום בקופסה.
oh|אוי, הו|o|Oh, I forgot my bag!|אוי, שכחתי את התיק!
near|קרוב|o|We live near the park.|אנחנו גרים קרוב לפארק.
nineteen|תשע עשרה|n|There are nineteen kids in my class.|יש תשעה עשר ילדים בכיתה שלי.
ninety|תשעים|n|My great-grandma is ninety years old.|סבתא רבתא שלי בת תשעים.
nobody|אף אחד|o|Nobody was at home.|אף אחד לא היה בבית.
ourselves|בעצמנו|o|We built the tree house ourselves.|בנינו את בית העץ בעצמנו.
pear|אגס|n|I ate a sweet pear.|אכלתי אגס מתוק.
office|משרד|n|My mom works in an office.|אמא שלי עובדת במשרד.
once|פעם אחת|d|I have been to Eilat once.|הייתי באילת פעם אחת.
only|רק, היחיד|d|I have only one pencil.|יש לי רק עיפרון אחד.
ours|שייך לנו|o|That ball is ours.|הכדור הזה שלנו.
pepper|פלפל|n|Mom put pepper in the soup.|אמא שמה פלפל במרק.
piano|פסנתר|n|My sister plays the piano.|אחותי מנגנת בפסנתר.
playground|גן שעשועים|n|We met at the playground.|נפגשנו בגן השעשועים.
page|עמוד, דף|n|Open your book to page ten.|פתחו את הספר בעמוד עשר.
parent|הורה|n|Every parent wants a happy child.|כל הורה רוצה ילד מאושר.
pass|להעביר, לעבור|v|Please pass the salt.|בבקשה תעביר את המלח.
picnic|פיקניק|n|We had a picnic by the lake.|עשינו פיקניק ליד האגם.
popcorn|פופקורן|n|We ate popcorn at the movies.|אכלנו פופקורן בקולנוע.
poem|שיר|n|I wrote a poem for my mom.|כתבתי שיר לאמא שלי.
press|ללחוץ|v|Press the red button.|תלחץ על הכפתור האדום.
post|לשלוח בדואר|v|I will post the letter today.|אשלח את המכתב בדואר היום.
place|מקום|n|This is my favorite place.|זה המקום האהוב עליי.
plant|צמח|n|Water the plant every day.|תשקה את הצמח כל יום.
player|שחקן|n|He is the best player on the team.|הוא השחקן הכי טוב בקבוצה.
poor|עני, מסכן|a|The poor dog was wet and cold.|הכלב המסכן היה רטוב וקר.
price|מחיר|n|What is the price of this toy?|מה המחיר של הצעצוע הזה?
pupil|תלמיד|n|Every pupil has a new book.|לכל תלמיד יש ספר חדש.
puppy|גור כלבים|n|Our puppy sleeps in a little bed.|הגור שלנו ישן במיטה קטנה.
purple|סגול|a|She has a purple bag.|יש לה תיק סגול.
puzzle|פאזל, חידה|n|We finished the puzzle together.|סיימנו את הפאזל ביחד.
rainy|גשום|a|It is a rainy day, so we stay inside.|זה יום גשום, אז אנחנו נשארים בבית.
really|באמת, ממש|d|I really like your new shoes.|אני ממש אוהב את הנעליים החדשות שלך.
rich|עשיר|a|The rich king had a lot of gold.|למלך העשיר היה הרבה זהב.
right|ימין, נכון|a|Raise your right hand.|תרימו את היד הימנית.
rat|חולדה|n|A rat ran under the table.|חולדה רצה מתחת לשולחן.
race|מרוץ, תחרות|n|She won the race at school.|היא ניצחה במרוץ בבית הספר.
seat|מושב, מקום ישיבה|n|Please sit in your seat.|בבקשה שב במקום שלך.
second|שני, שנייה|a|This is my second ice cream today.|זאת הגלידה השנייה שלי היום.
sentence|משפט|n|Read the first sentence aloud.|תקרא את המשפט הראשון בקול.
seventeen|שבע עשרה, שבעה עשר|n|My sister is seventeen years old.|אחותי בת שבע עשרה.
seventy|שבעים|n|Grandma is seventy years old.|סבתא בת שבעים.
rock|סלע|n|We sat on a big rock.|ישבנו על סלע גדול.
sauce|רוטב|n|I like pasta with tomato sauce.|אני אוהב פסטה ברוטב עגבניות.
sausage|נקניקייה|n|He ate a sausage at the party.|הוא אכל נקניקייה במסיבה.
scarf|צעיף|n|Wear a scarf, it is cold outside.|תלבש צעיף, קר בחוץ.
shut|לסגור|v|Shut the door, it is cold.|תסגור את הדלת, קר.
sign|שלט, סימן|n|Read the sign on the door.|תקרא את השלט על הדלת.
singer|זמר|n|She is a famous singer.|היא זמרת מפורסמת.
sixteen|שש עשרה, שישה עשר|n|My cousin is sixteen years old.|בן הדוד שלי בן שש עשרה.
sixty|שישים|n|There are sixty minutes in an hour.|יש שישים דקות בשעה.
shape|צורה|n|A circle is a round shape.|עיגול הוא צורה עגולה.
somebody|מישהו|o|Somebody is knocking on the door.|מישהו דופק בדלת.
someone|מישהו, מישהי|o|Someone ate my cake!|מישהו אכל לי את העוגה!
something|משהו, דבר מה|o|I have something for you.|יש לי משהו בשבילך.
sometimes|לפעמים|d|Sometimes I walk to school.|לפעמים אני הולך ברגל לבית הספר.
somewhere|איפשהו|d|My keys are somewhere in this room.|המפתחות שלי איפשהו בחדר הזה.
ship|ספינה, אונייה|n|The big ship sailed across the sea.|הספינה הגדולה הפליגה על פני הים.
shopping|קניות|n|Mom went shopping for food.|אמא הלכה לקנות אוכל.
silly|מטופש, מצחיק|a|He made a silly face.|הוא עשה פרצוף מצחיק.
spring|אביב|n|Flowers grow in spring.|פרחים צומחים באביב.
stay|להישאר, לשהות|v|Can I stay at your house tonight?|אני יכול להישאר אצלך הלילה?
straight|ישר (לא עקום)|a|Draw a straight line.|תצייר קו ישר.
study|ללמוד, לשנן|v|I study for my test every day.|אני לומד למבחן שלי כל יום.
smart|חכם, נבון|a|My dog is very smart.|הכלב שלי חכם מאוד.
soccer|כדורגל|n|We play soccer after school.|אנחנו משחקים כדורגל אחרי בית הספר.
supper|ארוחת ערב|n|We eat supper at seven.|אנחנו אוכלים ארוחת ערב בשבע.
telephone|טלפון|n|The telephone is ringing.|הטלפון מצלצל.
tenth|עשירי|a|Today is my tenth birthday.|היום יום ההולדת העשירי שלי.
stone|אבן|n|He threw a stone into the lake.|הוא זרק אבן לתוך האגם.
strawberry|תות|n|I put a strawberry on my cake.|שמתי תות על העוגה שלי.
third|שלישי|a|I was third in the race.|הייתי שלישי במרוץ.
thirteen|שלוש עשרה, שלושה עשר|n|My brother is thirteen years old.|אחי בן שלוש עשרה.
thirty|שלושים|n|There are thirty children in my class.|יש שלושים ילדים בכיתה שלי.
sunglasses|משקפי שמש|n|Wear your sunglasses at the beach.|תרכיב משקפי שמש בחוף.
taste|טעם|n|I love the taste of honey.|אני אוהב את הטעם של דבש.
teaspoon|כפית|n|Add a teaspoon of sugar.|תוסיף כפית סוכר.
turn|תור|n|It is your turn to play.|זה התור שלך לשחק.
twelve|שתים עשרה, שנים עשר|n|My sister is twelve years old.|אחותי בת שתים עשרה.
twenty|עשרים|n|I can count to twenty.|אני יודע לספור עד עשרים.
thanks|תודה|o|Thanks for the gift!|תודה על המתנה!
thick|עבה|a|This rope is very thick.|החבל הזה עבה מאוד.
thumb|אגודל|n|I hurt my thumb.|נפגעתי באגודל.
throat|גרון|n|My throat hurts.|הגרון שלי כואב.
usually|בדרך כלל, לרוב|d|I usually eat cereal for breakfast.|בדרך כלל אני אוכל דגני בוקר לארוחת בוקר.
verb|פועל|n|Every sentence needs a verb.|כל משפט צריך פועל.
waiter|מלצר|n|The waiter brought our food.|המלצר הביא לנו את האוכל.
waitress|מלצרית|n|The waitress gave us the menu.|המלצרית נתנה לנו את התפריט.
tie|עניבה|n|Dad wears a tie to work.|אבא עונב עניבה לעבודה.
toe|בוהן|n|I hurt my big toe.|נפגעתי בבוהן הגדולה.
toast|טוסט, לחם קלוי|n|I eat toast for breakfast.|אני אוכל טוסט לארוחת בוקר.
tongue|לשון|n|The dog has a pink tongue.|לכלב יש לשון ורודה.
well|היטב, טוב|d|She sings very well.|היא שרה טוב מאוד.
west|מערב|n|The sun sets in the west.|השמש שוקעת במערב.
touch|לגעת|v|Don't touch the hot stove.|אל תיגע בכיריים החמות.
tower|מגדל|n|We built a tall tower of blocks.|בנינו מגדל גבוה מקוביות.
trousers|מכנסיים ארוכים|n|My trousers are too long.|המכנסיים שלי ארוכים מדי.
wife|רעיה, אשתו של|n|My uncle's wife is very kind.|אשתו של הדוד שלי נחמדה מאוד.
windy|עם רוח חזקה, סוער|a|It is windy today.|יש היום רוח חזקה.
winner|מנצח, זוכה|n|The winner gets a medal.|המנצח מקבל מדליה.
wine|יין|n|Grapes are used to make wine.|מענבים מכינים יין.
truck|משאית|n|A big truck stopped near our house.|משאית גדולה עצרה ליד הבית שלנו.
ugly|מכוער|a|The ugly duckling became a swan.|הברווזון המכוער הפך לברבור.
uniform|מדים, תלבושת אחידה|n|We wear a uniform to school.|אנחנו לובשים תלבושת אחידה לבית הספר.
worker|עובד, פועל|n|The worker fixed the road.|הפועל תיקן את הכביש.
account|חשבון|n|Dad has a bank account.|לאבא יש חשבון בנק.
across|לרוחב, מעבר ל-|o|We walked across the bridge.|חצינו את הגשר ברגל.
video|סרטון|n|We watched a funny video.|צפינו בסרטון מצחיק.
voice|קול|n|She has a beautiful voice.|יש לה קול יפה.
wheel|גלגל|n|One wheel of my bike is broken.|גלגל אחד של האופניים שלי שבור.
act|לפעול|v|We must act fast to help the bird.|עלינו לפעול מהר כדי לעזור לציפור.
action|פעולה, אקשן|n|I like action movies.|אני אוהב סרטי אקשן.
address|כתובת|n|What is your address?|מה הכתובת שלך?
advise|לייעץ|v|The doctor will advise you what to do.|הרופא ייעץ לך מה לעשות.
alone|לבד|a|The cat was alone at home.|החתול היה לבד בבית.
along|לאורך|o|We walked along the beach.|הלכנו לאורך החוף.
already|כבר|d|I already finished my homework.|כבר סיימתי את שיעורי הבית.
wish|לאחל, לייחל|v|I wish you a happy birthday.|אני מאחל לך יום הולדת שמח.
wool|צמר|n|My hat is made of wool.|הכובע שלי עשוי מצמר.
yourself|בעצמך, את עצמך|o|Did you make this cake yourself?|הכנת את העוגה הזאת בעצמך?
asleep|ישן, רדום|a|The baby is asleep.|התינוק ישן.
beard|זקן|n|My grandpa has a white beard.|לסבא שלי יש זקן לבן.
beer|בירה|n|Beer is a drink for adults.|בירה היא משקה למבוגרים.
bottom|תחתית|n|The ball is at the bottom of the pool.|הכדור נמצא בתחתית הבריכה.
break|הפסקה|n|We play outside during the break.|אנחנו משחקים בחוץ בהפסקה.
bright|בהיר, מואר|a|The room is bright and sunny.|החדר מואר ושטוף שמש.
active|פעיל|a|My grandma is very active.|סבתא שלי מאוד פעילה.
change|לשנות, להחליף|v|I want to change my shirt.|אני רוצה להחליף את החולצה שלי.
clear|צלול, ברור|a|The water in the lake is clear.|המים באגם צלולים.
closed|סגור|a|The shop is closed on Saturday.|החנות סגורה בשבת.
comfortable|נוח|a|This chair is very comfortable.|הכיסא הזה נוח מאוד.
competition|תחרות|n|Our class won the singing competition.|הכיתה שלנו ניצחה בתחרות השירה.
complete|שלם, גמור|a|My puzzle is complete.|הפאזל שלי שלם.
angel|מלאך|n|The little girl looks like an angel.|הילדה הקטנה נראית כמו מלאך.
ankle|קרסול|n|I hurt my ankle in the game.|נפגעתי בקרסול במשחק.
allow|להרשות|v|My parents allow me to play outside.|ההורים שלי מרשים לי לשחק בחוץ.
contain|להכיל|v|These boxes contain old toys.|הקופסאות האלה מכילות צעצועים ישנים.
countryside|כפר, אזור כפרי|n|We spent the weekend in the countryside.|בילינו את סוף השבוע באזור כפרי.
cover|לכסות|v|Please cover the cake with a cloth.|בבקשה כסה את העוגה במפית.
dead|מת|a|The flower is dead because nobody watered it.|הפרח מת כי אף אחד לא השקה אותו.
dear|יקר|a|She is my dear friend.|היא החברה היקרה שלי.
department|מחלקה|n|The toys are in the children's department.|הצעצועים נמצאים במחלקת הילדים.
athlete|ספורטאי|n|The athlete runs every morning.|הספורטאי רץ כל בוקר.
depth|עומק|n|What is the depth of the pool?|מה העומק של הבריכה?
dictionary|מילון|n|I looked up the word in the dictionary.|חיפשתי את המילה במילון.
die|למות|v|Plants die without water.|צמחים מתים בלי מים.
direct|ישיר|a|We took a direct flight to London.|טסנו בטיסה ישירה ללונדון.
double|כפול|a|I ordered a double ice cream.|הזמנתי גלידה כפולה.
during|במהלך|o|Don't talk during the movie.|אל תדבר במהלך הסרט.
awful|נורא, איום|a|The soup tastes awful.|למרק יש טעם נורא.
babysit|לשמור על ילדים|v|My cousin will babysit us tonight.|בת הדודה שלי תשמור עלינו הערב.
earlier|מוקדם יותר|d|I came home earlier than my brother.|הגעתי הביתה מוקדם יותר מאחי.
effort|מאמץ|n|She made a big effort to finish the race.|היא עשתה מאמץ גדול כדי לסיים את המרוץ.
either|גם (בשלילה)|o|I can't swim, and my sister can't either.|אני לא יודע לשחות, וגם אחותי לא.
else|עוד, אחר|d|Do you want anything else?|אתה רוצה עוד משהו?
ever|אי פעם|d|Have you ever seen a rainbow?|ראית פעם קשת בענן?
exactly|בדיוק|d|The movie starts at exactly five o'clock.|הסרט מתחיל בדיוק בחמש.
bean|שעועית|n|I planted a bean in a cup.|שתלתי גרגר שעועית בכוס.
barber|ספר (מספרה)|n|The barber cut my hair short.|הספר קיצר לי את השיער.
excellent|מצוין|a|You did an excellent job!|עשית עבודה מצוינת!
bandage|תחבושת|n|The nurse put a bandage on my knee.|האחות שמה לי תחבושת על הברך.
except|חוץ מ-|o|Everyone came except Dan.|כולם באו חוץ מדן.
exercise|תרגיל|n|Please do exercise five in your book.|בבקשה תעשו את תרגיל חמש בספר.
extra|נוסף, עוד|a|Can I have an extra pencil?|אפשר לקבל עוד עיפרון?
fail|להיכשל|v|If you don't study, you may fail the test.|אם לא תלמד, אתה עלול להיכשל במבחן.
fairly|די, למדי|d|The test was fairly easy.|המבחן היה די קל.
final|אחרון, סופי|a|This is the final game of the season.|זה המשחק האחרון של העונה.
bee|דבורה|n|A bee is sitting on the flower.|דבורה יושבת על הפרח.
beef|בשר בקר|n|We had beef and rice for dinner.|אכלנו בשר בקר ואורז לארוחת ערב.
belt|חגורה|n|He wears a brown belt.|הוא חוגר חגורה חומה.
bin|פח|n|Put the paper in the bin.|שים את הנייר בפח.
birth|לידה|n|We were so happy at the birth of my baby brother.|כל כך שמחנו בלידה של אחי התינוק.
fine|בסדר, נעים|a|The weather is fine today.|מזג האוויר נעים היום.
folder|תיקייה|n|Put your drawings in the blue folder.|שים את הציורים שלך בתיקייה הכחולה.
form|טופס|n|Please fill in this form.|בבקשה מלא את הטופס הזה.
gram|גרם|n|A paper clip weighs about one gram.|מהדק נייר שוקל בערך גרם אחד.
bone|עצם|n|The dog is chewing a bone.|הכלב לועס עצם.
bite|לנשוך|v|Don't worry, my dog doesn't bite.|אל תדאג, הכלב שלי לא נושך.
bookcase|כוננית ספרים|n|There are many books in the bookcase.|יש הרבה ספרים בכוננית.
blog|בלוג|n|My sister writes a blog about cooking.|אחותי כותבת בלוג על בישול.
block|קובייה, גוש|n|The baby is playing with a wooden block.|התינוק משחק בקובייה מעץ.
grill|גריל|n|Dad cooks fish on the grill.|אבא מבשל דגים על הגריל.
gun|אקדח, רובה|n|My brother has a water gun.|לאח שלי יש אקדח מים.
hall|מסדרון, אולם|n|Our classroom is at the end of the hall.|הכיתה שלנו נמצאת בסוף המסדרון.
hang|לתלות|v|Please hang your coat on the hook.|בבקשה תלה את המעיל שלך על הוו.
happen|לקרות|v|What will happen next?|מה יקרה אחר כך?
helicopter|מסוק|n|A helicopter flew over our house.|מסוק טס מעל הבית שלנו.
brush|מברשת|n|I need a brush to paint the fence.|אני צריך מברשת כדי לצבוע את הגדר.
burger|המבורגר|n|I ordered a burger with fries.|הזמנתי המבורגר עם צ'יפס.
cage|כלוב|n|The bird sings in its cage.|הציפור שרה בכלוב שלה.
high|גבוה, למעלה|a|The kite flew high in the sky.|העפיפון עף גבוה בשמיים.
homemaker|עקרת בית, מנהל משק בית|n|My uncle is a homemaker and cooks every day.|הדוד שלי מנהל את משק הבית ומבשל כל יום.
include|לכלול|v|Does the price include breakfast?|האם המחיר כולל ארוחת בוקר?
information|מידע|n|The website has information about animals.|באתר יש מידע על בעלי חיים.
instead|במקום זאת|d|We had no milk, so we drank juice instead.|לא היה לנו חלב, אז שתינו מיץ במקום.
instructions|הוראות|n|Read the instructions before you start.|קרא את ההוראות לפני שאתה מתחיל.
itself|את עצמו, בעצמו|o|The cat is cleaning itself.|החתול מנקה את עצמו.
captain|קפטן, רב חובל|n|The captain steered the ship.|הקפטן היגה את הספינה.
carpet|שטיח|n|The dog is sleeping on the carpet.|הכלב ישן על השטיח.
cartoon|סרט מצויר|n|My little sister loves this cartoon.|אחותי הקטנה אוהבת את הסרט המצויר הזה.
join|להצטרף|v|Do you want to join our game?|אתה רוצה להצטרף למשחק שלנו?
keyboard|מקלדת|n|I type on the keyboard.|אני מקליד על המקלדת.
kill|להרוג, להמית|v|Too much water can kill a plant.|יותר מדי מים יכולים להמית צמח.
large|גדול, רחב ממדים|a|An elephant is a large animal.|פיל הוא חיה גדולה.
later|מאוחר יותר, אחר כך|d|I will call you later.|אתקשר אליך אחר כך.
chain|שלשלת|n|The bike has a metal chain.|לאופניים יש שלשלת מתכת.
cheek|לחי|n|She kissed the baby on the cheek.|היא נישקה את התינוק על הלחי.
chest|חזה|n|He held the ball to his chest.|הוא החזיק את הכדור צמוד לחזה.`,
`feeling|הרגשה|n|I had a strange feeling.|הייתה לי הרגשה מוזרה.
angry|כועס|a|She was angry at her brother.|היא כעסה על אחיה.
afraid|מפחד|a|He is afraid of spiders.|הוא מפחד מעכבישים.
excited|נרגש|a|I am so excited about the trip.|אני כל כך נרגשת לקראת הטיול.
bored|משועמם|a|I get bored on long drives.|אני משתעמם בנסיעות ארוכות.
surprised|מופתע|a|We were surprised by the news.|הופתענו מהחדשות.
worried|מודאג|a|Mom is worried about the storm.|אמא מודאגת בגלל הסערה.
proud|גאה|a|I am proud of my work.|אני גאה בעבודה שלי.
lonely|בודד|a|The old man felt lonely.|האיש הזקן הרגיש בודד.
nervous|לחוץ|a|I get nervous before a test.|אני נלחץ לפני מבחן.
funny|מצחיק|a|That movie was really funny.|הסרט הזה היה ממש מצחיק.
kind|אדיב|a|She is kind to everyone.|היא אדיבה לכולם.
polite|מנומס|a|Always be polite to guests.|תמיד תהיו מנומסים לאורחים.
honest|ישר|a|Please give me an honest answer.|בבקשה תן לי תשובה כנה.
brave|אמיץ|a|The brave girl saved the cat.|הילדה האמיצה הצילה את החתול.
shy|ביישן|a|He is too shy to sing.|הוא ביישן מדי בשביל לשיר.
lazy|עצלן|a|My lazy cat sleeps all day.|החתול העצלן שלי ישן כל היום.
strong|חזק|a|She is strong enough to lift it.|היא מספיק חזקה כדי להרים את זה.
weak|חלש|a|I felt weak after the flu.|הרגשתי חלשה אחרי השפעת.
healthy|בריא|a|Vegetables keep you healthy.|ירקות שומרים עליכם בריאים.
sick|חולה|a|I stayed home because I was sick.|נשארתי בבית כי הייתי חולה.
pain|כאב|n|I have a pain in my leg.|יש לי כאב ברגל.
headache|כאב ראש|n|Loud noise gives me a headache.|רעש חזק עושה לי כאב ראש.
stomach|קיבה|n|My stomach hurts.|הבטן שלי כואבת.
shoulder|כתף|n|She hurt her shoulder.|היא נפגעה בכתף.
knee|ברך|n|He fell and cut his knee.|הוא נפל ופצע את הברך שלו.
tooth|שן|n|My tooth fell out.|השן שלי נפלה.
blood|דם|n|There was blood on his shirt.|היה דם על החולצה שלו.
medicine|תרופה|n|Take this medicine twice a day.|קחו את התרופה הזאת פעמיים ביום.
doctor|רופא|n|The doctor checked my throat.|הרופא בדק לי את הגרון.
laugh|לצחוק|v|Her jokes make me laugh.|הבדיחות שלה מצחיקות אותי.
cry|לבכות|v|Sad movies make me cry.|סרטים עצובים גורמים לי לבכות.
smile|לחייך|v|Smile for the camera!|חייכו למצלמה!
shout|לצעוק|v|Please don't shout at me.|בבקשה אל תצעק עליי.
whisper|ללחוש|v|She began to whisper a secret.|היא התחילה ללחוש סוד.
hurt|לכאוב|v|Does your arm hurt?|היד שלך כואבת?
feel|להרגיש|v|I feel much better now.|אני מרגיש הרבה יותר טוב עכשיו.
believe|להאמין|v|I believe you.|אני מאמינה לך.
hope|לקוות|v|I hope you win.|אני מקווה שתנצח.
worry|לדאוג|v|Don't worry about it.|אל תדאג בקשר לזה.
share|לחלוק|v|We share a room.|אנחנו חולקים חדר.
hug|לחבק|v|I want to hug my dog.|אני רוצה לחבק את הכלב שלי.
argue|להתווכח|v|My brothers always argue.|האחים שלי תמיד מתווכחים.
agree|להסכים|v|I agree with you.|אני מסכים איתך.
promise|להבטיח|v|I promise to call you.|אני מבטיחה להתקשר אליך.
apologize|להתנצל|v|You should apologize to her.|כדאי לך להתנצל בפניה.
forgive|לסלוח|v|Please forgive me.|בבקשה תסלח לי.
trust|לסמוך על|v|You can trust me.|אתה יכול לסמוך עליי.
secret|סוד|n|Can you keep a secret?|אתה יודע לשמור סוד?
advice|עצה|n|She gave me good advice.|היא נתנה לי עצה טובה.
habit|הרגל|n|Reading is a good habit.|קריאה היא הרגל טוב.
dream|חלום|n|I had a weird dream.|חלמתי חלום מוזר.
memory|זיכרון|n|That is my favorite memory.|זה הזיכרון האהוב עליי.
luck|מזל|n|Good luck on your test!|בהצלחה במבחן!
weight|משקל|n|The bag's weight is two kilos.|המשקל של התיק הוא שני קילו.
height|גובה|n|What is the height of that wall?|מה הגובה של הקיר הזה?
enough|מספיק|d|We have enough chairs.|יש לנו מספיק כיסאות.
almost|כמעט|d|I almost missed the bus.|כמעט פספסתי את האוטובוס.
maybe|אולי|d|Maybe we can go tomorrow.|אולי נוכל ללכת מחר.
suddenly|פתאום|d|Suddenly the lights went out.|פתאום האורות כבו.
lend|להשאיל|v|Can you lend me your book?|אתה יכול להשאיל לי את הספר שלך?
invite|להזמין|v|I want to invite my class to the party.|אני רוצה להזמין את הכיתה שלי למסיבה.
village|כפר|n|My grandmother lives in a small village.|סבתא שלי גרה בכפר קטן.
careful|זהיר|a|Be careful when you cross the road.|תיזהר כשאתה חוצה את הכביש.
wallet|ארנק|n|He keeps his money in a wallet.|הוא שומר את הכסף שלו בארנק.
ceiling|תקרה|n|A spider is walking on the ceiling.|עכביש הולך על התקרה.
accept|לקבל|v|Please accept this small gift.|בבקשה קבל את המתנה הקטנה הזאת.
connect|לחבר|v|This cable will connect the phone to the computer.|הכבל הזה יחבר את הטלפון למחשב.
traffic|תנועת כלי רכב|n|There is a lot of traffic in the morning.|יש הרבה תנועה בכבישים בבוקר.
notice|להבחין|v|Did you notice the new sign on the door?|שמת לב לשלט החדש על הדלת?
chew|ללעוס|v|Please chew your food slowly.|בבקשה תלעס את האוכל לאט.
tidy|מסודר|a|Her room is always tidy.|החדר שלה תמיד מסודר.
stir|לערבב|v|Stir the soup with a big spoon.|תערבב את המרק בכף גדולה.
remind|להזכיר|v|Please remind me to call Grandma.|בבקשה תזכיר לי להתקשר לסבתא.
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
burn|לשרוף, לכוות|v|Be careful, the stove can burn you.|זהירות, הכיריים יכולות לכוות אותך.
business|עסק|n|My uncle has a small business.|לדוד שלי יש עסק קטן.
calm|רגוע|a|Stay calm and breathe slowly.|הישארי רגועה ונשמי לאט.
capital|בירה (עיר)|n|Paris is the capital of France.|פריז היא בירת צרפת.
careless|רשלני, לא זהיר|a|He was careless and broke the glass.|הוא לא נזהר ושבר את הכוס.
case|מקרה, נרתיק|n|Put your glasses in the case.|שים את המשקפיים בנרתיק.
cash|מזומן|n|Do you have any cash?|יש לך מזומן?
centimeter|סנטימטר|n|The worm is one centimeter long.|התולעת באורך סנטימטר אחד.
champion|אלוף|n|She is the school chess champion.|היא אלופת השחמט של בית הספר.
childhood|ילדות|n|Grandpa told us about his childhood.|סבא סיפר לנו על הילדות שלו.
church|כנסייה|n|We visited an old church in the village.|ביקרנו בכנסייה עתיקה בכפר.
click|ללחוץ (בעכבר)|v|You can click on the picture to open it.|אפשר ללחוץ על התמונה כדי לפתוח אותה.
coach|מאמן|n|Our coach tells us to run faster.|המאמן שלנו אומר לנו לרוץ מהר יותר.
code|קוד|n|Type the secret code to open the door.|הקלידו את הקוד הסודי כדי לפתוח את הדלת.
comma|פסיק|n|Put a comma after the word "yes".|שימו פסיק אחרי המילה "yes".
compete|להתחרות|v|Ten teams compete in the game.|עשר קבוצות מתחרות במשחק.
contact|קשר, ליצור קשר|v|You can contact me by phone.|אפשר ליצור איתי קשר בטלפון.
continue|להמשיך|v|Let's continue the story tomorrow.|בואו נמשיך את הסיפור מחר.
control|שליטה, לשלוט|v|I can control the toy car with my phone.|אני יכול לשלוט במכונית הצעצוע עם הטלפון שלי.
contents|תוכן העניינים, תוכן|n|Look at the contents page of the book.|תסתכלו בעמוד תוכן העניינים של הספר.
cotton|כותנה|n|My shirt is made of cotton.|החולצה שלי עשויה מכותנה.
course|קורס|n|My mom is taking a cooking course.|אמא שלי לומדת בקורס בישול.
create|ליצור|v|Let's create a poster for our class.|בואו ניצור פוסטר בשביל הכיתה שלנו.
crisp|פריך|a|This apple is crisp and sweet.|התפוח הזה פריך ומתוק.
crossing|מעבר חצייה|n|Wait at the crossing for the green light.|חכו במעבר החצייה לאור הירוק.
daily|יומי|a|Reading is part of my daily routine.|קריאה היא חלק מהשגרה היומית שלי.
deal|עסקה|n|Two books for ten shekels is a good deal.|שני ספרים בעשרה שקלים זו עסקה טובה.
degree|מעלה, תואר|n|Today it is one degree colder than yesterday.|היום קר במעלה אחת יותר מאתמול.
delay|עיכוב|n|There was a delay, so the train came late.|היה עיכוב, אז הרכבת הגיעה באיחור.
description|תיאור|n|Write a short description of your room.|כתבו תיאור קצר של החדר שלכם.
dictation|הכתבה|n|We have an English dictation tomorrow.|יש לנו הכתבה באנגלית מחר.
difficulty|קושי|n|He climbed the hill with difficulty.|הוא טיפס על הגבעה בקושי.
digital|דיגיטלי|a|My grandpa has a new digital camera.|לסבא שלי יש מצלמה דיגיטלית חדשה.
directions|הוראות הגעה, הנחיות|n|We asked a man for directions to the station.|ביקשנו מאיש הוראות הגעה לתחנה.
dirt|לכלוך|n|There is dirt on your shoes.|יש לכלוך על הנעליים שלך.
discount|הנחה|n|We got a discount on the new bike.|קיבלנו הנחה על האופניים החדשים.
discuss|לדון|v|Let's discuss the plan for the trip.|בואו נדון בתוכנית לטיול.
distance|מרחק|n|What is the distance from here to the beach?|מה המרחק מכאן לחוף?
earn|להרוויח|v|I earn money when I walk our neighbor's dog.|אני מרוויח כסף כשאני מוציא לטיול את הכלב של השכנים.
education|חינוך, השכלה|n|Education is important for every child.|חינוך חשוב לכל ילד.
electricity|חשמל|n|The lights went out because there was no electricity.|האורות כבו כי לא היה חשמל.
error|טעות|n|There is an error in my answer.|יש טעות בתשובה שלי.
even|אפילו|d|Even my dad laughed at the joke.|אפילו אבא שלי צחק מהבדיחה.
event|אירוע|n|The school play is a big event.|ההצגה של בית הספר היא אירוע גדול.
everyday|יומיומי|a|Brushing your teeth is an everyday habit.|צחצוח שיניים הוא הרגל יומיומי.
false|לא נכון, שקרי|a|Is the sentence true or false?|המשפט נכון או לא נכון?
familiar|מוכר|a|Her face looks familiar.|הפנים שלה נראות לי מוכרות.
fashion|אופנה|n|My sister loves fashion and clothes.|אחותי אוהבת אופנה ובגדים.
fit|להתאים במידה|v|My old shoes do not fit me.|הנעליים הישנות שלי כבר לא במידה שלי.
flour|קמח|n|We need flour to make a cake.|אנחנו צריכים קמח כדי להכין עוגה.
fog|ערפל|n|We could not see the hills in the fog.|לא יכולנו לראות את הגבעות בערפל.
forward|קדימה|d|Take one step forward.|תעשה צעד אחד קדימה.
friendship|חברות|n|Their friendship started in first grade.|החברות שלהם התחילה בכיתה א'.
fur|פרווה|n|The cat has soft fur.|לחתול יש פרווה רכה.
furniture|רהיטים|n|We bought new furniture for my room.|קנינו רהיטים חדשים לחדר שלי.
gap|רווח, פער|n|There is a gap between his teeth.|יש רווח בין השיניים שלו.
gather|לאסוף, להתאסף|v|We gather around the fire at night.|בלילה אנחנו מתאספים סביב המדורה.
girlfriend|חברה (בת זוג)|n|My big brother has a girlfriend.|לאח הגדול שלי יש חברה.
golden|מוזהב, זהוב|a|The girl has golden hair.|לילדה יש שיער זהוב.
grammar|דקדוק|n|We learn English grammar at school.|אנחנו לומדים דקדוק אנגלי בבית הספר.
guard|שומר|n|A guard stands at the gate.|שומר עומד בשער.
guy|בחור|n|He is a nice guy.|הוא בחור נחמד.
handbag|תיק יד|n|Grandma keeps her keys in her handbag.|סבתא שומרת את המפתחות שלה בתיק היד.
health|בריאות|n|Fruit is good for your health.|פירות טובים לבריאות שלך.
horrible|נורא, איום|a|The medicine has a horrible taste.|לתרופה יש טעם נורא.
himself|בעצמו, את עצמו|o|He made the cake himself.|הוא הכין את העוגה בעצמו.
herself|בעצמה, את עצמה|o|She looked at herself in the mirror.|היא הסתכלה על עצמה במראה.
human|אדם, אנושי|n|A dog can smell better than a human.|כלב יכול להריח טוב יותר מאדם.
hunger|רעב|n|The baby cried from hunger.|התינוק בכה מרעב.
hunting|ציד|n|Lions go hunting at night.|אריות יוצאים לציד בלילה.
ignore|להתעלם|v|Please don't ignore me.|בבקשה אל תתעלם ממני.
housewife|עקרת בית|n|My grandma was a housewife.|סבתא שלי הייתה עקרת בית.
insult|להעליב|v|It is not nice to insult your friends.|לא יפה להעליב את החברים שלך.
introduce|להציג, להכיר|v|Let me introduce my friend Dan.|הרשו לי להכיר לכם את החבר שלי דן.
included|כלול|a|Breakfast is included in the price.|ארוחת הבוקר כלולה במחיר.
ingredient|מרכיב|n|Flour is the main ingredient in bread.|קמח הוא המרכיב העיקרי בלחם.
joy|שמחה|n|She jumped with joy.|היא קפצה משמחה.
jewelry|תכשיטים|n|Mom keeps her jewelry in a small box.|אמא שומרת את התכשיטים שלה בקופסה קטנה.
kilogram|קילוגרם|n|This bag of rice weighs one kilogram.|שקית האורז הזאת שוקלת קילוגרם אחד.
kilometer|קילומטר|n|My school is one kilometer from home.|בית הספר שלי נמצא קילומטר אחד מהבית.
land|אדמה, יבשה|n|The farmer works on his land.|החקלאי עובד על האדמה שלו.
laptop|מחשב נייד|n|Dad works on his laptop.|אבא עובד על המחשב הנייד שלו.
latest|האחרון, החדש ביותר|a|Have you seen the latest movie?|ראית את הסרט החדש ביותר?
lift|להרים|v|Can you lift this bag?|אתה יכול להרים את התיק הזה?
level|רמה, שלב|n|I finished the next level of the game.|סיימתי את השלב הבא במשחק.
lead|להוביל|v|The teacher will lead us to the bus.|המורה תוביל אותנו לאוטובוס.
mail|דואר|n|Did we get any mail today?|קיבלנו דואר היום?
liter|ליטר|n|We need one liter of milk.|אנחנו צריכים ליטר אחד של חלב.
main|ראשי, עיקרי|a|The main door is closed.|הדלת הראשית סגורה.
marry|להתחתן|v|My uncle wants to marry his girlfriend.|הדוד שלי רוצה להתחתן עם החברה שלו.
match|משחק (תחרות), גפרור|n|We watched the football match on TV.|צפינו במשחק הכדורגל בטלוויזיה.
maximum|מקסימום|n|Each child can take a maximum of two books.|כל ילד יכול לקחת מקסימום שני ספרים.
medal|מדליה|n|She won a gold medal.|היא זכתה במדליית זהב.
medium|בינוני|a|I would like a medium pizza, please.|אני רוצה פיצה בינונית, בבקשה.
midday|צהריים|n|The sun is very hot at midday.|השמש חמה מאוד בצהריים.
mind|שכל, מחשבה|n|She has a sharp mind.|יש לה שכל חד.
minimum|מינימום|n|You need a minimum of ten points to win.|צריך מינימום עשר נקודות כדי לנצח.
mosque|מסגד|n|There is an old mosque in the city.|יש מסגד עתיק בעיר.
muscle|שריר|n|I hurt a muscle in my arm.|נפגע לי שריר ביד.
musical|מוזיקלי|a|My sister is very musical.|אחותי מאוד מוזיקלית.
musician|מוזיקאי|n|The musician played the guitar.|המוזיקאי ניגן בגיטרה.
necklace|שרשרת|n|She wears a silver necklace.|היא עונדת שרשרת כסף.
normally|בדרך כלל|d|I normally walk to school.|בדרך כלל אני הולך לבית הספר ברגל.
noun|שם עצם|n|The word "dog" is a noun.|המילה "כלב" היא שם עצם.
object|חפץ|n|What is that strange object?|מה החפץ המוזר הזה?
officer|קצין, שוטר|n|The police officer helped us.|השוטר עזר לנו.
option|אפשרות|n|We have one more option.|יש לנו עוד אפשרות אחת.
organize|לארגן|v|Let's organize a party.|בואו נארגן מסיבה.
original|מקורי|a|What an original idea!|איזה רעיון מקורי!
package|אריזה, חבילה|n|Read what it says on the package.|תקרא מה כתוב על האריזה.
palace|ארמון|n|The queen lives in a big palace.|המלכה גרה בארמון גדול.
patient|סבלני|a|Be patient, the cake is almost ready.|תהיה סבלני, העוגה כמעט מוכנה.
personal|אישי|a|A diary is very personal.|יומן הוא דבר אישי מאוד.
physical|גופני|a|Running is good physical exercise.|ריצה היא פעילות גופנית טובה.
pleased|מרוצה|a|The teacher was pleased with my work.|המורה הייתה מרוצה מהעבודה שלי.
pleasure|הנאה|n|Reading is a real pleasure.|קריאה היא הנאה אמיתית.
position|מקום, תנוחה|n|Sit in a comfortable position.|שבו בתנוחה נוחה.
preparation|הכנה|n|The party needs a lot of preparation.|המסיבה דורשת הרבה הכנה.
purse|ארנק|n|Mom keeps her money in her purse.|אמא שומרת את הכסף שלה בארנק.
quite|די, למדי|d|The test was quite easy.|המבחן היה די קל.
pure|טהור, נקי|a|The air in the mountains is pure.|האוויר בהרים נקי.
reach|להגיע, להושיט יד|v|I can't reach the top shelf.|אני לא מצליח להגיע למדף העליון.
record|שיא|n|He broke the school record.|הוא שבר את השיא של בית הספר.
recent|עדכני, מהזמן האחרון|a|This is a recent photo of my dog.|זאת תמונה עדכנית של הכלב שלי.
remain|להישאר|v|Please remain in your seats.|בבקשה הישארו במקומות שלכם.
remove|להסיר, להוציא|v|Please remove your shoes at the door.|בבקשה תורידו את הנעליים ליד הדלת.
reply|לענות, להשיב|v|Please reply to my message.|בבקשה תענה להודעה שלי.
roll|לגלגל, להתגלגל|v|The ball will roll down the hill.|הכדור יתגלגל במורד הגבעה.
row|שורה|n|I sit in the first row.|אני יושב בשורה הראשונה.
score|ניקוד, תוצאה|n|What is the score of the game?|מה התוצאה של המשחק?
scream|לצרוח|v|The children scream on the roller coaster.|הילדים צורחים ברכבת ההרים.
secretary|מזכיר, מזכירה|n|The school secretary gave me a note.|המזכירה של בית הספר נתנה לי פתק.
selfie|סלפי|n|We took a selfie at the beach.|צילמנו סלפי בחוף.
serve|להגיש|v|They serve lunch at twelve.|הם מגישים ארוחת צהריים בשתים עשרה.
sheet|סדין, דף|n|Take a sheet of paper.|קחו דף נייר.
shoot|לירות, לבעוט לשער|v|He can shoot the ball into the goal.|הוא יודע לבעוט את הכדור לתוך השער.
silver|כסוף, עשוי כסף|a|She has a silver ring.|יש לה טבעת כסף.
sink|כיור|n|Put the dishes in the sink.|שימו את הכלים בכיור.
sir|אדוני|n|Excuse me, sir, is this your bag?|סליחה, אדוני, זה התיק שלך?
skate|להחליק (בגלגיליות או על קרח)|v|I can skate on ice.|אני יודע להחליק על הקרח.
ski|לגלוש בסקי|v|We ski in the mountains in winter.|אנחנו גולשים בסקי בהרים בחורף.
slice|פרוסה|n|Can I have a slice of bread?|אפשר לקבל פרוסת לחם?
soldier|חייל|n|The soldier wore a green uniform.|החייל לבש מדים ירוקים.
sort|למיין|v|Sort the cards by color.|מיינו את הקלפים לפי צבע.
speech|נאום|n|The principal gave a short speech.|המנהלת נשאה נאום קצר.
spot|כתם, נקודה|n|There is a spot on my shirt.|יש כתם על החולצה שלי.
steam|אדים|n|Steam came out of the hot soup.|אדים יצאו מהמרק החם.
synagogue|בית כנסת|n|We walk to the synagogue on Saturday.|אנחנו הולכים לבית הכנסת בשבת.
tear|דמעה|n|A tear ran down her face.|דמעה זלגה על הפנים שלה.
style|סגנון|n|I like your style.|אני אוהב את הסגנון שלך.
suppose|להניח, לשער|v|I suppose you are right.|אני מניח שאתה צודק.
teenager|נער מתבגר, נערה מתבגרת|n|My cousin is a teenager.|בת הדודה שלי נערה מתבגרת.
theater|תיאטרון|n|We saw a play at the theater.|ראינו הצגה בתיאטרון.
thought|מחשבה|n|I had a happy thought.|הייתה לי מחשבה שמחה.
themselves|בעצמם, בעצמן|o|The children made the cake themselves.|הילדים הכינו את העוגה בעצמם.
toothpaste|משחת שיניים|n|We need a new tube of toothpaste.|אנחנו צריכים שפופרת חדשה של משחת שיניים.
toothache|כאב שיניים|n|I have a bad toothache.|יש לי כאב שיניים חזק.
tin|קופסת פח|n|The cookies are in a tin.|העוגיות בקופסת פח.
title|שם (של ספר או סרט), כותרת|n|What is the title of the book?|מה השם של הספר?
tour|סיור|n|We went on a tour of the museum.|יצאנו לסיור במוזיאון.
tram|רכבת קלה, חשמלית|n|We took the tram to the city center.|נסענו ברכבת הקלה למרכז העיר.
treat|פינוק|n|Ice cream is a special treat.|גלידה היא פינוק מיוחד.
trouble|צרה, בעיה|n|The puppy got into trouble.|הגור הסתבך בצרות.
traveler|מטייל, נוסע|n|The traveler carried a big bag.|המטייל סחב תיק גדול.
tune|מנגינה, לחן|n|She hummed a happy tune.|היא זמזמה מנגינה שמחה.
turning|פנייה|n|Take the second turning on the left.|תפנה בפנייה השנייה שמאלה.
unit|יחידה|n|We finished the first unit of the book.|סיימנו את היחידה הראשונה בספר.
usual|הרגיל, כרגיל|a|I woke up later than usual.|קמתי מאוחר מהרגיל.
unpleasant|לא נעים|a|The smell was unpleasant.|הריח היה לא נעים.
website|אתר אינטרנט|n|Our school has a new website.|לבית הספר שלנו יש אתר אינטרנט חדש.
weekly|שבועי|a|We have a weekly spelling test.|יש לנו מבחן כתיב שבועי.
warn|להזהיר|v|I want to warn you about the dog.|אני רוצה להזהיר אותך מפני הכלב.
virus|נגיף, וירוס|n|A virus can make you sick.|נגיף יכול לגרום לך לחלות.
whose|של מי|o|Whose book is this?|של מי הספר הזה?
wonder|לתהות|v|I wonder where my cat is.|אני תוהה איפה החתול שלי.
worse|גרוע יותר|a|My cold is worse today.|ההצטננות שלי גרועה יותר היום.
yourselves|בעצמכם, את עצמכם|o|Did you build it yourselves?|בניתם את זה בעצמכם?
absent|נעדר|a|Tom was absent from school today.|תום נעדר היום מבית הספר.
ahead|קדימה, לפנים|d|Look straight ahead.|תסתכל ישר קדימה.
adopt|לאמץ|v|We want to adopt a dog.|אנחנו רוצים לאמץ כלב.
aid|עזרה, סיוע|n|The nurse gave him first aid.|האחות נתנה לו עזרה ראשונה.
aircraft|כלי טיס, מטוס|n|The aircraft landed safely.|המטוס נחת בשלום.
adapt|להסתגל|v|Animals adapt to the cold.|בעלי חיים מסתגלים לקור.
alike|דומים|a|The two sisters look alike.|שתי האחיות נראות דומות.
alcohol|אלכוהול|n|Children should not drink alcohol.|ילדים לא צריכים לשתות אלכוהול.
anniversary|יום נישואים, יום שנה|n|My parents had their wedding anniversary yesterday.|להורים שלי היה אתמול יום נישואים.
apart|בנפרד, זה מזה|d|The two houses are far apart.|שני הבתים רחוקים זה מזה.
appear|להופיע|v|The stars appear at night.|הכוכבים מופיעים בלילה.
attach|לצרף, להצמיד|v|Please attach a photo to the form.|בבקשה צרפו תמונה לטופס.
arrest|לעצור (משטרה)|v|The police will arrest the thief.|המשטרה תעצור את הגנב.
attack|לתקוף|v|The dog did not attack the cat.|הכלב לא תקף את החתול.
attend|להשתתף, לבקר ב-|v|All the students attend the school party.|כל התלמידים משתתפים במסיבת בית הספר.
award|פרס|n|She won an award for her story.|היא זכתה בפרס על הסיפור שלה.
aware|מודע|a|Are you aware of the danger?|אתה מודע לסכנה?
basin|כיור, קערה|n|Wash your hands in the basin.|שטוף את הידיים בכיור.
basic|בסיסי|a|I know some basic words in French.|אני יודע כמה מילים בסיסיות בצרפתית.
balance|שיווי משקל, איזון|n|I lost my balance and fell.|איבדתי את שיווי המשקל ונפלתי.
beat|לנצח|v|Our team beat them in the final.|הקבוצה שלנו ניצחה אותם בגמר.
base|בסיס|n|The base of the lamp is heavy.|הבסיס של המנורה כבד.
become|להפוך ל-, להיות|v|The little caterpillar will become a butterfly.|הזחל הקטן יהפוך לפרפר.
bill|חשבון|n|Dad paid the bill at the restaurant.|אבא שילם את החשבון במסעדה.
billion|מיליארד|n|The world has about eight billion people.|בעולם יש בערך שמונה מיליארד אנשים.
beyond|מעבר ל-|o|The village is just beyond the hill.|הכפר נמצא ממש מעבר לגבעה.
benefit|יתרון, תועלת|n|One benefit of reading is learning new words.|יתרון אחד של קריאה הוא לימוד מילים חדשות.
blank|ריק|a|Write your name in the blank space.|כתוב את השם שלך במקום הריק.
blind|עיוור|a|The blind man walks with a dog.|האיש העיוור הולך עם כלב.
blame|להאשים|v|Don't blame your brother for your mistake.|אל תאשים את אחיך בטעות שלך.
bomb|פצצה|n|The water balloon fell like a bomb.|בלון המים נפל כמו פצצה.
breath|נשימה|n|Take a deep breath and relax.|קח נשימה עמוקה ותירגע.
builder|בנאי|n|The builder is fixing our roof.|הבנאי מתקן את הגג שלנו.
cabbage|כרוב|n|Grandma makes soup with cabbage.|סבתא מכינה מרק כרוב.
cancel|לבטל|v|They had to cancel the trip because of the rain.|הם נאלצו לבטל את הטיול בגלל הגשם.
career|קריירה|n|She wants a career in music.|היא רוצה קריירה במוזיקה.
cast|צוות שחקנים|n|The whole cast came on stage at the end.|כל צוות השחקנים עלה לבמה בסוף.
cause|לגרום|v|Ice on the road can cause accidents.|קרח על הכביש יכול לגרום לתאונות.
celebrity|ידוען, סלבריטי|n|A famous celebrity visited our school.|ידוען מפורסם ביקר בבית הספר שלנו.
chapter|פרק|n|We read one chapter every night.|אנחנו קוראים פרק אחד כל לילה.
chart|תרשים, טבלה|n|The chart shows how tall we are.|התרשים מראה כמה אנחנו גבוהים.
cheerful|עליז, שמח|a|Our teacher is always cheerful.|המורה שלנו תמיד עליזה.
chemistry|כימיה|n|My sister studies chemistry at school.|אחותי לומדת כימיה בבית הספר.`,
`journey|מסע|n|The journey took two days.|המסע נמשך יומיים.
passport|דרכון|n|Don't lose your passport.|אל תאבד את הדרכון שלך.
luggage|מזוודות|n|Our luggage is at the airport.|המזוודות שלנו בשדה התעופה.
airport|שדה תעופה|n|We arrived at the airport early.|הגענו לשדה התעופה מוקדם.
flight|טיסה|n|Our flight leaves at noon.|הטיסה שלנו יוצאת בצהריים.
station|תחנה|n|The train station is close.|תחנת הרכבת קרובה.
bridge|גשר|n|We crossed the old bridge.|חצינו את הגשר הישן.
map|מפה|n|Look at the map.|תסתכל על המפה.
guide|מדריך|n|Our guide told us a story.|המדריך שלנו סיפר לנו סיפור.
tourist|תייר|n|A tourist asked me for directions.|תייר שאל אותי איך מגיעים.
abroad|בחו״ל|d|We travel abroad every summer.|אנחנו נוסעים לחו״ל כל קיץ.
weather|מזג אוויר|n|The weather is lovely today.|מזג האוויר נפלא היום.
storm|סערה|n|The storm broke a big tree.|הסערה שברה עץ גדול.
cloud|ענן|n|That cloud looks like a dog.|הענן ההוא נראה כמו כלב.
wind|רוח|n|The wind blew my hat away.|הרוח העיפה לי את הכובע.
rain|גשם|n|The rain stopped at noon.|הגשם הפסיק בצהריים.
snow|שלג|n|The snow covered the road.|השלג כיסה את הכביש.
lightning|ברק|n|We saw lightning over the sea.|ראינו ברק מעל הים.
thunder|רעם|n|The thunder scared my dog.|הרעם הבהיל את הכלב שלי.
season|עונה|n|Spring is my favorite season.|האביב היא העונה האהובה עליי.
forest|יער|n|Bears live in the forest.|דובים חיים ביער.
mountain|הר|n|We climbed the mountain.|טיפסנו על ההר.
valley|עמק|n|A river runs through the valley.|נהר זורם בעמק.
river|נהר|n|The river is very wide.|הנהר רחב מאוד.
lake|אגם|n|We swam in the lake.|שחינו באגם.
ocean|אוקיינוס|n|Whales live in the ocean.|לווייתנים חיים באוקיינוס.
island|אי|n|They live on a small island.|הם גרים על אי קטן.
desert|מדבר|n|It rarely rains in the desert.|כמעט אף פעם לא יורד גשם במדבר.
beach|חוף|n|We played on the beach.|שיחקנו על החוף.
sand|חול|n|The sand was very hot.|החול היה חם מאוד.
shell|צדף|n|I found a shell by the sea.|מצאתי צדף ליד הים.
leaf|עלה|n|A yellow leaf fell on my head.|עלה צהוב נפל לי על הראש.
branch|ענף|n|The bird sat on a branch.|הציפור ישבה על ענף.
root|שורש|n|This root is very deep.|השורש הזה עמוק מאוד.
grass|דשא|n|The grass is wet.|הדשא רטוב.
insect|חרק|n|An insect landed on my arm.|חרק נחת לי על היד.
butterfly|פרפר|n|A butterfly landed on the flower.|פרפר נחת על הפרח.
camel|גמל|n|We rode a camel in the desert.|רכבנו על גמל במדבר.
danger|סכנה|n|There is danger in these waters.|יש סכנה במים האלה.
adventure|הרפתקה|n|Our trip was a real adventure.|הטיול שלנו היה הרפתקה אמיתית.
tent|אוהל|n|We slept in a tent.|ישנו באוהל.
wild|פראי|a|Wild animals live here.|חיות פרא חיות כאן.
deep|עמוק|a|The pool is very deep.|הבריכה עמוקה מאוד.
narrow|צר|a|This road is very narrow.|הכביש הזה צר מאוד.
wide|רחב|a|The door is wide.|הדלת רחבה.
dangerous|מסוכן|a|This road is dangerous at night.|הכביש הזה מסוכן בלילה.
foreign|זר|a|She speaks a foreign language.|היא מדברת בשפה זרה.
crowded|צפוף|a|The bus was very crowded.|האוטובוס היה צפוף מאוד.
empty|ריק|a|The room was empty.|החדר היה ריק.
far|רחוק|a|The city is far from here.|העיר רחוקה מכאן.
travel|לטייל|v|I love to travel by train.|אני אוהב לטייל ברכבת.
arrive|להגיע|v|We will arrive at eight.|נגיע בשמונה.
leave|לעזוב|v|We must leave right now.|אנחנו חייבים ללכת עכשיו.
cross|לחצות|v|Look before you cross the road.|תסתכל לפני שאתה חוצה את הכביש.
climb|לטפס|v|Monkeys climb trees.|קופים מטפסים על עצים.
swim|לשחות|v|Can you swim?|אתה יודע לשחות?
follow|לעקוב אחרי|v|Follow me to the door.|לך אחריי עד הדלת.
pack|לארוז|v|I need to pack my bag.|אני צריך לארוז את התיק שלי.
explore|לחקור|v|Let's explore the cave.|בוא נחקור את המערה.
grow|לגדול|v|Flowers grow fast in spring.|פרחים גדלים מהר באביב.
receive|לקבל|v|Did you receive my letter?|קיבלת את המכתב שלי?
prepare|להכין|v|We prepare for the test together.|אנחנו מתכוננים למבחן יחד.
support|לתמוך|v|Good friends support each other.|חברים טובים תומכים זה בזה.
describe|לתאר|v|Can you describe your new school?|אתה יכול לתאר את בית הספר החדש שלך?
fence|גדר|n|The cat jumped over the fence.|החתול קפץ מעל הגדר.
ladder|סולם|n|He climbed the ladder to the roof.|הוא טיפס בסולם לגג.
scissors|מספריים|n|Use the scissors to cut the paper.|השתמש במספריים כדי לגזור את הנייר.
envelope|מעטפה|n|Put the letter in the envelope.|שים את המכתב במעטפה.
nearby|בקרבת מקום|d|My aunt lives nearby, so we often visit.|הדודה שלי גרה קרוב, אז אנחנו מבקרים אותה הרבה.
receipt|קבלה|n|Keep the receipt in case the shoes are too small.|שמור את הקבלה למקרה שהנעליים קטנות מדי.
repair|לתקן|v|Dad can repair my broken bike.|אבא יכול לתקן את האופניים השבורים שלי.
forecast|תחזית|n|The forecast says it will rain tomorrow.|התחזית אומרת שמחר ירד גשם.
prevent|למנוע|v|Washing your hands can prevent illness.|שטיפת ידיים יכולה למנוע מחלות.
translate|לתרגם|v|Can you translate this letter into Hebrew?|אתה יכול לתרגם את המכתב הזה לעברית?
responsible|אחראי|a|She is responsible for feeding the dog.|היא אחראית להאכיל את הכלב.
sew|לתפור|v|My aunt can sew a button on a shirt.|הדודה שלי יודעת לתפור כפתור לחולצה.
parcel|חבילה|n|A parcel arrived for you this morning.|חבילה הגיעה בשבילך הבוקר.
harvest|קציר|n|The farmers finished the wheat harvest in spring.|החקלאים סיימו את קציר החיטה באביב.
accompany|ללוות|v|My mom will accompany us on the trip.|אמא שלי תלווה אותנו בטיול.
adjust|לכוונן|v|You can adjust the seat to your height.|אפשר לכוונן את המושב לגובה שלך.
admit|להודות|v|He did not want to admit his mistake.|הוא לא רצה להודות בטעות שלו.
advertise|לפרסם|v|Companies advertise their products on TV.|חברות מפרסמות את המוצרים שלהן בטלוויזיה.
alter|לשנות|v|We had to alter our plans because of the rain.|היינו צריכים לשנות את התוכניות שלנו בגלל הגשם.
announce|להכריז|v|The principal will announce the winners tomorrow.|המנהלת תכריז מחר על הזוכים.
approximately|בערך|d|The trip takes approximately two hours.|הנסיעה נמשכת בערך שעתיים.
battle|קרב|n|The two armies fought a long battle.|שני הצבאות נלחמו בקרב ארוך.
beauty|יופי|n|We loved the beauty of the sea.|אהבנו את היופי של הים.
belief|אמונה|n|She has a strong belief in herself.|יש לה אמונה חזקה בעצמה.
cancer|סרטן (מחלה)|n|Smoking can cause cancer.|עישון יכול לגרום לסרטן.
channel|ערוץ|n|What channel is the cartoon on?|באיזה ערוץ מוצג הסרט המצויר?
charge|להטעין|v|I need to charge my phone.|אני צריך להטעין את הטלפון שלי.
combine|לשלב, לחבר|v|Let's combine the red and the blue paint.|בואו נשלב את הצבע האדום ואת הכחול.
communication|תקשורת|n|Good communication helps a team win.|תקשורת טובה עוזרת לקבוצה לנצח.
connection|חיבור, קשר|n|The internet connection is very slow.|החיבור לאינטרנט איטי מאוד.
contract|חוזה|n|The player signed a contract with the team.|השחקן חתם על חוזה עם הקבוצה.
credit|אשראי|n|Dad paid with a credit card.|אבא שילם בכרטיס אשראי.
death|מוות|n|The death of our old dog made us very sad.|המוות של הכלב הזקן שלנו העציב אותנו מאוד.
demand|לדרוש|v|The workers demand more money.|העובדים דורשים יותר כסף.
dependent|תלוי|a|A baby is dependent on its parents.|תינוק תלוי בהורים שלו.
differently|אחרת, באופן שונה|d|My sister and I dress differently.|אחותי ואני מתלבשות אחרת.
diploma|תעודה|n|My brother got his diploma at the end of high school.|אחי קיבל את התעודה שלו בסוף התיכון.
doubt|ספק|n|There is no doubt that she will win.|אין ספק שהיא תנצח.
due|צריך להגיש, צפוי|a|The homework is due on Monday.|צריך להגיש את שיעורי הבית ביום שני.
duty|חובה, תפקיד|n|It is my duty to feed the cat.|התפקיד שלי הוא להאכיל את החתול.
effect|השפעה|n|The medicine had a good effect.|לתרופה הייתה השפעה טובה.
employ|להעסיק|v|The shop will employ two new workers.|החנות תעסיק שני עובדים חדשים.
equipment|ציוד|n|We packed our camping equipment.|ארזנו את ציוד הקמפינג שלנו.
exact|מדויק|a|What is the exact time?|מה השעה המדויקת?
examine|לבדוק|v|The doctor will examine your ear.|הרופא יבדוק לך את האוזן.
explanation|הסבר|n|The teacher gave a clear explanation.|המורה נתנה הסבר ברור.
express|להביע|v|Drawing helps me express my feelings.|ציור עוזר לי להביע את הרגשות שלי.
extremely|מאוד, ביותר|d|The test was extremely easy.|המבחן היה קל מאוד.
frame|מסגרת|n|The photo is in a gold frame.|התמונה נמצאת במסגרת זהב.
fully|לגמרי, במלואו|d|The battery is fully charged.|הסוללה טעונה לגמרי.
gain|לצבור, להשיג|v|You gain points for every right answer.|אתה צובר נקודות על כל תשובה נכונה.
general|כללי|a|The teacher asked a general question.|המורה שאלה שאלה כללית.
god|אל|n|Poseidon was the Greek god of the sea.|פוסידון היה אל הים היווני.
hardly|בקושי|d|I can hardly see in the dark.|אני בקושי רואה בחושך.
hearing|שמיעה|n|Owls have very good hearing.|לינשופים יש שמיעה טובה מאוד.
heavily|בכבדות, בחוזקה|d|It rained heavily all night.|ירד גשם חזק כל הלילה.
highway|כביש מהיר|n|The cars drive fast on the highway.|המכוניות נוסעות מהר בכביש המהיר.
image|תמונה, דמות|n|I saw my image in the water.|ראיתי את הדמות שלי במים.
immediate|מיידי|a|We need an immediate answer.|אנחנו צריכים תשובה מיידית.
importance|חשיבות|n|The teacher spoke about the importance of sleep.|המורה דיברה על החשיבות של שינה.
inform|להודיע|v|Please inform the teacher if you are late.|בבקשה תודיע למורה אם אתה מאחר.
inner|פנימי|a|The inner part of the fruit is sweet.|החלק הפנימי של הפרי מתוק.
international|בינלאומי|a|We went to an international food fair.|הלכנו ליריד אוכל בינלאומי.
interval|הפסקה, מרווח|n|We bought ice cream in the interval.|קנינו גלידה בהפסקה.
jazz|ג'אז|n|My uncle plays jazz on the piano.|הדוד שלי מנגן ג'אז בפסנתר.
jail|כלא|n|The thief went to jail.|הגנב הלך לכלא.
judge|שופט|n|The judge listened to both sides.|השופט הקשיב לשני הצדדים.
largely|בעיקר, במידה רבה|d|The park is largely empty in winter.|הפארק ריק ברובו בחורף.
lawyer|עורך דין|n|Her mom is a lawyer.|אמא שלה עורכת דין.
limit|גבול, הגבלה|n|There is a limit of two cookies each.|יש הגבלה של שתי עוגיות לכל אחד.
locate|לאתר|v|Can you locate Israel on the map?|אתה יכול לאתר את ישראל במפה?
manage|להצליח (לעשות), לנהל|v|Did you manage to finish your homework?|הצלחת לסיים את שיעורי הבית?
military|צבאי|a|My brother wears a military uniform.|אחי לובש מדים צבאיים.
mostly|בעיקר|d|The sky was mostly blue today.|השמיים היו בעיקר כחולים היום.
murder|רצח|n|The detective solved the murder.|הבלש פענח את הרצח.
nation|אומה|n|The whole nation watched the game.|כל האומה צפתה במשחק.
nationality|אזרחות, לאום|n|What is your nationality?|מה האזרחות שלך?
neither|אף אחד מהשניים|o|Neither of my friends came.|אף אחד משני החברים שלי לא בא.
noticeboard|לוח מודעות|n|The list is on the noticeboard.|הרשימה תלויה על לוח המודעות.
operate|להפעיל|v|Can you operate this machine?|אתה יודע להפעיל את המכונה הזאת?
organization|ארגון|n|She works for an organization that helps animals.|היא עובדת בארגון שעוזר לבעלי חיים.
owe|להיות חייב|v|I owe you five shekels.|אני חייב לך חמישה שקלים.
passenger|נוסע|n|Every passenger on the bus has a seat.|לכל נוסע באוטובוס יש מושב.
path|שביל|n|We walked along the path in the forest.|הלכנו לאורך השביל ביער.
pattern|דוגמה, דפוס|n|I like the pattern on your shirt.|אני אוהב את הדוגמה על החולצה שלך.
pension|פנסיה|n|My grandpa lives on his pension.|סבא שלי חי מהפנסיה שלו.
period|תקופה|n|We lived in Haifa for a short period.|גרנו בחיפה לתקופה קצרה.
petrol|דלק, בנזין|n|The car needs petrol.|המכונית צריכה דלק.
physics|פיזיקה|n|My brother studies physics.|אחי לומד פיזיקה.
possibility|אפשרות, סיכוי|n|There is a possibility of rain tomorrow.|יש סיכוי לגשם מחר.
potential|פוטנציאל|n|This young player has great potential.|לשחקן הצעיר הזה יש פוטנציאל גדול.
prison|בית סוהר|n|The bad king was sent to prison.|המלך הרע נשלח לבית הסוהר.
professional|מקצועי|a|She is a professional singer.|היא זמרת מקצועית.
property|רכוש|n|This ball is school property.|הכדור הזה הוא רכוש של בית הספר.
proposal|הצעה|n|The class liked my proposal for the trip.|הכיתה אהבה את ההצעה שלי לטיול.
quality|איכות|n|These shoes are of good quality.|הנעליים האלה באיכות טובה.
range|טווח, מגוון|n|The shop has a wide range of toys.|בחנות יש מגוון רחב של צעצועים.
reaction|תגובה|n|His reaction made us laugh.|התגובה שלו הצחיקה אותנו.
reasonable|הגיוני, סביר|a|That is a reasonable price.|זה מחיר סביר.
relations|יחסים|n|The two countries have good relations.|לשתי המדינות יש יחסים טובים.
role|תפקיד|n|She got the main role in the play.|היא קיבלה את התפקיד הראשי בהצגה.
scientific|מדעי|a|We did a scientific experiment in class.|עשינו ניסוי מדעי בכיתה.
select|לבחור, לסמן|v|Select a color for your drawing.|בחרו צבע לציור שלכם.
sense|חוש|n|Dogs have a great sense of smell.|לכלבים יש חוש ריח מצוין.
separate|נפרד|a|We sleep in separate rooms.|אנחנו ישנים בחדרים נפרדים.
sight|מראה, ראייה|n|What a beautiful sight!|איזה מראה יפה!
single|יחיד, אחד|a|I did not make a single mistake.|לא עשיתי אף טעות אחת.
situation|מצב|n|This is a hard situation.|זה מצב קשה.
slim|רזה, תמיר|a|The dancer is tall and slim.|הרקדנית גבוהה ורזה.
software|תוכנה|n|This software helps me learn math.|התוכנה הזאת עוזרת לי ללמוד חשבון.
somehow|איכשהו|d|Somehow we found the way home.|איכשהו מצאנו את הדרך הביתה.
staff|צוות|n|The school staff planned a party.|צוות בית הספר תכנן מסיבה.
standard|רמה, תקן|n|Her work is of a high standard.|העבודה שלה ברמה גבוהה.
state|מדינה (במדינה פדרלית)|n|Texas is a big state.|טקסס היא מדינה גדולה.
strength|כוח|n|He lifted the box with all his strength.|הוא הרים את הקופסה בכל הכוח שלו.
strongly|בתוקף, מאוד|d|I strongly believe in you.|אני מאמין בך מאוד.
surely|בוודאי, בטח|d|Surely you know the answer.|בטח אתה יודע את התשובה.
teaching|הוראה|n|My mom loves teaching.|אמא שלי אוהבת את עבודת ההוראה.
though|למרות ש-|o|I went out, though it was cold.|יצאתי החוצה, למרות שהיה קר.
threat|איום|n|Pollution is a threat to the sea.|זיהום הוא איום על הים.
timetable|לוח זמנים, מערכת שעות|n|Check the timetable for the next bus.|תבדוק בלוח הזמנים מתי האוטובוס הבא.
topic|נושא|n|The topic of my project is space.|הנושא של העבודה שלי הוא החלל.
total|סכום כולל, סך הכול|n|The total is fifty shekels.|הסכום הכולל הוא חמישים שקלים.
trade|מסחר|n|Trade between the two countries grew.|המסחר בין שתי המדינות גדל.
understanding|הבנה|n|She has a good understanding of math.|יש לה הבנה טובה במתמטיקה.
unnecessary|מיותר, לא נחוץ|a|Don't buy unnecessary things.|אל תקנה דברים מיותרים.
volume|עוצמת קול|n|Please turn down the volume.|בבקשה תנמיך את עוצמת הקול.
whether|אם|o|I don't know whether it will rain.|אני לא יודע אם ירד גשם.
whenever|בכל פעם ש-|o|Whenever it rains, I wear boots.|בכל פעם שיורד גשם, אני נועל מגפיים.
widely|באופן נרחב|d|English is widely spoken around the world.|מדברים אנגלית בכל רחבי העולם.
abstract|מופשט|a|She paints abstract pictures.|היא מציירת ציורים מופשטים.
academic|אקדמי, לימודי|a|The academic year starts in September.|שנת הלימודים מתחילה בספטמבר.
accommodation|מקום לינה|n|We found cheap accommodation near the beach.|מצאנו מקום לינה זול ליד החוף.
actual|ממשי, אמיתי|a|The actual size of the whale is huge.|הגודל האמיתי של הלווייתן עצום.
agency|סוכנות|n|We booked the trip through a travel agency.|הזמנו את הטיול דרך סוכנות נסיעות.
alphabetical|אלפביתי|a|Put the names in alphabetical order.|סדרו את השמות לפי סדר אלפביתי.
alternative|חלופה, אפשרות אחרת|n|If it rains, we need an alternative.|אם ירד גשם, נצטרך אפשרות אחרת.
annual|שנתי|a|The school has an annual sports day.|בבית הספר יש יום ספורט שנתי.
anyhow|בכל זאת|d|It was raining, but we went out anyhow.|ירד גשם, אבל בכל זאת יצאנו.
application|בקשה, טופס הרשמה|n|I filled in an application for the summer camp.|מילאתי טופס הרשמה לקייטנה.
apply|להגיש מועמדות, לבקש|v|My sister wants to apply to a music school.|אחותי רוצה להגיש מועמדות לבית ספר למוזיקה.
approve|לאשר|v|The principal must approve the trip.|המנהלת צריכה לאשר את הטיול.
architect|אדריכל|n|The architect drew a plan of the new school.|האדריכל שרטט תוכנית של בית הספר החדש.
arrange|לסדר, לארגן|v|Let's arrange the chairs in a circle.|בואו נסדר את הכיסאות במעגל.
attempt|ניסיון|n|He jumped over the wall on his first attempt.|הוא קפץ מעל הקיר בניסיון הראשון שלו.
attract|למשוך|v|Flowers attract bees.|פרחים מושכים דבורים.
authority|סמכות|n|The principal has the authority to close the school.|למנהלת יש סמכות לסגור את בית הספר.
avatar|דמות (במשחק), אווטאר|n|I chose a funny avatar for the game.|בחרתי דמות מצחיקה למשחק.
basis|בסיס, יסוד|n|Trust is the basis of a good friendship.|אמון הוא הבסיס של חברות טובה.
beneath|מתחת ל-|o|The cat is sleeping beneath the table.|החתול ישן מתחת לשולחן.
bother|להפריע, להטריד|v|Please don't bother me while I'm reading.|בבקשה אל תפריע לי כשאני קורא.
brief|קצר, תמציתי|a|The teacher gave a brief talk.|המורה נתן הרצאה קצרה.
broad|רחב, נרחב|a|The river is broad and deep.|הנהר רחב ועמוק.
canal|תעלה|n|Boats sail along the canal.|סירות שטות לאורך התעלה.
candidate|מועמד|n|Each candidate gave a short speech.|כל מועמד נשא נאום קצר.
category|קטגוריה|n|Put each animal in the right category.|שים כל חיה בקטגוריה הנכונה.
central|מרכזי|a|The library is in a central part of the city.|הספרייה נמצאת בחלק מרכזי של העיר.
certainty|ודאות|n|Nobody can say with certainty what will happen.|אף אחד לא יכול לומר בוודאות מה יקרה.
charity|צדקה, ארגון צדקה|n|We gave our old toys to charity.|נתנו את הצעצועים הישנים שלנו לצדקה.
chief|ראש, מנהיג|n|The fire chief spoke to our class.|מפקד הכבאים דיבר עם הכיתה שלנו.`,
`knight|אביר|n|The knight rode a white horse.|האביר רכב על סוס לבן.
castle|טירה|n|The king lives in a castle.|המלך גר בטירה.
sword|חרב|n|He pulled out his sword.|הוא שלף את החרב שלו.
queen|מלכה|n|The queen wore a gold crown.|המלכה חבשה כתר זהב.
treasure|אוצר|n|They found a hidden treasure.|הם מצאו אוצר חבוי.
ghost|רוח רפאים|n|She saw a ghost in the mirror.|היא ראתה רוח רפאים במראה.
stranger|זר (אדם)|n|A stranger knocked on our door.|אדם זר דפק על הדלת שלנו.
enemy|אויב|n|The two kings were each other's enemy.|שני המלכים היו אויבים זה של זה.
hero|גיבור|n|The hero saved the whole town.|הגיבור הציל את כל העיר.
crowd|קהל|n|The crowd began to cheer.|הקהל התחיל להריע.
shadow|צל|n|I saw a shadow on the wall.|ראיתי צל על הקיר.
silence|שקט מוחלט|n|There was a long silence.|היה שקט ארוך.
noise|רעש|n|What was that noise?|מה היה הרעש הזה?
smell|ריח|n|I love the smell of bread.|אני אוהב את הריח של לחם.
sound|צליל|n|We heard a strange sound.|שמענו צליל מוזר.
escape|בריחה|n|Their escape was very clever.|הבריחה שלהם הייתה מאוד חכמה.
clue|רמז|n|The detective found a clue.|הבלש מצא רמז.
mystery|תעלומה|n|The missing key is a mystery.|המפתח שנעלם הוא תעלומה.
journal|יומן|n|She writes in her journal at night.|היא כותבת ביומן שלה בלילה.
author|סופר|n|The author signed my book.|הסופר חתם על הספר שלי.
character|דמות|n|Who is your favorite character?|מי הדמות האהובה עליך?
ending|סוף|n|The ending made me cry.|הסוף גרם לי לבכות.
fear|פחד|n|He hid his fear.|הוא הסתיר את הפחד שלו.
courage|אומץ|n|It takes courage to tell the truth.|צריך אומץ כדי להגיד את האמת.
wisdom|חוכמה|n|The old woman was famous for her wisdom.|האישה הזקנה הייתה מפורסמת בחוכמה שלה.
gentle|עדין|a|Be gentle with the baby.|תהיה עדין עם התינוק.
fierce|עז|a|The fierce dog guards the gate.|הכלב העז שומר על השער.
ancient|עתיק|a|We visited an ancient temple.|ביקרנו במקדש עתיק.
huge|ענק|a|A huge wave hit the boat.|גל ענק פגע בסירה.
tiny|קטנטן|a|Look at that tiny bug!|תראה את החרק הקטנטן הזה!
strange|מוזר|a|What a strange idea!|איזה רעיון מוזר!
magic|קסום|a|He has a magic ring.|יש לו טבעת קסם.
hidden|חבוי|a|We found a hidden door.|מצאנו דלת חבויה.
broken|שבור|a|My phone screen is broken.|המסך של הטלפון שלי שבור.
silent|שותק|a|The room went silent.|החדר השתתק.
terrible|נורא|a|We had terrible weather.|היה לנו מזג אוויר נורא.
wonderful|נפלא|a|What a wonderful surprise!|איזו הפתעה נפלאה!
curious|סקרן|a|The curious cat opened the box.|החתול הסקרן פתח את הקופסה.
clever|פיקח|a|That was a clever plan.|זאת הייתה תוכנית פיקחית.
foolish|טיפשי|a|It was a foolish mistake.|זאת הייתה טעות טיפשית.
gradually|בהדרגה|d|The sky gradually turned dark.|השמיים החשיכו בהדרגה.
slowly|לאט|d|She slowly opened the door.|היא פתחה את הדלת לאט.
quickly|במהירות|d|He quickly ran away.|הוא ברח במהירות.
quietly|בשקט|d|They walked quietly past the door.|הם עברו בשקט ליד הדלת.
finally|לבסוף|d|We finally reached the top.|לבסוף הגענו לפסגה.
through|דרך|o|We walked through the forest.|הלכנו דרך היער.
toward|לעבר|o|She ran toward the gate.|היא רצה לעבר השער.
against|נגד|o|We played against a good team.|שיחקנו נגד קבוצה טובה.
legend|אגדה|n|The old legend is about a dragon.|האגדה העתיקה מספרת על דרקון.
hide|להתחבא|v|Let's hide behind the tree.|בואו נתחבא מאחורי העץ.
chase|לרדוף|v|Dogs love to chase cats.|כלבים אוהבים לרדוף אחרי חתולים.
catch|לתפוס|v|Try to catch the ball.|נסה לתפוס את הכדור.
steal|לגנוב|v|They tried to steal the gold.|הם ניסו לגנוב את הזהב.
search|לחפש|v|We search for the key.|אנחנו מחפשים את המפתח.
discover|לגלות|v|They discover a secret room.|הם מגלים חדר סודי.
destroy|להרוס|v|The fire could destroy the village.|האש עלולה להרוס את הכפר.
protect|להגן|v|The wall will protect the city.|החומה תגן על העיר.
rescue|להציל|v|They came to rescue the sailors.|הם באו להציל את המלחים.
imagine|לדמיין|v|Imagine a world without rain.|דמיינו עולם בלי גשם.
disappear|להיעלם|v|The sun will disappear soon.|השמש תיעלם בקרוב.`,
`opinion|דעה|n|What is your opinion?|מה דעתך?
reason|סיבה|n|Give me one good reason.|תן לי סיבה טובה אחת.
example|דוגמה|n|Can you give an example?|אתה יכול לתת דוגמה?
problem|בעיה|n|We can solve this problem.|אנחנו יכולים לפתור את הבעיה הזאת.
solution|פתרון|n|She found a simple solution.|היא מצאה פתרון פשוט.
choice|בחירה|n|You made a good choice.|עשית בחירה טובה.
decision|החלטה|n|It was a hard decision.|זאת הייתה החלטה קשה.
idea|רעיון|n|That is a great idea!|זה רעיון מצוין!
difference|הבדל|n|What is the difference?|מה ההבדל?
result|תוצאה|n|The result surprised us.|התוצאה הפתיעה אותנו.
purpose|מטרה|n|What is the purpose of this meeting?|מה המטרה של הפגישה הזאת?
chance|הזדמנות|n|Give me one more chance.|תן לי עוד הזדמנות אחת.
experience|ניסיון|n|She has a lot of experience.|יש לה הרבה ניסיון.
knowledge|ידע|n|Books give you knowledge.|ספרים נותנים לך ידע.
ability|יכולת|n|He has the ability to learn fast.|יש לו את היכולת ללמוד מהר.
success|הצלחה|n|Hard work leads to success.|עבודה קשה מובילה להצלחה.
failure|כישלון|n|One failure is not the end.|כישלון אחד הוא לא הסוף.
rule|כלל|n|Every game has a rule like this.|לכל משחק יש כלל כזה.
truth|אמת|n|Tell me the truth.|תגיד לי את האמת.
fact|עובדה|n|That is a fact.|זאת עובדה.
rumor|שמועה|n|I heard a rumor about her.|שמעתי שמועה עליה.
attitude|גישה|n|She has a positive attitude.|יש לה גישה חיובית.
respect|כבוד|n|Treat others with respect.|התייחסו לאחרים בכבוד.
behavior|התנהגות|n|His behavior surprised everyone.|ההתנהגות שלו הפתיעה את כולם.
responsibility|אחריות|n|Feeding the dog is my responsibility.|להאכיל את הכלב זו האחריות שלי.
necessary|הכרחי|a|Is it necessary to wait?|האם הכרחי לחכות?
possible|אפשרי|a|Is it possible to fix it?|אפשר לתקן את זה?
impossible|בלתי אפשרי|a|Nothing is impossible.|שום דבר אינו בלתי אפשרי.
certain|בטוח|a|I am certain about this.|אני בטוח בזה.
obvious|ברור מאליו|a|The answer is obvious.|התשובה ברורה מאליה.
useful|שימושי|a|This is a useful tool.|זה כלי שימושי.
useless|חסר תועלת|a|This old map is useless.|המפה הישנה הזאת חסרת תועלת.
fair|הוגן|a|That is not fair!|זה לא הוגן!
serious|רציני|a|This is a serious problem.|זו בעיה רצינית.
similar|דומה|a|Our bags are similar.|התיקים שלנו דומים.
wrong|שגוי|a|That answer is wrong.|התשובה הזאת שגויה.
correct|נכון|a|Your spelling is correct.|האיות שלך נכון.
popular|פופולרי|a|This game is very popular.|המשחק הזה פופולרי מאוד.
ordinary|רגיל|a|It was an ordinary day.|זה היה יום רגיל.
special|מיוחד|a|Today is a special day.|היום הוא יום מיוחד.
actually|בעצם|d|Actually, I like it.|בעצם, אני אוהב את זה.
probably|כנראה|d|He will probably come.|הוא כנראה יבוא.
especially|במיוחד|d|I love fruit, especially mango.|אני אוהב פירות, במיוחד מנגו.
however|עם זאת|d|It was late; however, we kept going.|היה מאוחר; עם זאת, המשכנו.
therefore|לכן|d|It rained; therefore, we stayed home.|ירד גשם; לכן נשארנו בבית.
although|למרות ש|o|I went although I was tired.|הלכתי למרות שהייתי עייף.
unless|אלא אם כן|o|We will go unless it rains.|נלך, אלא אם כן ירד גשם.
despite|למרות|o|We won despite the rain.|ניצחנו למרות הגשם.
explain|להסביר|v|Can you explain this?|אתה יכול להסביר את זה?
suggest|להציע|v|I suggest a short break.|אני מציע הפסקה קצרה.
decide|להחליט|v|We must decide today.|אנחנו חייבים להחליט היום.
compare|להשוות|v|Compare these two pictures.|השוו בין שתי התמונות האלה.
prefer|להעדיף|v|I prefer tea.|אני מעדיף תה.
consider|לשקול|v|Please consider my offer.|בבקשה תשקול את ההצעה שלי.
improve|לשפר|v|I want to improve my English.|אני רוצה לשפר את האנגלית שלי.
prove|להוכיח|v|Can you prove it?|אתה יכול להוכיח את זה?
convince|לשכנע|v|You can't convince me.|אתה לא יכול לשכנע אותי.
realize|להבין פתאום|v|I realize that I was wrong.|אני מבין שטעיתי.
recognize|לזהות|v|I did not recognize him.|לא זיהיתי אותו.
expect|לצפות|v|I expect a good grade.|אני מצפה לציון טוב.`,
`science|מדע|n|Science explains how things work.|המדע מסביר איך דברים עובדים.
experiment|ניסוי|n|We did an experiment with water.|עשינו ניסוי עם מים.
research|מחקר|n|Her research is about whales.|המחקר שלה עוסק בלווייתנים.
scientist|מדען|n|A scientist studies the stars.|מדען חוקר את הכוכבים.
planet|כוכב לכת|n|Mars is a red planet.|מאדים הוא כוכב לכת אדום.
energy|אנרגיה|n|Solar energy comes from the sun.|אנרגיה סולארית מגיעה מהשמש.
pollution|זיהום|n|Pollution harms the sea.|זיהום פוגע בים.
environment|סביבה|n|We must protect the environment.|אנחנו חייבים לשמור על הסביבה.
climate|אקלים|n|The climate is changing.|האקלים משתנה.
disease|מחלה|n|This disease spreads quickly.|המחלה הזאת מתפשטת מהר.
vaccine|חיסון|n|The vaccine protects children.|החיסון מגן על ילדים.
government|ממשלה|n|The government made a new law.|הממשלה חוקקה חוק חדש.
election|בחירות|n|The election is in November.|הבחירות יהיו בנובמבר.
law|חוק|n|Everyone must obey the law.|כולם חייבים לציית לחוק.
society|חברה (ציבור)|n|Society needs good teachers.|החברה צריכה מורים טובים.
population|אוכלוסייה|n|The city's population is growing.|האוכלוסייה של העיר גדלה.
culture|תרבות|n|I love learning about Thai culture.|אני אוהב ללמוד על התרבות התאילנדית.
tradition|מסורת|n|It is a family tradition.|זו מסורת משפחתית.
religion|דת|n|We studied religion in class.|למדנו על דתות בכיתה.
history|היסטוריה|n|History is my best subject.|היסטוריה היא המקצוע הכי טוב שלי.
century|מאה (שנים)|n|This house is a century old.|הבית הזה בן מאה שנה.
generation|דור|n|Each generation learns something new.|כל דור לומד משהו חדש.
technology|טכנולוגיה|n|Technology changes fast.|הטכנולוגיה משתנה מהר.
device|מכשיר|n|This device measures heat.|המכשיר הזה מודד חום.
machine|מכונה|n|The machine makes coffee.|המכונה מכינה קפה.
engine|מנוע|n|The engine is very loud.|המנוע רועש מאוד.
invention|המצאה|n|The phone was a great invention.|הטלפון היה המצאה גדולה.
factory|מפעל|n|The factory makes toys.|המפעל מייצר צעצועים.
industry|תעשייה|n|The car industry is huge.|תעשיית המכוניות ענקית.
economy|כלכלה|n|Tourism helps the economy.|התיירות עוזרת לכלכלה.
company|חברה (עסק)|n|My aunt runs a small company.|הדודה שלי מנהלת חברה קטנה.
salary|משכורת|n|He earns a good salary.|הוא מרוויח משכורת טובה.
article|כתבה|n|I read an article about bees.|קראתי כתבה על דבורים.
journalist|עיתונאי|n|The journalist asked hard questions.|העיתונאי שאל שאלות קשות.
audience|קהל צופים|n|The audience clapped loudly.|הקהל מחא כפיים בקול רם.
survey|סקר|n|We filled out a survey.|מילאנו סקר.
amount|כמות|n|That is a huge amount of sugar.|זאת כמות עצומה של סוכר.
average|ממוצע|n|My average went up.|הממוצע שלי עלה.
percent|אחוז|n|Ten percent of us were absent.|עשרה אחוזים מאיתנו נעדרו.
global|עולמי|a|This is a global problem.|זאת בעיה עולמית.
local|מקומי|a|We buy from a local farm.|אנחנו קונים מחווה מקומית.
modern|מודרני|a|They live in a modern building.|הם גרים בבניין מודרני.
natural|טבעי|a|This juice is natural.|המיץ הזה טבעי.
public|ציבורי|a|This is a public park.|זה פארק ציבורי.
private|פרטי|a|This is a private beach.|זה חוף פרטי.
powerful|עוצמתי|a|This is a powerful computer.|זה מחשב עוצמתי.
rapid|מהיר|a|The town saw rapid growth.|העיירה גדלה בקצב מהיר.
rare|נדיר|a|This is a rare bird.|זאת ציפור נדירה.
measure|למדוד|v|We measure the room.|אנחנו מודדים את החדר.
invent|להמציא|v|Who did invent the telephone?|מי המציא את הטלפון?
develop|לפתח|v|They develop new games.|הם מפתחים משחקים חדשים.
produce|לייצר|v|Bees produce honey.|דבורים מייצרות דבש.
increase|להגדיל|v|We need to increase our speed.|אנחנו צריכים להגביר את המהירות שלנו.
reduce|להפחית|v|We must reduce waste.|אנחנו חייבים להפחית פסולת.
recycle|למחזר|v|We recycle paper and glass.|אנחנו ממחזרים נייר וזכוכית.
vote|להצביע|v|Adults can vote in the election.|מבוגרים יכולים להצביע בבחירות.
predict|לחזות|v|Nobody can predict the future.|אף אחד לא יכול לחזות את העתיד.
affect|להשפיע על|v|Sleep can affect your mood.|שינה יכולה להשפיע על מצב הרוח שלך.
depend|להיות תלוי|v|Plants depend on the sun.|צמחים תלויים בשמש.
survive|לשרוד|v|Few animals survive here.|מעט בעלי חיים שורדים כאן.`,
`achievement|הישג|n|Winning the prize was a big achievement.|הזכייה בפרס הייתה הישג גדול.
advantage|יתרון|n|Being tall is an advantage in basketball.|להיות גבוה זה יתרון בכדורסל.
disadvantage|חיסרון|n|The only disadvantage is the price.|החיסרון היחיד הוא המחיר.
challenge|אתגר|n|Learning piano is a real challenge.|ללמוד לנגן בפסנתר זה אתגר אמיתי.
consequence|השלכה|n|Every choice has a consequence.|לכל בחירה יש השלכה.
conscience|מצפון|n|My conscience told me to return it.|המצפון שלי אמר לי להחזיר את זה.
curiosity|סקרנות|n|Curiosity drives every scientist.|סקרנות מניעה כל מדען.
determination|נחישות|n|Her determination helped her win.|הנחישות שלה עזרה לה לנצח.
embarrassment|מבוכה|n|His face went red with embarrassment.|הפנים שלו האדימו ממבוכה.
encouragement|עידוד|n|A little encouragement goes a long way.|קצת עידוד עושה הרבה.
independence|עצמאות|n|Teens want more independence.|בני נוער רוצים יותר עצמאות.
influence|השפעה|n|Friends have a big influence on us.|לחברים יש השפעה גדולה עלינו.
opportunity|הזדמנות פז|n|This is a great opportunity.|זאת הזדמנות נהדרת.
perspective|נקודת מבט|n|Try to see it from her perspective.|נסה לראות את זה מנקודת המבט שלה.
prejudice|דעה קדומה|n|Prejudice hurts people.|דעות קדומות פוגעות באנשים.
privilege|זכות יתר|n|It is a privilege to be here.|זאת זכות גדולה להיות כאן.
recommendation|המלצה|n|Thanks for the book recommendation.|תודה על המלצת הספר.
sacrifice|הקרבה|n|Parents often make a sacrifice for their kids.|הורים מקריבים הרבה למען הילדים שלהם.
strategy|אסטרטגיה|n|We need a better strategy.|אנחנו צריכים אסטרטגיה טובה יותר.
tendency|נטייה|n|He has a tendency to arrive late.|יש לו נטייה להגיע באיחור.
accurate|מדויק|a|This clock is very accurate.|השעון הזה מדויק מאוד.
anxious|חרד|a|She felt anxious before the show.|היא הרגישה חרדה לפני ההופעה.
awkward|מביך|a|There was an awkward silence.|הייתה שתיקה מביכה.
capable|מסוגל|a|You are capable of great things.|אתה מסוגל לדברים גדולים.
confident|בטוח בעצמו|a|She looks confident on stage.|היא נראית בטוחה בעצמה על הבמה.
conscious|מודע|a|He is conscious of his mistakes.|הוא מודע לטעויות שלו.
convenient|נוח|a|This bus is very convenient.|האוטובוס הזה מאוד נוח.
definite|מוחלט|a|We need a definite answer.|אנחנו צריכים תשובה סופית.
enthusiastic|נלהב|a|The kids were enthusiastic about the trip.|הילדים התלהבו מהטיול.
essential|חיוני|a|Water is essential for life.|מים חיוניים לחיים.
generous|נדיב|a|She is a generous friend.|היא חברה נדיבה.
independent|עצמאי|a|She is an independent thinker.|היא חושבת באופן עצמאי.
inevitable|בלתי נמנע|a|Change is inevitable.|שינוי הוא בלתי נמנע.
reliable|אמין|a|He is a reliable friend.|הוא חבר אמין.
stubborn|עקשן|a|My stubborn brother never gives up.|אחי העקשן אף פעם לא מוותר.
sufficient|מספק|a|One cup is sufficient.|כוס אחת מספיקה.
unique|ייחודי|a|Every snowflake is unique.|כל פתית שלג הוא ייחודי.
vulnerable|פגיע|a|Baby birds are vulnerable.|גוזלים הם פגיעים.
absolutely|בהחלט|d|You are absolutely right.|אתה צודק בהחלט.
definitely|בוודאות|d|I will definitely be there.|אני בהחלט אהיה שם.
eventually|בסופו של דבר|d|We eventually found the way.|בסופו של דבר מצאנו את הדרך.
immediately|מיד|d|Call me immediately.|תתקשר אליי מיד.
occasionally|לפעמים|d|We occasionally eat out.|לפעמים אנחנו אוכלים בחוץ.
unfortunately|לצערי|d|Unfortunately, the shop was closed.|לצערי, החנות הייתה סגורה.
accomplish|להשיג|v|You can accomplish a lot in a year.|אפשר להשיג הרבה בשנה אחת.
acknowledge|להודות ב|v|You must acknowledge your mistake.|אתה חייב להודות בטעות שלך.
appreciate|להעריך|v|I appreciate your help.|אני מעריך את העזרה שלך.
assume|להניח|v|Don't assume I know.|אל תניח שאני יודע.
avoid|להימנע|v|Try to avoid sugar.|נסה להימנע מסוכר.
concentrate|להתרכז|v|I can't concentrate with this noise.|אני לא מצליח להתרכז עם הרעש הזה.
criticize|למתוח ביקורת|v|Don't criticize her work.|אל תמתח ביקורת על העבודה שלה.
emphasize|להדגיש|v|Teachers emphasize good habits.|מורים מדגישים הרגלים טובים.
exaggerate|להגזים|v|Don't exaggerate the story.|אל תגזים בסיפור.
hesitate|להסס|v|Don't hesitate to ask.|אל תהסס לשאול.
interrupt|להפריע|v|Please don't interrupt me.|בבקשה אל תפריע לי.
overcome|להתגבר|v|We can overcome this fear.|אנחנו יכולים להתגבר על הפחד הזה.
persuade|לשכנע בטיעונים|v|Try to persuade your parents.|נסה לשכנע את ההורים שלך.
pronounce|להגות|v|How do you pronounce this word?|איך הוגים את המילה הזאת?
recommend|להמליץ|v|I recommend this book.|אני ממליץ על הספר הזה.
succeed|להצליח|v|I know you will succeed.|אני יודע שתצליח.`,
`analyze|לנתח|v|Scientists analyze the data carefully.|מדענים מנתחים את הנתונים בקפידה.
conclude|להסיק|v|We can conclude that the plan worked.|אפשר להסיק שהתוכנית הצליחה.
contrast|ניגוד|n|There is a sharp contrast between the two cities.|יש ניגוד חד בין שתי הערים.
define|להגדיר|v|Can you define this term?|אתה יכול להגדיר את המונח הזה?
demonstrate|להדגים|v|The teacher will demonstrate the experiment.|המורה ידגים את הניסוי.
evaluate|לשקול ולהעריך|v|We must evaluate every option.|עלינו לשקול כל אפשרות.
evidence|ראיה|n|There is no evidence against him.|אין שום ראיה נגדו.
assumption|הנחה|n|That assumption turned out to be wrong.|ההנחה הזאת התבררה כשגויה.
illustrate|להמחיש|v|These pictures illustrate the idea.|התמונות האלה ממחישות את הרעיון.
indicate|להצביע על|v|The dark clouds indicate a storm.|העננים הכהים מצביעים על סערה.
interpret|לפרש|v|People interpret the poem differently.|אנשים מפרשים את השיר בדרכים שונות.
justify|להצדיק|v|Nothing can justify such behavior.|שום דבר לא יכול להצדיק התנהגות כזאת.
outline|מתווה|n|Write an outline before the essay.|כתוב מתווה לפני החיבור.
summarize|לסכם|v|Please summarize the article in two lines.|בבקשה סכם את הכתבה בשתי שורות.
argument|טיעון|n|Her argument was very clear.|הטיעון שלה היה ברור מאוד.
paragraph|פסקה|n|The first paragraph is too long.|הפסקה הראשונה ארוכה מדי.
essay|חיבור|n|I wrote an essay about the sea.|כתבתי חיבור על הים.
source|מקור|n|Check the source of this story.|בדוק את המקור של הסיפור הזה.
criticism|ביקורת|n|He did not take the criticism well.|הוא לא קיבל את הביקורת יפה.
approach|דרך פעולה|n|We need a new approach to this problem.|אנחנו צריכים דרך חדשה לגשת לבעיה הזאת.
aspect|היבט|n|Money is only one aspect of the job.|כסף הוא רק היבט אחד של העבודה.
concept|מושג|n|Gravity is a difficult concept.|כוח המשיכה הוא מושג קשה.
context|הקשר|n|The word changes with the context.|המילה משתנה לפי ההקשר.
factor|גורם|n|Sleep is an important factor in health.|שינה היא גורם חשוב בבריאות.
issue|סוגיה|n|Pollution is a serious issue.|זיהום הוא סוגיה רצינית.
method|שיטה|n|This method saves a lot of time.|השיטה הזאת חוסכת הרבה זמן.
principle|עיקרון|n|Honesty is my main principle.|יושר הוא העיקרון המרכזי שלי.
theory|תיאוריה|n|Nobody could prove the theory.|אף אחד לא הצליח להוכיח את התיאוריה.
significant|משמעותי|a|This is a significant change.|זה שינוי משמעותי.
relevant|רלוונטי|a|Your question is very relevant.|השאלה שלך מאוד רלוונטית.
complex|מורכב|a|The human brain is complex.|המוח האנושי מורכב.
consistent|עקבי|a|Be consistent and practice daily.|תהיה עקבי ותתאמן כל יום.
logical|הגיוני|a|That is a logical next step.|זה הצעד ההגיוני הבא.
vague|מעורפל|a|His directions were vague.|ההוראות שלו היו מעורפלות.
valid|תקף|a|Your ticket is still valid.|הכרטיס שלך עדיין תקף.
moreover|יתרה מזאת|d|It is cheap; moreover, it works well.|זה זול; יתרה מזאת, זה עובד טוב.
nevertheless|אף על פי כן|d|She was tired; nevertheless, she finished.|היא הייתה עייפה; אף על פי כן, היא סיימה.
whereas|בעוד ש|d|He likes tea, whereas I prefer coffee.|הוא אוהב תה, בעוד שאני מעדיף קפה.
furthermore|נוסף על כך|d|The hotel is clean; furthermore, it is quiet.|המלון נקי; נוסף על כך, הוא שקט.
consequently|כתוצאה מכך|d|He missed the bus and consequently came late.|הוא פספס את האוטובוס וכתוצאה מכך איחר.
roughly|בערך|d|The trip takes roughly two hours.|הנסיעה נמשכת בערך שעתיים.
mainly|בעיקר|d|The team is mainly young players.|הקבוצה מורכבת בעיקר משחקנים צעירים.
briefly|בקצרה|d|Let me explain it briefly.|תן לי להסביר את זה בקצרה.
contribute|לתרום|v|Everyone can contribute an idea.|כל אחד יכול לתרום רעיון.
establish|לבסס|v|They want to establish clear rules.|הם רוצים לקבוע כללים ברורים.
identify|לאתר ולזהות|v|Can you identify this bird?|אתה יכול לזהות את הציפור הזאת?
involve|לערב|v|The game will involve the whole class.|המשחק ישתף את כל הכיתה.
maintain|לשמור על|v|It is hard to maintain this speed.|קשה לשמור על המהירות הזאת.
obtain|לקבל, להשיג|v|You must obtain permission first.|קודם אתה חייב לקבל רשות.
occur|להתרחש|v|Accidents occur on this road.|תאונות מתרחשות בכביש הזה.
require|לדרוש|v|Good photos require patience.|תמונות טובות דורשות סבלנות.
respond|להגיב|v|She did not respond to my message.|היא לא הגיבה להודעה שלי.
assess|להעריך מצב|v|The doctor will assess the injury.|הרופא יעריך את הפציעה.
clarify|להבהיר|v|Could you clarify your question?|תוכל להבהיר את השאלה שלך?`,
`performance|הופעה|n|Her performance moved everyone.|ההופעה שלה ריגשה את כולם.
rehearsal|חזרה (להצגה)|n|The rehearsal starts at five.|החזרה מתחילה בחמש.
stage|במה|n|He walked nervously onto the stage.|הוא עלה לבמה בעצבנות.
script|תסריט|n|The actor forgot the script.|השחקן שכח את התסריט.
director|במאי|n|The director shouted, "Cut!"|הבמאי צעק: "קאט!"
masterpiece|יצירת מופת|n|This painting is a masterpiece.|הציור הזה הוא יצירת מופת.
exhibition|תערוכה|n|We saw an exhibition of old photos.|ראינו תערוכה של תמונות ישנות.
sculpture|פסל|n|The sculpture stands in the garden.|הפסל עומד בגינה.
novel|רומן|n|I could not put the novel down.|לא יכולתי להניח את הרומן מהיד.
biography|ביוגרפיה|n|She read a biography of Einstein.|היא קראה ביוגרפיה של איינשטיין.
plot|עלילה|n|The plot has a surprising ending.|לעלילה יש סוף מפתיע.
custom|מנהג|n|Every country has its own custom.|לכל מדינה יש מנהג משלה.
heritage|מורשת|n|We are proud of our heritage.|אנחנו גאים במורשת שלנו.
ceremony|טקס|n|The ceremony ended with a song.|הטקס הסתיים בשיר.
identity|זהות|n|Language is part of our identity.|השפה היא חלק מהזהות שלנו.
reputation|מוניטין|n|The school has a good reputation.|לבית הספר יש מוניטין טוב.
headline|כותרת|n|The headline shocked the readers.|הכותרת הזעזעה את הקוראים.
interview|ראיון|n|The interview lasted an hour.|הראיון נמשך שעה.
broadcast|שידור|n|We watched the live broadcast.|צפינו בשידור החי.
advertisement|פרסומת|n|That advertisement is really annoying.|הפרסומת הזאת ממש מעצבנת.
gossip|רכילות|n|I try to stay away from gossip.|אני משתדל להתרחק מרכילות.
ambitious|שאפתן|a|She is ambitious and works hard.|היא שאפתנית ועובדת קשה.
humble|צנוע|a|He stayed humble after the win.|הוא נשאר צנוע אחרי הניצחון.
sensitive|רגיש|a|She is sensitive to loud noise.|היא רגישה לרעש חזק.
cautious|זהיר|a|Be cautious on the wet road.|תהיה זהיר בכביש הרטוב.
embarrassed|נבוך|a|I felt embarrassed by my mistake.|הרגשתי נבוך בגלל הטעות שלי.
exhausted|מותש|a|We were exhausted after the climb.|היינו מותשים אחרי הטיפוס.
frustrated|מתוסכל|a|He got frustrated with the puzzle.|הוא התוסכל מהפאזל.
grateful|אסיר תודה|a|I am grateful for your help.|אני אסיר תודה על העזרה שלך.
jealous|מקנא|a|She was jealous of her sister.|היא קינאה באחותה.
overwhelmed|מוצף|a|I feel overwhelmed by all this homework.|אני מרגיש מוצף מכל שיעורי הבית האלה.
relieved|חש הקלה|a|We were relieved to hear the news.|הרגשנו הקלה כששמענו את החדשות.
encourage|לעודד|v|Good teachers encourage their students.|מורים טובים מעודדים את התלמידים שלהם.
admire|להעריץ|v|I admire your courage.|אני מעריץ את האומץ שלך.
complain|להתלונן|v|Customers often complain about the price.|לקוחות מתלוננים לעיתים קרובות על המחיר.
insist|להתעקש|v|They insist on paying.|הם מתעקשים לשלם.
negotiate|לנהל משא ומתן|v|They had to negotiate a better price.|הם נאלצו לנהל משא ומתן על מחיר טוב יותר.
mention|להזכיר|v|Did she mention the party?|היא הזכירה את המסיבה?
pretend|להעמיד פנים|v|He likes to pretend he is asleep.|הוא אוהב להעמיד פנים שהוא ישן.
reveal|לחשוף|v|The final scene will reveal the truth.|הסצנה האחרונה תחשוף את האמת.
compliment|מחמאה|n|That was a lovely compliment.|זו הייתה מחמאה מקסימה.
conversation|שיחה|n|We had a long conversation.|ניהלנו שיחה ארוכה.
misunderstanding|אי הבנה|n|It was just a misunderstanding.|זו הייתה סתם אי הבנה.`,
`drought|בצורת|n|The drought killed the crops.|הבצורת הרסה את היבולים.
earthquake|רעידת אדמה|n|The earthquake woke the whole city.|רעידת האדמה העירה את כל העיר.
flood|שיטפון|n|The flood destroyed the bridge.|השיטפון הרס את הגשר.
resource|משאב|n|Water is a precious resource.|מים הם משאב יקר ערך.
extinct|נכחד|a|Dinosaurs have been extinct for millions of years.|הדינוזאורים נכחדו לפני מיליוני שנים.
endangered|בסכנת הכחדה|a|The tiger is an endangered animal.|הנמר הוא חיה בסכנת הכחדה.
renewable|מתחדש|a|Wind is a renewable source of energy.|רוח היא מקור אנרגיה מתחדש.
sustainable|בר קיימא|a|We need a sustainable way of life.|אנחנו צריכים אורח חיים בר קיימא.
agriculture|חקלאות|n|Agriculture needs a lot of water.|חקלאות צריכה הרבה מים.
community|קהילה|n|Our community built a new park.|הקהילה שלנו בנתה פארק חדש.
democracy|דמוקרטיה|n|In a democracy people can vote.|בדמוקרטיה אנשים יכולים להצביע.
parliament|פרלמנט|n|The parliament will meet tomorrow.|הפרלמנט יתכנס מחר.
citizen|אזרח|n|Every citizen has a duty to vote.|לכל אזרח יש חובה להצביע.
president|נשיא|n|The president gave a speech.|הנשיא נשא נאום.
minister|שר|n|The minister answered the question.|השר ענה על השאלה.
policy|מדיניות|n|The school changed its policy on phones.|בית הספר שינה את המדיניות שלו לגבי טלפונים.
budget|תקציב|n|We have a small budget for the trip.|יש לנו תקציב קטן לטיול.
poverty|עוני|n|Many families live in poverty.|הרבה משפחות חיות בעוני.
wealth|עושר|n|Wealth does not buy happiness.|עושר לא קונה אושר.
inequality|אי שוויון|n|The report shows growing inequality.|הדוח מראה אי שוויון הולך וגדל.
justice|צדק|n|They marched for justice.|הם צעדו למען הצדק.
freedom|חופש|n|Freedom is worth fighting for.|על חופש שווה להילחם.
protest|מחאה|n|Thousands joined the protest.|אלפים הצטרפו למחאה.
treaty|הסכם בין מדינות|n|The two nations signed a treaty.|שתי המדינות חתמו על הסכם.
border|גבול|n|We crossed the border at night.|חצינו את הגבול בלילה.
empire|אימפריה|n|The Roman empire was huge.|האימפריה הרומית הייתה עצומה.
colony|מושבה|n|It was once a British colony.|פעם זו הייתה מושבה בריטית.
medieval|מימי הביניים|a|The town has a medieval castle.|בעיירה יש טירה מימי הביניים.
revolution|מהפכה|n|The revolution changed the country.|המהפכה שינתה את המדינה.
civilization|ציוויליזציה|n|Egypt had a great civilization.|במצרים הייתה ציוויליזציה גדולה.
ancestor|אב קדמון|n|My ancestor came from Spain.|האב הקדמון שלי הגיע מספרד.
archaeology|ארכאולוגיה|n|She wants to study archaeology.|היא רוצה ללמוד ארכאולוגיה.
immigrant|מהגר|n|His father was an immigrant.|אבא שלו היה מהגר.
refugee|פליט|n|The refugee found a safe home.|הפליט מצא בית בטוח.
conflict|סכסוך|n|The conflict lasted many years.|הסכסוך נמשך שנים רבות.
peace|שלום|n|Everyone hopes for peace.|כולם מקווים לשלום.
crisis|משבר|n|The crisis forced many shops to close.|המשבר אילץ חנויות רבות להיסגר.
disaster|אסון|n|The fire was a terrible disaster.|השריפה הייתה אסון נורא.
impact|השפעה ניכרת|n|The film had a huge impact.|לסרט הייתה השפעה עצומה.
trend|מגמה|n|The trend is moving upward.|המגמה היא כלפי מעלה.
statistics|סטטיסטיקה|n|The statistics surprised everyone.|הנתונים הסטטיסטיים הפתיעו את כולם.
majority|רוב|n|The majority voted yes.|הרוב הצביע בעד.
minority|מיעוט|n|Only a minority agreed.|רק מיעוט הסכים.
urban|עירוני|a|Urban life can be noisy.|החיים בעיר יכולים להיות רועשים.
rural|כפרי|a|She grew up in a rural area.|היא גדלה באזור כפרי.
abolish|לבטל (חוק)|v|They voted to abolish the rule.|הם הצביעו בעד ביטול הכלל.
conquer|לכבוש|v|The army tried to conquer the city.|הצבא ניסה לכבוש את העיר.
migrate|לנדוד|v|Birds migrate south in winter.|ציפורים נודדות דרומה בחורף.
preserve|לשמר|v|We must preserve these old buildings.|עלינו לשמר את הבניינים הישנים האלה.`,
`abandon|לנטוש|v|They had to abandon the ship.|הם נאלצו לנטוש את הספינה.
absurd|אבסורדי|a|What an absurd idea!|איזה רעיון אבסורדי!
abundant|בשפע|a|Fish are abundant in this lake.|יש דגים בשפע באגם הזה.
accumulate|להצטבר|v|Dust will accumulate under the bed.|אבק יצטבר מתחת למיטה.
adequate|מספיק לצורך|a|The room has adequate light.|בחדר יש מספיק אור.
adversity|מצוקה|n|She showed courage in adversity.|היא גילתה אומץ במצוקה.
ambiguous|דו משמעי|a|His reply was ambiguous.|התשובה שלו הייתה דו משמעית.
anticipate|לצפות מראש|v|We did not anticipate this delay.|לא צפינו את העיכוב הזה.
apparent|נראה לעין|a|The problem became apparent quickly.|הבעיה התגלתה מהר.
arbitrary|שרירותי|a|The decision seemed arbitrary.|ההחלטה נראתה שרירותית.
astonishing|מדהים|a|The view from the top was astonishing.|הנוף מהפסגה היה מדהים.
authentic|אותנטי|a|This is an authentic Italian recipe.|זה מתכון איטלקי אותנטי.
bewildered|מבולבל לגמרי|a|He looked bewildered by the question.|הוא נראה מבולבל לגמרי מהשאלה.
bizarre|מוזר מאוד|a|What a bizarre dream!|איזה חלום מוזר!
blunt|בוטה|a|Sorry to be blunt about it.|סליחה שאני בוטה בעניין הזה.
compassion|חמלה|n|She treated him with compassion.|היא התייחסה אליו בחמלה.
comprehend|לתפוס (להבין)|v|I cannot comprehend this math.|אני לא מצליח לתפוס את המתמטיקה הזאת.
conceal|להסתיר|v|He tried to conceal his fear.|הוא ניסה להסתיר את הפחד שלו.
controversial|שנוי במחלוקת|a|The new law is controversial.|החוק החדש שנוי במחלוקת.
convey|להעביר (מסר)|v|Music can convey strong feelings.|מוזיקה יכולה להעביר רגשות חזקים.
crucial|מכריע|a|This is a crucial moment.|זה רגע מכריע.
deceive|להונות|v|Don't try to deceive me.|אל תנסה להונות אותי.
deliberate|מכוון|a|It was a deliberate choice.|זו הייתה בחירה מכוונת.
despair|ייאוש|n|He sat down in despair.|הוא התיישב בייאוש.
devastating|הרסני|a|The storm was devastating.|הסערה הייתה הרסנית.
dilemma|דילמה|n|I face a real dilemma.|אני עומד בפני דילמה אמיתית.
diminish|להצטמצם|v|The pain will diminish with time.|הכאב יפחת עם הזמן.
distinct|מובחן|a|There are two distinct groups.|יש שתי קבוצות נפרדות.
elaborate|מפורט ומורכב|a|They made an elaborate plan.|הם הכינו תוכנית מפורטת ומורכבת.
eloquent|רהוט|a|She gave an eloquent speech.|היא נשאה נאום רהוט.
elusive|חמקמק|a|Success remained elusive.|ההצלחה נשארה חמקמקה.
endure|לעמוד ב (סבל)|v|They had to endure the long winter.|הם נאלצו לעמוד בחורף הארוך.
enormous|עצום|a|An enormous wave hit the boat.|גל עצום פגע בסירה.
evident|ברור|a|Her joy was evident to all.|השמחה שלה הייתה ברורה לכולם.
exceed|לעלות על|v|Costs may exceed the budget.|העלויות עלולות לעלות על התקציב.
fragile|שביר|a|Be careful, the glass is fragile.|זהירות, הכוס שבירה.
futile|חסר תוחלת|a|Our efforts proved futile.|המאמצים שלנו התבררו כחסרי תוחלת.
genuine|אמיתי|a|Her smile looked genuine.|החיוך שלה נראה אמיתי.
hostile|עוין|a|The crowd became hostile.|הקהל נעשה עוין.
immense|עצום בגודלו|a|The castle is immense.|הטירה עצומה בגודלה.
ingenious|גאוני|a|What an ingenious solution!|איזה פתרון גאוני!
integrity|יושרה|n|He is a man of integrity.|הוא אדם בעל יושרה.
intricate|מסובך ומפורט|a|The clock has an intricate design.|לשעון יש עיצוב מסובך ומפורט.
irony|אירוניה|n|The irony of the story made us laugh.|האירוניה של הסיפור הצחיקה אותנו.
legitimate|לגיטימי|a|That is a legitimate question.|זו שאלה לגיטימית.
meticulous|קפדני|a|He is meticulous about details.|הוא קפדני בפרטים.
notorious|ידוע לשמצה|a|The road is notorious for accidents.|הכביש ידוע לשמצה בגלל התאונות.
obstacle|מכשול|n|Fear is the biggest obstacle.|הפחד הוא המכשול הגדול ביותר.
ominous|מבשר רעות|a|We heard an ominous sound.|שמענו קול מבשר רעות.
paradox|פרדוקס|n|It is a strange paradox.|זה פרדוקס מוזר.
persistent|עיקש|a|She is a persistent student.|היא תלמידה עיקשת.
plausible|סביר ומתקבל|a|That sounds like a plausible story.|זה נשמע כמו סיפור סביר.
profound|עמוק ומשמעותי|a|The book had a profound effect on me.|לספר הייתה השפעה עמוקה עליי.
reluctant|מסרב בלב כבד|a|He was reluctant to leave.|הוא לא רצה לעזוב.
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
