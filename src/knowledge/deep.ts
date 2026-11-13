// Full-length lessons of about ten minutes. A lesson here replaces its shorter text and its questions, one file per course.
// [[...]] marks a key sentence in yellow on the first reading. Mark the main ideas, including some that the questions ask about.
import { DEEP_GEO } from './deep/geo';
import { DEEP_HIST } from './deep/hist';
import { DEEP_SCI } from './deep/sci';
import { DEEP_ART } from './deep/art';
import { DEEP_NATURE } from './deep/nature';
import { DEEP_SPORT } from './deep/sport';
import { DEEP_HEB } from './deep/heb';
import { DEEP_JUD } from './deep/jud';
import { DEEP_FOOD } from './deep/food';
import { DEEP_ECON } from './deep/econ';

export const DEEP = { ...DEEP_GEO, ...DEEP_HIST, ...DEEP_SCI, ...DEEP_ART, ...DEEP_NATURE, ...DEEP_SPORT, ...DEEP_HEB, ...DEEP_JUD, ...DEEP_FOOD, ...DEEP_ECON };
