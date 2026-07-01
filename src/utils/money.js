export const persianToEnglishNumber = (value) => {
  return value
    .toString()
    .replace(/[۰-۹]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹".indexOf(digit))
    .replace(/[٠-٩]/g, (digit) => "٠١٢٣٤٥٦٧٨٩".indexOf(digit));
};

export const formatMoney = (value) => {
  return Number(value).toLocaleString("fa-IR") + " تومان";
};

const ones = [
  "",
  "یک",
  "دو",
  "سه",
  "چهار",
  "پنج",
  "شش",
  "هفت",
  "هشت",
  "نه",
];

const teens = [
  "ده",
  "یازده",
  "دوازده",
  "سیزده",
  "چهارده",
  "پانزده",
  "شانزده",
  "هفده",
  "هجده",
  "نوزده",
];

const tens = [
  "",
  "",
  "بیست",
  "سی",
  "چهل",
  "پنجاه",
  "شصت",
  "هفتاد",
  "هشتاد",
  "نود",
];

const hundreds = [
  "",
  "صد",
  "دویست",
  "سیصد",
  "چهارصد",
  "پانصد",
  "ششصد",
  "هفتصد",
  "هشتصد",
  "نهصد",
];

const groups = ["", "هزار", "میلیون", "میلیارد", "تریلیون"];

const threeDigitToWords = (number) => {
  const words = [];

  const h = Math.floor(number / 100);
  const rest = number % 100;

  if (h > 0) {
    words.push(hundreds[h]);
  }

  if (rest >= 10 && rest <= 19) {
    words.push(teens[rest - 10]);
  } else {
    const t = Math.floor(rest / 10);
    const o = rest % 10;

    if (t > 0) {
      words.push(tens[t]);
    }

    if (o > 0) {
      words.push(ones[o]);
    }
  }

  return words.join(" و ");
};

export const numberToPersianWords = (value) => {
  let number = Math.trunc(Number(value));

  if (number === 0) {
    return "صفر";
  }

  if (number < 0) {
    return "منفی " + numberToPersianWords(Math.abs(number));
  }

  const parts = [];
  let groupIndex = 0;

  while (number > 0) {
    const threeDigits = number % 1000;

    if (threeDigits !== 0) {
      const words = threeDigitToWords(threeDigits);
      const groupName = groups[groupIndex];

      parts.unshift(groupName ? `${words} ${groupName}` : words);
    }

    number = Math.floor(number / 1000);
    groupIndex++;
  }

  return parts.join(" و ");
};

export const amountToPersianWords = (value) => {
  return numberToPersianWords(value) + " تومان";
};