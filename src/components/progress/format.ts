// Number and date formats for the Progress screen and the Home readiness block (MVP-15).

// Some browsers (Chromium among them) have no Uzbek month names and print "2026 M10 18",
// so Uzbek dates are written here in the usual "18-oktabr, 2026" form.
const UZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']

/** A date such as "18 October 2026" in the interface language. */
export function formatDay(iso: string, language: string | undefined): string {
  if (language === 'uz') {
    const date = new Date(iso)
    return `${date.getDate()}-${UZ_MONTHS[date.getMonth()]}, ${date.getFullYear()}`
  }
  // British order for English ("4 October 2026"), matching the rest of the interface.
  const locale = language === 'en' ? 'en-GB' : language
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
}

/**
 * An average with one decimal, rounded down so the screen never shows "4.0" for a value
 * that is below the pilot threshold of 4.
 */
export function formatAverage(value: number, language: string | undefined): string {
  return new Intl.NumberFormat(language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Math.floor(value * 10) / 10)
}
