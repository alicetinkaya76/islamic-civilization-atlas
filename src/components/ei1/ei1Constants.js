/* EI-1 (Brill) field color palette — warm orientalist tones distinct from DIA */
export const EI1_FIELD_COLORS = {
  'politics':      '#e57373',
  'literature':    '#ba68c8',
  'history':       '#90a4ae',
  'geography':     '#4db6ac',
  'mysticism':     '#ce93d8',
  'jurisprudence': '#4fc3f7',
  'hadith':        '#81c784',
  'medicine':      '#66bb6a',
  'theology':      '#7986cb',
  'philosophy':    '#ffb74d',
  'astronomy':     '#64b5f6',
  'mathematics':   '#f06292',
};

export const EI1_FIELDS_LIST = [
  'politics','literature','history','geography','mysticism',
  'jurisprudence','hadith','medicine','theology','philosophy',
  'astronomy','mathematics',
];

export const EI1_ARTICLE_TYPES = [
  'biography','geography','concept','dynasty','cross_reference',
];

export function ei1Normalize(s) {
  return (s || '').toLowerCase()
    .replace(/ı/g,'i').replace(/ğ/g,'g').replace(/ü/g,'u')
    .replace(/ş/g,'s').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/â/g,'a').replace(/î/g,'i').replace(/û/g,'u')
    .replace(/[āáà]/g,'a').replace(/[ūú]/g,'u').replace(/[īíì]/g,'i')
    .replace(/[ḥḫ]/g,'h').replace(/ṣ/g,'s').replace(/ṭ/g,'t')
    .replace(/ḍ/g,'d').replace(/ẓ/g,'z').replace(/ʿ|ʾ|'/g,'')
    .replace(/[\u0610-\u065f\u0670]/g,'')
    .replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/أ|إ|آ/g,'ا');
}

export function getCentury(year) {
  return year ? Math.ceil(Math.abs(year) / 100) : null;
}
