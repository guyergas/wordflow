// The order in which each knowledge course is taught (the parent's request): basics before what builds on them, related topics together.
// A lesson that refers to another lesson (״בשיעור על...״) must come after it; the tests check every course lists all its lessons once.
// econ is not listed: its order is the order of src/knowledge/econ.ts.
import type { CourseId } from '../course';

const list = (s: string) => s.trim().split(/\s+/);

export const ORDER: Partial<Record<CourseId, string[]>> = {
  sci: list(`
    scientific-question models
    matter material-properties volume-mass density metals materials-safety solutions physical-chemical combustion fuels natural-resources recycle
    gravity forces-motion simple-machines energy-forms heat-conductors home-energy circuit electric-safety magnet light sound
    day-month-year seasons moon solar galaxies weather
    skeleton skin digestion blood
    tech-system design-process information tech-society
    method cells photosynthesis breathing germs vaccine brain drugs-brain atoms periodic acid-base rust energy radiation curie air-quality flight telescope rockets binary
    internet dna ai`),
  hist: list(`
    what-is-history writing egypt cyrus-return rome knights herzl aliyah betaisrael tel-hai independence knesset rights-duties local-authority smart-consumer
    persia athens alexander herod temple roman-judea great-revolt-masada yavne mishnah-amoraim islam jews-under-islam christian-world jews-christendom spain holy-land-islam-christianity silk
    printing columbus reformation scientific-revolution early-modern-jews hasidism enlightenment america france industrial nationalism lincoln suffrage
    eretz-19th-century hashomer-haganah wwi balfour-white-paper mandate szold-kook weizmann university-library un golda sixday peace mlk mandela
    powers president-institutions jewish-democratic multicultural-israel israel-then-now
    shoah1 shoah2 shoah3 shoah4 shoah5 twostories coldwar`),
  geo: list(`
    globe-map continents oceans map-parts map-distance compass-rose watercycle rocks-soil volcano med nile australia
    israel-regions galilee-golan valleys-carmel coastal-plain judea-samaria-hills jerusalem kinneret negev-arava deadsea
    maps latlong timezones contour-lines thematic-maps aerial-satellite atlas-online climate atmosphere-layers deltas everest quakes-israel
    capitals global-village europe med-basin med-people greece-italy turkey-spain egypt-today suez africa amazon panama russia japan antarctica
    israel-mideast env-israel coast-dev compare-regions
    desert ring glaciers population cities water-israel india-china usa latin-america industry-location human-migration energy-geo`),
  nature: list(`
    living-things plant-parts plant-needs trees plant-reproduction seed-dispersal wildflowers
    animal-classes mammals bluewhale dogs birds reptiles frogs sharks dinosaurs ants bees metamorphosis spiders camouflage israelwild
    env-factors ecosystem foodchain producers human-impact deadsea-eingedi
    single-celled fungi bacteria-biotech soil coral octopus echolocation interactions sea-food-webs carbon-cycle biomes desertlife desert-plants
    polar hibernation migration habitats-israel hula eilat-reefs sea-turtles sea-pollution invasive endangered goodall
    selection biodiversity wolves climate-animals conservation-development farming-nature crop-genetics israel-forests`),
  art: list(`
    ancient-mosaic monalisa vangogh kahlo sculpture nachum-gutman
    notes orchestra bach vivaldi-seasons mozart beethoven rossini-opera ballet arabic-music kids-songs shemer
    grimm classic-books littleprince comics kishon taking-photos cinema animation israeli-cinema
    homer greektheatre michelangelo quixote shakespeare moliere rembrandt hokusai photo sherlock picasso african-art chagall bauhaus jazz rock
    bialik tchernichovsky rachel leah alterman amichai amos-oz grossman mizrahi-writers israel-museum digital
    impression agnon modern-poetry israeli-drama what-is-art criticism copyright`),
  sport: list(`
    olympics marathon fairplay warmup training injuries
    swimming jumps-throws relay bolt artistic rhythmic comaneci worldcup offside pele basketball maccabi77 volleyball handball
    tennis table-tennis badminton rugby taekwondo archery skateboard surf winter maccabiah girls-sport
    israel paralympics judo fencing climbing triathlon sea-sports tour owens robinson baseball ali bjking womens-football springboks
    doping mental strategy leadership stats referee-tech chess money
    muscle physics munich politics fans-racism esports`),
  heb: list(`
    pos agreement numbers ordinal-numbers tenses future root
    subject-predicate subject-agreement simple-compound connectives prepositions possession definite-article adjective-adverbial binyanim-intro
    punctuation spelling synonyms homonyms general-specific context dictionary opposites slang acronyms names bodyidioms biblical proverb nikud
    text-types info-texts mainidea between-lines writer-stance audience paragraph open-answer email
    benyehuda academy alefbet ktiv loanwords aramaic arabic
    binyan binyan-paal-nifal binyan-piel-pual binyan-hifil-hufal binyan-hitpael active-passive active-to-passive root-pattern smikhut factopinion
    metaphor`),
  // jud: the Bible lessons first, in the order of the state Bible curriculum (grades 2 to 9, one line per grade, see docs/new-topics.md), then the rest.
  jud: list(`
    tanakh bible-order creation eden-cain noah-babel abraham
    isaac jacob-esau joseph
    moses jethro ten-commandments mishkan-calf
    kedoshim spies korah copper-snake devarim
    joshua judges deborah-gideon samson
    samuel-saul david samuel2
    solomon-split elijah-elisha ruth esther
    shabbat synagogue kashrut tzedakah batmitzvah highdays sukkot hanukkah tubishvat purim pesach shavuot
    calendar tishabeav tu-beav hillel pirkei-avot talmud love-neighbor
    rashi piyut communities prayer-streams
    rambam`),
  food: list(`
    why groups carbs protein fats vitamins vitA vitC calcium water fiber hunger taste
    grains legumes dairyeggs animal nuts colors fivecolors plate rainbow cereal safety
    communities field-to-shelf seasonal-veg food-waste bread-history rice potato tomato citrus honey spices coffee-tea-cocoa world-meals
    iron minerals vitB vitDEK omega-3 iodine-iron-world sugarsalt processed allergy growing why-cook fermentation date-palm olive
    land-food-history vegetarian nutrition-research
    labels food-ads myths kitchen farming-climate hunger-plenty`),
};

/** Lessons that refer to an earlier lesson by name: [earlier, later]. */
export const AFTER: [string, string][] = [
  ['heb.prepositions', 'heb.possession'], ['heb.possession', 'heb.definite-article'], ['heb.definite-article', 'heb.adjective-adverbial'],
  ['heb.subject-predicate', 'heb.subject-agreement'], ['heb.subject-agreement', 'heb.adjective-adverbial'], ['heb.active-passive', 'heb.active-to-passive'],
  ['heb.simple-compound', 'heb.connectives'], ['heb.synonyms', 'heb.opposites'], ['heb.context', 'heb.opposites'],
  ['geo.nile', 'geo.egypt-today'], ['jud.david', 'jud.samuel2'], ['food.carbs', 'food.taste'], ['sport.robinson', 'sport.baseball'],
  ['sci.energy-forms', 'sci.home-energy'], ['sci.heat-conductors', 'sci.home-energy'], ['sci.photosynthesis', 'sci.breathing'],
  ['econ.work', 'econ.taxes'], ['econ.taxes', 'econ.business'], ['econ.account', 'econ.cards'], ['econ.funds', 'econ.etf'],
];
