// Useful everyday sentences, with a check of which words in each one she already knows.
import { dayLog, isKnown, Metric, State, ws, freshMetric, grade, spellKind } from './engine';
import { IS_THAI } from './course';
import { THAI_SENTENCES, THAI_TOPICS } from './thai';
import { WORDS, Word } from './words';

export interface Sentence { id: string; en: string; he: string; topic: string; order: number; th?: string; word?: string }
export const TOPICS: Record<string, string> = IS_THAI ? THAI_TOPICS : { friends: 'חברים', school: 'בית ספר', help: 'לבקש עזרה', food: 'אוכל וקניות', travel: 'בדרך', feel: 'איך אני מרגישה', plans: 'תוכניות', opinion: 'להביע דעה', people: 'אנשים ורגשות', world: 'העולם סביבנו', phrases: 'ביטויים', words: 'מילים' };

const RAW: Record<string, string> = {
  friends: `What is your name?|איך קוראים לך?
Nice to meet you.|נעים להכיר.
How are you today?|מה שלומך היום?
This is my best friend.|זו החברה הכי טובה שלי.
Do you want to play a game?|את רוצה לשחק משחק?
Can I sit here?|אפשר לשבת כאן?
I like your shoes.|אני אוהבת את הנעליים שלך.
Where do you live?|איפה את גרה?
Come to my party!|בואי למסיבה שלי!
That was really funny.|זה היה ממש מצחיק.
I am sorry I am late.|סליחה שאיחרתי.
Can you keep a secret?|את יכולה לשמור סוד?
You are very kind.|את ממש אדיבה.
I agree with you.|אני מסכימה איתך.
Thank you for your help.|תודה על העזרה שלך.
See you tomorrow!|נתראה מחר!`,
  school: `I have a question.|יש לי שאלה.
I don't understand this word.|אני לא מבינה את המילה הזו.
Can you explain it again?|את יכולה להסביר שוב?
I forgot my homework at home.|שכחתי את שיעורי הבית בבית.
Can I borrow a pencil?|אפשר לשאול עיפרון?
What is the answer?|מה התשובה?
The test was very difficult.|המבחן היה ממש קשה.
I think this is a mistake.|אני חושבת שזו טעות.
When does the lesson begin?|מתי השיעור מתחיל?
My favorite color is blue.|הצבע האהוב עליי הוא כחול.
I want to learn a new language.|אני רוצה ללמוד שפה חדשה.
How do you write your name?|איך כותבים את השם שלך?
Please listen to the teacher.|בבקשה להקשיב למורה.
I finished my homework early.|סיימתי את שיעורי הבית מוקדם.`,
  help: `Can you help me, please?|את יכולה לעזור לי, בבקשה?
I need your help.|אני צריכה את העזרה שלך.
Please wait for me.|בבקשה תחכי לי.
What does this word mean?|מה פירוש המילה הזו?
Can you speak slowly?|את יכולה לדבר לאט?
I don't know what to do.|אני לא יודעת מה לעשות.
Can you say that again?|את יכולה לומר את זה שוב?
I lost my phone.|איבדתי את הטלפון שלי.
Where is the door?|איפה הדלת?
Is it far from here?|זה רחוק מכאן?
Please open the window.|בבקשה לפתוח את החלון.
Can I take this chair?|אפשר לקחת את הכיסא הזה?
I can't find my keys.|אני לא מוצאת את המפתחות שלי.`,
  food: `I am very hungry.|אני ממש רעבה.
Can I have some water, please?|אפשר קצת מים, בבקשה?
I don't eat meat.|אני לא אוכלת בשר.
How much money is this?|כמה כסף זה עולה?
That is too expensive.|זה יקר מדי.
I want to buy this.|אני רוצה לקנות את זה.
Pizza is my favorite food.|פיצה היא האוכל האהוב עליי.
Let's eat at a restaurant.|בואו נאכל במסעדה.
This food smells great.|האוכל הזה מריח נהדר.
Do you want some bread?|את רוצה קצת לחם?
The store closes at nine.|החנות נסגרת בתשע.
I would like an apple, please.|הייתי רוצה תפוח, בבקשה.`,
  travel: `Where is the station?|איפה התחנה?
How do I get to the airport?|איך מגיעים לשדה התעופה?
Our flight leaves at noon.|הטיסה שלנו יוצאת בצהריים.
Do you have a map?|יש לך מפה?
I need a ticket, please.|אני צריכה כרטיס, בבקשה.
We arrive tomorrow morning.|אנחנו מגיעות מחר בבוקר.
What is the weather like today?|איך מזג האוויר היום?
It is very cold outside.|קר מאוד בחוץ.
Let's walk to the beach.|בואו נלך ברגל לחוף.
Is this street dangerous at night?|הרחוב הזה מסוכן בלילה?
We love to travel in summer.|אנחנו אוהבות לטייל בקיץ.
Don't forget your passport.|אל תשכחי את הדרכון שלך.`,
  feel: `I am so happy today.|אני כל כך שמחה היום.
I feel tired.|אני מרגישה עייפה.
I don't feel well.|אני לא מרגישה טוב.
My stomach hurts.|הבטן שלי כואבת.
I have a headache.|יש לי כאב ראש.
I am a little nervous.|אני קצת לחוצה.
Don't worry about it.|אל תדאגי בקשר לזה.
I am proud of you.|אני גאה בך.
I am afraid of the dark.|אני מפחדת מהחושך.
I was really surprised.|ממש הופתעתי.
Why are you so sad?|למה את כל כך עצובה?
I am bored.|משעמם לי.
I believe you.|אני מאמינה לך.`,
  plans: `What are you doing this weekend?|מה את עושה בסוף השבוע?
Let's meet after school.|בואי ניפגש אחרי בית הספר.
Are you ready to go?|את מוכנה ללכת?
I will call you tonight.|אתקשר אלייך הערב.
We will visit my family on Friday.|נבקר את המשפחה שלי ביום שישי.
I am busy today, maybe tomorrow.|אני עסוקה היום, אולי מחר.
What time do we leave?|באיזו שעה יוצאים?
I always read before I sleep.|אני תמיד קוראת לפני שאני ישנה.
I hope you win the game.|אני מקווה שתנצחי במשחק.
It is my birthday next month.|יום ההולדת שלי בחודש הבא.
I promise to help you.|אני מבטיחה לעזור לך.
We can choose a movie together.|אנחנו יכולות לבחור סרט ביחד.`,
  opinion: `I think that is a good argument.|אני חושבת שזה טיעון טוב.
There is no evidence for that.|אין לזה שום ראיה.
It depends on the context.|זה תלוי בהקשר.
Could you clarify what you mean?|את יכולה להבהיר למה את מתכוונת?
I see it from a different perspective.|אני רואה את זה מנקודת מבט אחרת.
That is a relevant question.|זו שאלה רלוונטית.
It is not as obvious as it seems.|זה לא ברור מאליו כמו שזה נראה.
I am skeptical about this plan.|אני ספקנית לגבי התוכנית הזאת.
We should evaluate every option.|אנחנו צריכות להעריך כל אפשרות.
Although it is hard, it is possible.|למרות שזה קשה, זה אפשרי.
This is a controversial issue.|זו סוגיה שנויה במחלוקת.
That sounds like a plausible story.|זה נשמע כמו סיפור סביר.`,
  people: `Don't hesitate to ask me.|אל תהססי לשאול אותי.
I am grateful for your help.|אני אסירת תודה על העזרה שלך.
I felt embarrassed by my mistake.|הרגשתי נבוכה מהטעות שלי.
You should apologize to her.|את צריכה להתנצל בפניה.
It was just a misunderstanding.|זו הייתה רק אי הבנה.
My sister is very stubborn.|אחותי ממש עקשנית.
I feel overwhelmed by all this homework.|אני מרגישה מוצפת מכל שיעורי הבית.
Please don't interrupt me.|בבקשה אל תפריעי לי באמצע.
We were relieved to hear the news.|הוקל לנו לשמוע את החדשות.
I admire your courage.|אני מעריצה את האומץ שלך.
Don't believe every rumor you hear.|אל תאמיני לכל שמועה שאת שומעת.
She gave an eloquent speech.|היא נשאה נאום רהוט.`,
  world: `We must protect the environment.|אנחנו חייבות להגן על הסביבה.
Pollution is a serious issue.|זיהום הוא סוגיה רצינית.
Change is inevitable.|שינוי הוא בלתי נמנע.
Every choice has a consequence.|לכל בחירה יש תוצאה.
Water is essential for life.|מים הכרחיים לחיים.
The majority voted yes.|הרוב הצביע בעד.
Hunger is a global problem.|רעב הוא בעיה עולמית.
We visited an ancient temple.|ביקרנו במקדש עתיק.
The film had a huge impact.|לסרט הייתה השפעה ענקית.
Everyone hopes for peace.|כולם מקווים לשלום.
This was an unprecedented event.|זה היה אירוע חסר תקדים.
Birds migrate south in winter.|ציפורים נודדות דרומה בחורף.`,
  // Phrases from the Ministry's lists, alone or in a sentence. Ids follow the order, so only append to the end of this block.
  phrases: `I have a few friends here.|יש לי כאן כמה חברים.
She talks about it all the time.|היא מדברת על זה כל הזמן.
Are you ready?|את מוכנה?
You can ask for help.|אפשר לבקש עזרה.
I am at home.|אני בבית.
We are going to swim.|אנחנו הולכים לשחות.
Wait at the bus stop.|חכו בתחנת האוטובוס.
Please come back soon.|בבקשה תחזרו בקרוב.
Do you have a pen?|יש לך עט?
Do you know my brother?|את מכירה את אח שלי?
Do you like pizza?|את אוהבת פיצה?
Excuse me, please.|סליחה, בבקשה.
She wants to be a film star.|היא רוצה להיות כוכבת קולנוע.
Fine!|בסדר!
I get up at seven.|אני קמה בשבע.
Go away, little bee!|לכי מכאן, דבורה קטנה!
Go on, tell me the story.|תמשיכי, תספרי לי את הסיפור.
Let's go outside and play.|בואי נצא החוצה לשחק.
Good luck!|בהצלחה!
Good morning!|בוקר טוב!
Happy birthday!|יום הולדת שמח!
Have a good day!|שיהיה לך יום טוב!
How are you?|מה שלומך?
How do you say this word in English?|איך אומרים את המילה הזאת באנגלית?
How many cats do you have?|כמה חתולים יש לך?
How much is this ball?|כמה עולה הכדור הזה?
How old are you?|בת כמה את?
I'm fine, thank you.|אני בסדר, תודה.
I'm eleven years old.|אני בת אחת עשרה.
I feel well today.|אני מרגישה טוב היום.
I have a new bike.|יש לי אופניים חדשים.
I like pizza, but I don't like fish.|אני אוהבת פיצה, אבל אני לא אוהבת דגים.
I live in Haifa.|אני גרה בחיפה.
I'm a girl.|אני ילדה.
I'm ready!|אני מוכנה!
I'm sorry.|אני מצטערת.
I'll be there in a minute.|אני אגיע בעוד דקה.
The bus stops in front of the school.|האוטובוס עוצר מול בית הספר.
It doesn't matter.|זה לא משנה.
It is an orange.|זה תפוז.
It's hot!|חם!
That's not fair!|זה לא הוגן!
Let's go!|בואי נלך!
Let's play ball.|בואי נשחק בכדור.
My address is 12 Herzl Street.|הכתובת שלי היא רחוב הרצל 12.
My name is Noa.|קוראים לי נועה.
The cat sits next to the dog.|החתול יושב ליד הכלב.
No one is at home.|אין אף אחד בבית.
No problem!|אין בעיה!
Of course I will help you.|ברור שאעזור לך.
Once upon a time there was a little king.|היה היה פעם מלך קטן.
Say it again, please.|תגידי את זה שוב, בבקשה.
See you later!|נתראה אחר כך!
Show me your picture.|תראי לי את הציור שלך.
Dad will take a picture of us.|אבא יצלם אותנו.
Take care!|שמרי על עצמך!
Please tell a story before bed.|בבקשה תספרי סיפור לפני השינה.
Thank you!|תודה!
We have the same bag.|יש לנו אותו תיק.
There is a cat in the garden.|יש חתול בגינה.
This is an apple.|זה תפוח.
This is my room.|זה החדר שלי.
Today is a sunny day.|היום יום שמשי.
We wait for the bus every morning.|אנחנו מחכים לאוטובוס כל בוקר.
We like to sing.|אנחנו אוהבים לשיר.
Well done!|כל הכבוד!
What fruit do you like?|איזה פרי את אוהבת?
What color is your bike?|באיזה צבע האופניים שלך?
What is it?|מה זה?
What is this?|מה הדבר הזה?
What's your name?|מה השם שלך?
What's the matter?|מה קרה?
Where is the ball?|איפה הכדור?
Who has a red pencil?|למי יש עיפרון אדום?
Who is this?|מי זה?
Yes, please.|כן, בבקשה.
You're welcome.|על לא דבר.
Sit down, please.|שבו, בבקשה.
I have a lot of books.|יש לי הרבה ספרים.
It is quarter past seven.|השעה שבע ורבע.
The plane flies over the sea.|המטוס טס מעל הים.
Are you all right?|את בסדר?
Do you want anything else?|את רוצה עוד משהו?
I like cats, and I like dogs as well.|אני אוהבת חתולים, ואני אוהבת גם כלבים.
My aunt lives in Eilat.|הדודה שלי גרה באילת.
My dog is called Max.|הכלב שלי נקרא מקס.
Write your name with a capital letter.|כתבי את השם שלך באות גדולה.
Where do you come from?|מאיפה את?
Don't forget your hat!|אל תשכחי את הכובע שלך!
Don't worry about the test.|אל תדאגי בקשר למבחן.
Excuse me, where is the library?|סליחה, איפה הספרייה?
I don't eat fast food.|אני לא אוכלת מזון מהיר.
What is your first name?|מה השם הפרטי שלך?
Mom gets me up at seven.|אמא מעירה אותי בשבע.
Go down the stairs, please.|רדי במדרגות, בבקשה.
Please go into the classroom.|בבקשה היכנסי לכיתה.
We go shopping on Friday.|אנחנו הולכים לקניות ביום שישי.
How about a game of chess?|מה דעתך על משחק שחמט?
I saw a good film last night.|ראיתי סרט טוב אתמול בלילה.
I am tired, so I lie down on the sofa.|אני עייפה, אז אני נשכבת על הספה.
We live in a small village.|אנחנו גרים בכפר קטן.
See you on Monday!|נתראה ביום שני!
How tall are you?|מה הגובה שלך?
We watched the Olympic Games on TV.|צפינו באולימפיאדה בטלוויזיה.
The library is on your right.|הספרייה נמצאת מימינך.
Put your bag on the chair.|שימי את התיק שלך על הכיסא.
See you soon!|נתראה בקרוב!
I ate the rest of the cake.|אכלתי את שארית העוגה.
I would like to go home now.|הייתי רוצה ללכת הביתה עכשיו.
Would you like some tea?|את רוצה קצת תה?
I am a bit tired.|אני קצת עייפה.
We waited for a while.|חיכינו זמן מה.
School starts at 8 a.m.|בית הספר מתחיל בשמונה בבוקר.
The shop sells all sorts of toys.|החנות מוכרת כל מיני צעצועים.
I don't want to go anywhere else.|אני לא רוצה ללכת לשום מקום אחר.
My brother is as tall as my dad.|אחי גבוה כמו אבא שלי.
She was late as usual.|היא איחרה כרגיל.
I like cats as well as dogs.|אני אוהב חתולים וגם כלבים.
Drink at least two glasses of water a day.|שתו לפחות שתי כוסות מים ביום.
I am going to visit my grandma.|אני הולכת לבקר את סבתא שלי.
We stayed inside because of the rain.|נשארנו בפנים בגלל הגשם.
I was born in Haifa.|נולדתי בחיפה.
We are going to the park. Come along!|אנחנו הולכים לפארק. בואו איתנו!
Dad comes home at six.|אבא חוזר הביתה בשש.
Come in!|היכנסו!
We eat dinner in the dining room.|אנחנו אוכלים ארוחת ערב בחדר האוכל.
Do you mind if I open the window?|אכפת לך אם אפתח את החלון?
Do you mind waiting a minute?|אכפת לך לחכות רגע?
Enjoy yourself!|תיהנה!
Everybody likes ice cream.|כולם אוהבים גלידה.
Everyone came except for Dan.|כולם באו חוץ מדן.
I want to find out the answer.|אני רוצה לגלות את התשובה.
I like fruit, for example apples and pears.|אני אוהבת פירות, למשל תפוחים ואגסים.
I hope you get better soon.|אני מקווה שתרגישי טוב בקרוב.
Wear a coat so you don't get the flu.|תלבש מעיל כדי שלא תחלה בשפעת.
Get down from the table!|רד מהשולחן!
Get in the car, please.|תיכנס למכונית, בבקשה.
We get off the bus at the park.|אנחנו יורדים מהאוטובוס ליד הפארק.
We get on the train at nine.|אנחנו עולים לרכבת בתשע.
Please give in your homework today.|בבקשה תגישו את שיעורי הבית היום.
The teacher will give out the tests.|המורה תחלק את המבחנים.
Good evening!|ערב טוב!
Guess what!|נחש מה!
Hang on!|חכה רגע!
I am happy to help you.|אני שמח לעזור לך.
Have fun!|תיהנו!
I have got a new bike.|יש לי אופניים חדשים.
Hold on tight!|תחזיקו חזק!
I don't mind.|לא אכפת לי.
I like it. I mean, I love it!|אני אוהבת את זה. כלומר, אני מתה על זה!
You had better hurry!|כדאי לך למהר!
I love chocolate ice cream.|אני אוהב גלידת שוקולד.
Dad came home just now.|אבא הגיע הביתה הרגע.
We went to the zoo last week.|הלכנו לגן החיות בשבוע שעבר.
Listen!|תקשיבו!
We watch TV in the living room.|אנחנו צופים בטלוויזיה בסלון.
I look after my little sister.|אני שומרת על אחותי הקטנה.
My mom makes me eat vegetables.|אמא שלי גורמת לי לאכול ירקות.
I need to finish my homework.|אני צריך לסיים את שיעורי הבית.
Not bad!|לא רע!
The soup is not too hot.|המרק לא חם מדי.
We eat lunch at one o'clock.|אנחנו אוכלים ארוחת צהריים באחת.
Please pick up your toys.|בבקשה תרים את הצעצועים שלך.
We plan to visit Grandma on Saturday.|אנחנו מתכננים לבקר את סבתא בשבת.
The police station is near my school.|תחנת המשטרה נמצאת ליד בית הספר שלי.
Please put away your books.|בבקשה תחזירו את הספרים למקום.
Put down the scissors!|תניח את המספריים!
The firefighters put out the fire.|הכבאים כיבו את השריפה.
Remember to brush your teeth!|תזכור לצחצח שיניים!
I got a good report card.|קיבלתי תעודה טובה.
I read books in my spare time.|אני קוראת ספרים בזמן הפנוי שלי.
We swim in the swimming pool.|אנחנו שוחים בבריכה.
Please take away the dirty plates.|בבקשה תפנה את הצלחות המלוכלכות.
Take off your shoes, please.|תוריד את הנעליים, בבקשה.
Don't stay out in the cold.|אל תישאר בחוץ בקור.
Nobody knows the future.|אף אחד לא יודע מה יהיה בעתיד.
We live on the ground floor.|אנחנו גרים בקומת הקרקע.
The ball is in the middle of the room.|הכדור נמצא באמצע החדר.
The moon is bright tonight.|הירח בהיר הלילה.
Dad watches the news every evening.|אבא צופה בחדשות כל ערב.
We learn about the past in history class.|אנחנו לומדים על העבר בשיעור היסטוריה.
Try to enjoy the present.|נסו ליהנות מההווה.
Always tell the truth.|תמיד תגיד את האמת.
I read the whole of the book in one day.|קראתי את כל הספר ביום אחד.
I ate too much candy.|אכלתי יותר מדי ממתקים.
Thank you very much!|תודה רבה!
I help Mom wash up after dinner.|אני עוזרת לאמא לשטוף כלים אחרי ארוחת הערב.
I am a little bit tired.|אני קצת עייף.
What a pity!|חבל!
It is a shame you can't come.|חבל שאתה לא יכול לבוא.
The shop sells a variety of toys.|החנות מוכרת מגוון צעצועים.
According to the map, the park is near.|לפי המפה, הפארק קרוב.
We played, and afterwards we ate lunch.|שיחקנו, ואחר כך אכלנו ארוחת צהריים.
All the best!|כל טוב!
Come as quickly as you can!|בוא כמה שיותר מהר!
Call me as soon as you get home.|תתקשר אליי ברגע שתגיע הביתה.
As you know, the test is tomorrow.|כמו שאתם יודעים, המבחן מחר.
At first I was afraid of the dog.|בהתחלה פחדתי מהכלב.
At present we live in Haifa.|כרגע אנחנו גרים בחיפה.
I am busy at the moment.|אני עסוק כרגע.
Attention!|שימו לב!
The cat walked backwards.|החתול הלך אחורה.
Soon I will be able to swim.|בקרוב אוכל לשחות.
Don't be crazy, it is too cold to swim!|אל תהיה משוגע, קר מדי לשחות!
Our school is located near the park.|בית הספר שלנו נמצא ליד הפארק.
This table is made of wood.|השולחן הזה עשוי מעץ.
I am off to school!|אני יוצא לבית הספר!
I am responsible for feeding the dog.|אני אחראי להאכיל את הכלב.
You are supposed to be in bed.|אתה אמור להיות במיטה.
The little bird was unable to fly.|הציפור הקטנה לא הייתה מסוגלת לעוף.
I am used to waking up early.|אני רגיל לקום מוקדם.
She is willing to help.|היא מוכנה לעזור.
This old coin is worth a lot of money.|המטבע הישן הזה שווה הרבה כסף.
The long walk was worth it.|ההליכה הארוכה הייתה שווה את זה.
You are wrong, the answer is ten.|אתה טועה, התשובה היא עשר.
This ball belongs to my brother.|הכדור הזה שייך לאח שלי.
Best wishes!|איחולים חמים!
My sister has blonde hair.|לאחותי יש שיער בלונדיני.
Our car broke down on the way.|המכונית שלנו התקלקלה בדרך.
Please bring back my book tomorrow.|בבקשה תחזיר לי את הספר מחר.
I took his pencil by mistake.|לקחתי את העיפרון שלו בטעות.
By the way, I like your shoes.|דרך אגב, אני אוהב את הנעליים שלך.
We drank hot chocolate at the café.|שתינו שוקו חם בבית הקפה.
I will call you back after dinner.|אני אחזור אלייך אחרי ארוחת הערב.
I can afford this toy with my own money.|אני יכול להרשות לעצמי את הצעצוע הזה מהכסף שלי.
I can't stand loud noise.|אני לא סובל רעש חזק.
I can't wait for summer!|אני לא יכול לחכות לקיץ!
Carry on reading, please.|תמשיכו לקרוא, בבקשה.
The children carried out the plan.|הילדים ביצעו את התוכנית.
Paper can catch fire easily.|נייר יכול להתלקח בקלות.
We waited at the check-in desk at the airport.|חיכינו בדלפק הצ'ק-אין בשדה התעופה.
The shop is quiet at closing time.|החנות שקטה בשעת הסגירה.
Please come down from the tree!|בבקשה תרד מהעץ!
Congratulations!|מזל טוב!
Dad cut up the apple for me.|אבא חתך לי את התפוח לחתיכות.
Write your date of birth here.|כתוב כאן את תאריך הלידה שלך.
We bought shoes at the department store.|קנינו נעליים בחנות הכלבו.
The twins help each other.|התאומים עוזרים זה לזה.
Be careful, don't fall down!|זהירות, אל תיפול!
Please fill in your name.|בבקשה תמלא את השם שלך.
First of all, wash your hands.|קודם כל, תשטפו ידיים.
Our old bike is for sale.|האופניים הישנים שלנו למכירה.
Let's go out for some fresh air.|בואו נצא לנשום אוויר צח.
Put a full stop at the end of the sentence.|שים נקודה בסוף המשפט.
The car needs gas.|המכונית צריכה דלק.
I got back my ball from the neighbor.|קיבלתי בחזרה את הכדור שלי מהשכן.
My aunt will get married in June.|הדודה שלי תתחתן ביוני.
I want to get to know my new classmates.|אני רוצה להכיר את החברים החדשים שלי בכיתה.
Let's get together after school.|בואו ניפגש אחרי בית הספר.
Please give back my pencil.|בבקשה תחזיר לי את העיפרון שלי.
We will go abroad this summer.|ניסע לחו״ל בקיץ הזה.
Let's go back home.|בואו נחזור הביתה.
I want to be a doctor when I grow up.|אני רוצה להיות רופא כשאגדל.
The teacher will hand out the tests.|המורה תחלק את המבחנים.
It hardly ever snows here.|כמעט אף פעם לא יורד כאן שלג.
I have to do my homework.|אני צריך להכין את שיעורי הבית.
I have a question about the story.|יש לי שאלה על הסיפור.
Let's have a talk after class.|בואו נדבר אחרי השיעור.
It's getting dark, so we head back home.|מתחיל להחשיך, אז אנחנו חוזרים הביתה.
I was happy to hear from my cousin.|שמחתי לשמוע מבן הדוד שלי.
How do you do?|נעים מאוד.
How about pizza for dinner?|מה דעתך על פיצה לארוחת ערב?
You can sit here if you like.|אפשר לשבת כאן אם בא לך.
I'm afraid I can't come to your party.|אני חושש שאני לא יכול לבוא למסיבה שלך.
In addition to English, she speaks French.|בנוסף לאנגלית, היא מדברת צרפתית.
In case of fire, use the stairs.|במקרה של שריפה, השתמשו במדרגות.
The car is parked in front of the house.|המכונית חונה מול הבית.
The prince is in love with the princess.|הנסיך מאוהב בנסיכה.
In the end, we found the lost dog.|בסוף מצאנו את הכלב האבוד.
We got to school just in time.|הגענו לבית הספר בדיוק בזמן.
Cut the apple in half.|חתוך את התפוח לחצי.
It looks like it's going to rain.|נראה שעומד לרדת גשם.
It depends on the weather.|זה תלוי במזג האוויר.
Just a moment, please.|רק רגע, בבקשה.
The plants died because of a lack of water.|הצמחים מתו בגלל מחסור במים.
It isn't nice to laugh at people.|לא יפה לצחוק על אנשים.
Don't leave out any words.|אל תדלג על אף מילה.
Please let me know when you get home.|בבקשה תודיע לי כשתגיע הביתה.
My dad has a driving license.|לאבא שלי יש רישיון נהיגה.
Let's look around the old city.|בואו נסתובב בעיר העתיקה.
My brother and I look like our dad.|אחי ואני דומים לאבא שלנו.
You look nice today!|אתה נראה יפה היום!
Look out!|זהירות!
I look up new words in the dictionary.|אני מחפש מילים חדשות במילון.
With love, Grandma.|באהבה, סבתא.
The baby made a face when she tasted the lemon.|התינוקת עשתה פרצוף כשטעמה את הלימון.
Make sure you close the door.|תוודא שסגרת את הדלת.
My friend Ali is Muslim.|החבר שלי עלי הוא מוסלמי.
Our new neighbors move in next week.|השכנים החדשים שלנו עוברים לגור כאן בשבוע הבא.
Never mind.|לא משנה.
Of course not!|ברור שלא!
My dad went to London on business.|אבא שלי נסע ללונדון לרגל עבודה.
The old house is on fire!|הבית הישן עולה באש!
We go to school on foot.|אנחנו הולכים לבית הספר ברגל.
Ice cream is on offer this week.|יש מבצע על גלידה השבוע.
Please be on time.|בבקשה תגיעו בזמן.
The friends helped one another.|החברים עזרו זה לזה.
One day I will be a pilot.|יום אחד אני אהיה טייס.
Let's watch a movie or something.|בוא נראה סרט או משהו.
The lift is out of order.|המעלית לא עובדת.
The party starts at 5 p.m.|המסיבה מתחילה בחמש אחר הצהריים.
My pajamas have stars on them.|על הפיג'מה שלי יש כוכבים.
This is part of the game.|זה חלק מהמשחק.
Can you pick me up from school?|אתה יכול לאסוף אותי מבית הספר?
The long line put me off.|התור הארוך הוריד לי את החשק.
Don't put off your homework.|אל תדחה את שיעורי הבית.
Put on your coat, it's cold.|תלבש את המעיל, קר בחוץ.
We put on a show for our parents.|העלינו הצגה בשביל ההורים שלנו.
Grandma can put us up for the night.|סבתא יכולה לארח אותנו ללילה.
Please put it in writing.|בבקשה תעלה את זה על הכתב.
Let's put the puzzle together.|בואו נרכיב את הפאזל.
We put up a tent in the garden.|הקמנו אוהל בגינה.
Put a question mark at the end.|שים סימן שאלה בסוף.
The teacher read out our names.|המורה הקריאה את השמות שלנו.
Please refer to the map on page five.|בבקשה היעזרו במפה שבעמוד חמש.
Come here right away!|בוא לכאן מיד!
My brother rides an electric scooter.|אחי נוסע על קורקינט חשמלי.
You seem happy today.|אתה נראה שמח היום.
The players shake hands after the game.|השחקנים לוחצים ידיים אחרי המשחק.
We watch TV in the sitting room.|אנחנו צופים בטלוויזיה בסלון.
We have read three books so far.|עד עכשיו קראנו שלושה ספרים.
I'd like a soft drink, please.|אני רוצה משקה קל, בבקשה.
I have a stomach ache.|יש לי כאב בטן.
It was such a nice day!|זה היה יום כל כך נחמד!
I like fruit such as apples and bananas.|אני אוהב פירות כמו תפוחים ובננות.
Let's take a break.|בואו ניקח הפסקה.
We will take an exam tomorrow.|מחר יש לנו מבחן.
Please take your homework seriously.|בבקשה תתייחס לשיעורי הבית ברצינות.
I'm sorry, I take it back.|סליחה, אני חוזר בי.
Please take out the trash.|בבקשה תוציא את הזבל.
Mom told me to clean my room.|אמא אמרה לי לנקות את החדר שלי.
Cats tend to sleep a lot.|חתולים נוטים לישון הרבה.
That's all right.|זה בסדר.
We need clean air.|אנחנו צריכים אוויר נקי.
My cousin is in the army.|בן הדוד שלי בצבא.
You are the best!|אתה הכי טוב!
We met again the day after.|נפגשנו שוב למחרת.
I saw him the day before.|ראיתי אותו יום קודם.
I help Mom with the dishes.|אני עוזר לאמא עם הכלים.
She was the first to arrive.|היא הייתה הראשונה שהגיעה.
What's the matter with your leg?|מה קרה לרגל שלך?
This is the most attractive dress in the shop.|זאת השמלה הכי יפה בחנות.
The young always love new games.|הצעירים תמיד אוהבים משחקים חדשים.
There's no doubt she will win.|אין ספק שהיא תנצח.
What do you think of my drawing?|מה אתה חושב על הציור שלי?
Please tidy up your room.|בבקשה תסדר את החדר שלך.
Too bad!|חבל!
Can I try on these shoes?|אפשר למדוד את הנעליים האלה?
I always try my best.|אני תמיד משתדל כמיטב יכולתי.
The library is up the street.|הספרייה נמצאת בהמשך הרחוב.
I used to be afraid of the dark.|פעם פחדתי מהחושך.
Watch out!|זהירות!
What is your new teacher like?|איך המורה החדשה שלך?
I don't know whether to laugh or cry.|אני לא יודע אם לצחוק או לבכות.
Why don't you come with us?|למה שלא תבוא איתנו?
Why not?|למה לא?
I would love a cup of hot chocolate.|הייתי שמח לכוס שוקו חם.
I would love to visit you.|הייתי שמח לבקר אותך.
I would prefer to stay home.|הייתי מעדיף להישאר בבית.
Wow!|וואו!
Let's wrap up the gift for Mom.|בוא נעטוף את המתנה לאמא.
You know, I really like this game.|אתה יודע, אני ממש אוהב את המשחק הזה.
Is your big brother at home?|אחיך הגדול בבית?
I learned a great deal today.|למדתי המון היום.
My dad has a great sense of humor.|לאבא שלי יש חוש הומור נהדר.
I read the book again and again.|קראתי את הספר שוב ושוב.
It rained all day long.|ירד גשם כל היום.
We bought apples, bananas, oranges and so on.|קנינו תפוחים, בננות, תפוזים וכן הלאה.
Apart from Dan, everyone came.|חוץ מדן, כולם באו.
Are you kidding?|אתה צוחק עליי?
He looked at me as if he knew the answer.|הוא הסתכל עליי כאילו הוא יודע את התשובה.
As far as I know, the shop is open.|עד כמה שידוע לי, החנות פתוחה.
You can play as long as you finish your homework.|אתה יכול לשחק בתנאי שתסיים את שיעורי הבית.
At last, summer is here!|סוף סוף הקיץ כאן!
I am not tired at all.|אני בכלל לא עייף.
The garden looks its best in spring.|הגינה נראית במיטבה באביב.
Come here at once!|בוא לכאן מיד!
We both laughed at the same time.|שנינו צחקנו באותו הזמן.
My grandparents attend a synagogue every Saturday.|סבא וסבתא שלי הולכים לבית כנסת כל שבת.
The movie is based on a book.|הסרט מבוסס על ספר.
I am dying to see the new movie!|אני מת לראות את הסרט החדש!
We are expecting guests tonight.|אנחנו מצפים לאורחים הערב.
Are you familiar with this game?|אתה מכיר את המשחק הזה?
I want to be friends with you.|אני רוצה להיות חבר שלך.
When you are in doubt, ask the teacher.|כשאתה בספק, תשאל את המורה.
My brother is into dinosaurs.|אחי מתלהב מדינוזאורים.
Jerusalem is known as the City of Gold.|ירושלים ידועה כעיר הזהב.
We are short of chairs for the party.|חסרים לנו כיסאות למסיבה.
It is up to you.|זה תלוי בך.
What are you up to today?|מה אתה עושה היום?
You are welcome to join us.|אתה מוזמן להצטרף אלינו.
This book is worth reading.|הספר הזה שווה קריאה.
Let's keep in touch!|בוא נשמור על קשר!
Come home before dark.|תחזור הביתה לפני שמחשיך.
This bag belongs to my sister.|התיק הזה שייך לאחותי.
Blow your nose, please.|תקנח את האף, בבקשה.
She wants to break a record.|היא רוצה לשבור שיא.
Please break the cookie in two.|בבקשה תשבור את העוגייה לשניים.
Music brings me happiness.|מוזיקה מביאה לי אושר.
I broke the glass by accident.|שברתי את הכוס בטעות.
Grandma made this hat by hand.|סבתא הכינה את הכובע הזה בעבודת יד.
I know the poem by heart.|אני יודע את השיר בעל פה.
He did his homework by himself.|הוא הכין את שיעורי הבית לבד.
My room is small; by contrast, his room is huge.|החדר שלי קטן; לעומת זאת, החדר שלו ענק.
I will call for you at eight.|אבוא לאסוף אותך בשמונה.
I couldn't help laughing.|לא יכולתי שלא לצחוק.
She is capable of great things.|היא מסוגלת לדברים גדולים.
The bright sign caught my attention.|השלט הבוהק משך את תשומת הלב שלי.
Run fast and catch up with us!|רוץ מהר ותשיג אותנו!
Did you change your mind?|שינית את דעתך?
I have chewing gum in my bag.|יש לי מסטיק בתיק.
Come on!|נו, קדימה!
The sun will come out soon.|השמש תצא בקרוב.
I hope your dream will come true.|אני מקווה שהחלום שלך יתגשם.
Use your common sense.|תשתמש בשכל הישר.
We consider him a good friend.|אנחנו מחשיבים אותו לחבר טוב.
The team consists of five players.|הקבוצה מורכבת מחמישה שחקנים.
They cut down the old tree.|הם כרתו את העץ הישן.
Music is part of my daily life.|מוזיקה היא חלק מחיי היומיום שלי.
I can deal with this problem.|אני יכול להתמודד עם הבעיה הזאת.
Dear Madam|גברתי הנכבדה
Dear Sir|אדוני הנכבד
You can depend on me.|אתה יכול לסמוך עליי.
We read a dialogue in class.|קראנו דיאלוג בכיתה.
I did well on the test.|הצלחתי במבחן.
Just do your best!|פשוט תעשה כמיטב יכולתך!
Drag and drop the picture.|גרור ושחרר את התמונה.
My sister got her driving license.|אחותי קיבלה רישיון נהיגה.
The game was canceled due to rain.|המשחק בוטל בגלל הגשם.
You can have either juice or milk.|אתה יכול לקבל מיץ או חלב.
We always end up laughing.|תמיד בסוף אנחנו צוחקים.
We bought apples, bananas, pears, etc.|קנינו תפוחים, בננות, אגסים וכו'.
We have been friends ever since.|מאז אנחנו חברים.
I read every single page.|קראתי כל עמוד ועמוד.
I fall asleep fast after a long day.|אני נרדם מהר אחרי יום ארוך.
Please come in and feel at home.|בבקשה תיכנס ותרגיש בבית.
I feel bad about the broken vase.|אני מרגיש רע בגלל האגרטל השבור.
I feel like eating pizza.|בא לי לאכול פיצה.
I feel as if I can fly.|אני מרגיש כאילו אני יכול לעוף.
I feel sorry for the lost puppy.|אני מרחם על הגור שהלך לאיבוד.
I find math easy.|מתמטיקה קלה לי.
The fire truck is at the fire station.|הכבאית נמצאת בתחנת הכיבוי.
It rained for days.|ירד גשם במשך ימים.
I like fruit, for instance apples.|אני אוהב פירות, למשל תפוחים.
I will come for sure.|אני בטוח אבוא.
We have lived here for years.|אנחנו גרים כאן כבר שנים.
We get around the city by bike.|אנחנו מתניידים בעיר באופניים.
We need to get rid of these old toys.|אנחנו צריכים להיפטר מהצעצועים הישנים האלה.
I got used to my new school.|התרגלתי לבית הספר החדש שלי.
It is late, so go to sleep.|מאוחר, אז לך לישון.
Our cat gave birth to four kittens.|החתולה שלנו ילדה ארבעה גורים.
I will give you a call tonight.|אני אתקשר אליך הערב.
The test went well.|המבחן עבר טוב.
Let's go out and play.|בוא נצא החוצה לשחק.
Prices go up every year.|המחירים עולים כל שנה.
Something went wrong with my computer.|משהו השתבש במחשב שלי.
Good for you!|כל הכבוד לך!
Please hand in your homework.|בבקשה תגישו את שיעורי הבית.
Don't hang up the phone yet.|אל תנתק עדיין את הטלפון.
She has a red dress on.|היא לובשת שמלה אדומה.
I have no doubt you will win.|אין לי ספק שתנצח.
I have no idea where my keys are.|אין לי מושג איפה המפתחות שלי.
We have a lot in common.|יש לנו הרבה במשותף.
Help yourself to some cake.|תתכבד בעוגה.
My mom works in high-tech.|אמא שלי עובדת בהייטק.
Hold your breath under the water.|תעצור את הנשימה מתחת למים.
We learn about the Holocaust at school.|אנחנו לומדים על השואה בבית הספר.
I hope to see you soon.|אני מקווה לראות אותך בקרוב.
I bet you can't catch me!|אני בטוח שאתה לא יכול לתפוס אותי!
I guess it will rain.|אני מניח שירד גשם.
I suppose so.|אני מניח שכן.
I suppose you are hungry after the trip.|אני מניח שאתה רעב אחרי הטיול.
If I were you, I would wear a coat.|אם הייתי במקומך, הייתי לובש מעיל.
If only I could fly!|הלוואי שיכולתי לעוף!
Are you tired? If so, go to bed.|אתה עייף? אם כן, לך לישון.
In a way, my dog is my best friend.|במובן מסוים, הכלב שלי הוא החבר הכי טוב שלי.
We bought the tickets in advance.|קנינו את הכרטיסים מראש.
What do you and your friend have in common?|מה משותף לך ולחבר שלך?
The teacher explained the story in detail.|המורה הסבירה את הסיפור בפירוט.
I thought it was hard, but in fact it was easy.|חשבתי שזה קשה, אבל בעצם זה היה קל.
In general, I like school.|באופן כללי, אני אוהב את בית הספר.
I woke up early in order to catch the bus.|קמתי מוקדם כדי להספיק לאוטובוס.
In other words, we won!|במילים אחרות, ניצחנו!
I love animals, cats in particular.|אני אוהב בעלי חיים, במיוחד חתולים.
We played outside in spite of the rain.|שיחקנו בחוץ למרות הגשם.
It seems that nobody is home.|נראה שאין אף אחד בבית.
Take an umbrella just in case.|קח מטרייה, ליתר ביטחון.
Please keep this a secret.|בבקשה תשמור את זה בסוד.
Let's keep in touch after the summer.|בוא נשמור על קשר אחרי הקיץ.
I'll call you later on.|אתקשר אליך מאוחר יותר.
Lay the baby down on the bed.|תשכיב את התינוק על המיטה.
Can you help me lay the table?|אתה יכול לעזור לי לערוך את השולחן?
Don't lean on the door.|אל תישען על הדלת.
Let me help you with that bag.|תן לי לעזור לך עם התיק הזה.
Tell me about your likes and dislikes.|ספר לי מה אתה אוהב ומה אתה לא אוהב.
We have loads of homework today.|יש לנו המון שיעורי בית היום.
It is easy to make friends at camp.|קל להכיר חברים במחנה.
Don't miss the chance to see the show.|אל תפספס את ההזדמנות לראות את ההצגה.
He no longer lives here.|הוא כבר לא גר כאן.
No way!|אין מצב!
There is not even one cookie left.|לא נשארה אפילו עוגייה אחת.
I'm not really hungry.|אני לא ממש רעב.
I had an omelette for breakfast.|אכלתי חביתה לארוחת בוקר.
He didn't do it on purpose.|הוא לא עשה את זה בכוונה.
I saw a rainbow on the way to school.|ראיתי קשת בענן בדרך לבית הספר.
Let's read the story once again.|בואו נקרא את הסיפור עוד פעם.
Some day I will visit Paris.|יום אחד אבקר בפריז.
The cat jumped onto the table.|החתול קפץ על השולחן.
Tell me if you like it or not.|תגיד לי אם זה מוצא חן בעיניך או לא.
You ought to say sorry.|כדאי שתבקש סליחה.
Please read the story out loud.|בבקשה קרא את הסיפור בקול רם.
The cat jumped out of the box.|החתול קפץ מתוך הקופסה.
My uncle is out of work right now.|הדוד שלי מובטל כרגע.
This map is out of date.|המפה הזאת לא מעודכנת.
Come over here!|בוא לכאן!
Please pay attention to the teacher.|בבקשה שימו לב למורה.
Fifty percent of the class are girls.|חמישים אחוז מהכיתה הן בנות.
Let's play a trick on Dad!|בוא נעשה תעלול לאבא!
Pleased to meet you!|נעים להכיר!
I grew quite a bit this year.|גדלתי לא מעט השנה.
Quite a few children came to the party.|לא מעט ילדים באו למסיבה.
I haven't seen him for quite a while.|לא ראיתי אותו כבר די הרבה זמן.
I want to walk rather than take the bus.|אני רוצה ללכת ברגל במקום לנסוע באוטובוס.
My grade was relatively good.|הציון שלי היה טוב יחסית.
This song reminds me of summer.|השיר הזה מזכיר לי את הקיץ.
Running in the hall can result in an accident.|ריצה במסדרון יכולה לגרום לתאונה.
It's not my fault!|זו לא אשמתי!
Don't worry, I'll see to it.|אל תדאג, אני אטפל בזה.
It seems like it will rain.|נראה שירד גשם.
We had to send the toy back because it was broken.|נאלצנו לשלוח את הצעצוע בחזרה כי הוא היה שבור.
Let's set a date for the party.|בואו נקבע תאריך למסיבה.
We set off early in the morning.|יצאנו לדרך מוקדם בבוקר.
Please set the table for dinner.|בבקשה ערוך את השולחן לארוחת הערב.
The shop assistant helped me find new shoes.|המוכר בחנות עזר לי למצוא נעליים חדשות.
We ate lunch, and shortly afterward it started to rain.|אכלנו ארוחת צהריים, וזמן קצר אחר כך התחיל לרדת גשם.
Her mom is a single parent.|אמא שלה היא הורה יחידנית.
I left early so that I would not be late.|יצאתי מוקדם כדי שלא אאחר.
My sister spends a lot of time on social media.|אחותי מבלה הרבה זמן ברשתות החברתיות.
Social networking helps people stay in touch.|רשתות חברתיות עוזרות לאנשים לשמור על קשר.
That sounds like a good plan.|זה נשמע כמו תוכנית טובה.
Sounds good to me!|נשמע לי טוב!
Please switch off the light.|בבקשה כבה את האור.
Take a deep breath and count to ten.|קח נשימה עמוקה וספור עד עשר.
I take care of my little brother.|אני שומר על אחי הקטן.
Take it easy, there is no rush.|תירגע, אין לחץ.
The plane will take off soon.|המטוס ימריא בקרוב.
My dad took up swimming last year.|אבא שלי התחיל לשחות בשנה שעברה.
Everyone must obey the law.|כולם חייבים לציית לחוק.
I saw your sister the other day.|ראיתי את אחותך לפני כמה ימים.
The press wrote about our school play.|העיתונות כתבה על ההצגה של בית הספר שלנו.`,
};

