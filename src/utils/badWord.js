import Filter from "bad-words";
import normalizeText from "./normalizeText.js";

const enFilter = new Filter();

const VI_BAD_WORDS = [
    "dit",
    "ditme",
    "du",
    "dume",
    "lon",
    "concac",
    "buoi",
    "ml",
    "dm",
    "vl",
];

function containsBadWord(text = "") {
    if (enFilter.isProfane(text)) return true;
    const normalized = normalizeText(text);
    return BAD_WORDS.some((word) => normalized.includes(word));
}

export default containsBadWord;
