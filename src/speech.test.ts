import { describe, expect, it } from 'vitest';
import { forSpeech } from './speech';

describe('Hebrew given to the voice', () => {
  it('drops niqqud from the words that came out stretched', () => {
    expect(forSpeech('דָּג')).toBe('דג');
    expect(forSpeech('גַּג קָטָן, קַו אָרֹךְ לְמַטָּה')).toBe('גג קטן, קו ארוך למטה');
    expect(forSpeech('כַּדּוּר')).toBe('כדור');
    expect(forSpeech('דְּבוֹרָה')).toBe('דבורה');
    expect(forSpeech('אֵיזוֹ אוֹת אֲרֻכָּה יוֹתֵר?')).toBe('איזו אות ארוכה יותר?');
    expect(forSpeech('כָּל הַכָּבוֹד!')).toBe('כל הכבוד!');
    expect(forSpeech('מִסְתַּכְּלִים טוֹב, וְכוֹתְבִים מֵהַזִּכָּרוֹן אֶת הָאוֹת')).toBe('מסתכלים טוב, וכותבים מהזיכרון את האות');
  });
  it('writes words in full spelling', () => {
    expect(forSpeech('מְצֻיָּן!')).toBe('מצוין!');
    expect(forSpeech('לֹא, זֹאת')).toBe('לא, זאת');
    expect(forSpeech('רֹאשׁ')).toBe('ראש');
    expect(forSpeech('אֹזֶן')).toBe('אוזן');
    expect(forSpeech('דֹּב')).toBe('דוב');
    expect(forSpeech('אִמָּא')).toBe('אימא');
    expect(forSpeech('כֻּלָּם')).toBe('כולם');
    expect(forSpeech('בֻּבָּה')).toBe('בובה');
    expect(forSpeech('סִפּוּר')).toBe('סיפור');
    expect(forSpeech('תִּקְוָה')).toBe('תקווה');
    expect(forSpeech('וְקַו')).toBe('וקו');
    expect(forSpeech('שׁוּב')).toBe('שוב');
    expect(forSpeech('תִּיק')).toBe('תיק');
    expect(forSpeech('יֶלֶד')).toBe('ילד');
    expect(forSpeech('חָתוּל')).toBe('חתול');
    expect(forSpeech('כּוֹתְבִים')).toBe('כותבים');
    expect(forSpeech('אֵיפֹה')).toBe('איפה');
    expect(forSpeech('מִתַּחַת')).toBe('מתחת');
    expect(forSpeech('עִם')).toBe('עם');
    expect(forSpeech('עַכְשָׁו')).toBe('עכשיו');
    expect(forSpeech('סְתָו')).toBe('סתיו');
    expect(forSpeech('וָו')).toBe('וָו');
    expect(forSpeech('תָּו')).toBe('תָּו');
    expect(forSpeech('שְׁתַּיִם')).toBe('שתיים');
    expect(forSpeech('רַגְלַיִם')).toBe('רגליים');
    expect(forSpeech('מַיִם')).toBe('מים');
    expect(forSpeech('עַיִן')).toBe('עַיִן');
    expect(forSpeech('בַּיִת')).toBe('בית');
    expect(forSpeech('מִלָּה')).toBe('מילה');
    expect(forSpeech('מִטָּה')).toBe('מיטה');
  });
  it('reads the geresh as ch', () => { expect(forSpeech('צ׳וּפְּצִ׳יק')).toBe("צ'ופצ'יק"); });
  it('letter names that would become other words keep their niqqud', () => {
    expect(forSpeech('אָלֶף')).toBe('אָלֶף');
    expect(forSpeech('זֹאת הָאוֹת בֵּית.')).toBe('זאת האות בֵּית.');
    expect(forSpeech('בַּיִת')).toBe('בית');
    expect(forSpeech('הָאוֹת דָּלֶת')).toBe('האות דאלת');
    expect(forSpeech('דֶּלֶת')).toBe('דלת');
    expect(forSpeech('רֵישׁ')).toBe('רֵישׁ');
    expect(forSpeech('מוֹצְאִים אֶת כָּל הָאוֹתִיּוֹת וָו.')).toBe('מוצאים את כל האותיות וָו.');
  });
});