let n = 0;
const WRITTEN: Sentence[] = IS_THAI ? THAI_SENTENCES : Object.entries(RAW).flatMap(([topic, block]) => block.split('\n').map((line) => {
  const [en, he] = line.split('|');
  const order = n++;
  return { id: `s${order}`, en, he, topic, order };
}));
// Every word's example sentence joins the practice once that word has been met, so all the words are covered.
const written = new Set(WRITTEN.map((s) => s.en));
const fromWords: Sentence[] = IS_THAI ? [] : WORDS.filter((w) => w.exHe && !written.has(w.ex) && !!written.add(w.ex))
  .map((w, i) => ({ id: `w:${w.id}`, en: w.ex, he: w.exHe!, topic: 'words', order: WRITTEN.length + i, word: w.id }));
export const SENTENCES: Sentence[] = [...WRITTEN, ...fromWords];

// Grammar words and very simple words that are not practiced as vocabulary, so they never hold a sentence back.
export const BASIC = new Set(IS_THAI ? [] : `a an the i you he she it we they me my your our his her their this that these those is am are was were be been being
do does did don't can't can will would need have has had not no yes and or but so to of in on at for from with about up out here there what where when why who how which much many some too very really
please thank thanks sorry hi nice let's it's what's like go get know say see think come lose lost find keys phone mean make call time name home
good could as seems plan should every option hard story ask felt by just all hear gave speech must change life hunger temple film everyone event birds south winter
one two nine friday noon tonight next again together little outside dark blue pizza movie summer win meat great busy best keep smells play sit live word test love well doing`.split(/\s+/));

const IRREGULAR: Record<string, string> = { ate: 'eat', bought: 'buy', forgot: 'forget', left: 'leave', took: 'take', leaves: 'leave', closes: 'close', hurts: 'hurt', hungry: 'hungry' };
const byEn = new Map(WORDS.map((w) => [w.en, w]));

export const tokens = (en: string) => en.toLowerCase().replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean);

export function bankWord(token: string): Word | null {
  if (BASIC.has(token)) return null;
  const base = IRREGULAR[token] ?? token;
  const tries = [base, base.replace(/s$/, ''), base.replace(/es$/, ''), base.replace(/ed$/, ''), base.replace(/d$/, ''), base.replace(/ing$/, ''), `${base.replace(/ing$/, '')}e`, base.replace(/ies$/, 'y')];
  for (const t of tries) { const w = byEn.get(t); if (w) return w; }
  return null;
}
/** A token the app can classify: a basic word, or a word from the bank. Tests require this of every sentence. */
export const classified = (t: string) => BASIC.has(t) || bankWord(t) !== null;

export const unknownWords = (st: State, s: Sentence): Word[] => {
  const out = new Map<string, Word>();
  for (const t of tokens(s.en)) { const w = bankWord(t); if (w && !isKnown(ws(st, w.id))) out.set(w.id, w); }
  return [...out.values()];
};

export const metricOf = (st: State, id: string): Metric => st.sentences?.[id] ?? freshMetric();
export const sMeasured = (m: Metric) => m.ok + m.no > 0;
/** A phrase from the Thai bank joins sentence practice only after its word has been met. */
const available = (st: State, s: Sentence) => !s.word || ws(st, s.word).met !== null;
export const readyCount = (st: State) => SENTENCES.filter((s) => available(st, s) && unknownWords(st, s).length === 0).length;
export const sentencesKnown = (st: State) => SENTENCES.filter((s) => { const m = metricOf(st, s.id); return m.box >= 3 && !m.flag; }).length;

/** Reviews first, then new sentences ordered by how few unfamiliar words they contain. */
export function sentencePlan(st: State, today: number, count = 6): Sentence[] {
  const due = SENTENCES.filter((s) => { const m = metricOf(st, s.id); return sMeasured(m) && (m.flag || m.due <= today); })
    .sort((a, b) => Number(metricOf(st, b.id).flag) - Number(metricOf(st, a.id).flag) || metricOf(st, a.id).due - metricOf(st, b.id).due)
    .slice(0, Math.ceil(count / 2));
  const fresh = SENTENCES.filter((s) => available(st, s) && !sMeasured(metricOf(st, s.id)))
    .sort((a, b) => unknownWords(st, a).length - unknownWords(st, b).length || a.en.length - b.en.length || a.order - b.order)
    .slice(0, count - due.length);
  return [...due, ...fresh];
}
export function recordSentence(st: State, id: string, correct: boolean, today: number): State {
  const log = dayLog(st, today);
  return { ...st, sentences: { ...st.sentences, [id]: grade(metricOf(st, id), correct, today) }, days: { ...st.days, [today]: { ...log, sen: (log.sen ?? 0) + 1 } } };
}
/** Understanding first, then building from Hebrew, then building by ear. */
export const sentenceKind = (m: Metric): 'meaning' | 'build' | 'ear' => (m.box <= 0 ? 'meaning' : spellKind(m.box) === 'type' ? 'ear' : 'build');
