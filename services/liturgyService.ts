/**
 * Liturgy Service
 * Provides liturgical calendar data: season, color, saint of the day, gospel reference
 */

export type LiturgicalSeason = 'Advento' | 'Kalėdų' | 'Gavėnios' | 'Velykų' | 'Eilinis';
export type LiturgicalColor = 'green' | 'violet' | 'white' | 'red' | 'rose';

export interface LiturgyData {
    date: string;
    dateFormatted: string;
    weekday: string;
    season: LiturgicalSeason;
    seasonLt: string;
    color: LiturgicalColor;
    colorLt: string;
    saintOfTheDay?: string;
    gospelReference?: string;
    gospelTitle?: string;
    note?: string;
}

// Lithuanian weekday names
const WEEKDAYS_LT = ['Sekmadienis', 'Pirmadienis', 'Antradienis', 'Trečiadienis', 'Ketvirtadienis', 'Penktadienis', 'Šeštadienis'];

// Lithuanian month names
const MONTHS_LT = ['sausio', 'vasario', 'kovo', 'balandžio', 'gegužės', 'birželio', 'liepos', 'rugpjūčio', 'rugsėjo', 'spalio', 'lapkričio', 'gruodžio'];

// Color translations
const COLOR_NAMES_LT: Record<LiturgicalColor, string> = {
    green: 'Žalia',
    violet: 'Violetinė',
    white: 'Balta',
    red: 'Raudona',
    rose: 'Rožinė'
};

// Season translations
const SEASON_NAMES_LT: Record<LiturgicalSeason, string> = {
    Advento: 'Advento laikas',
    Kalėdų: 'Kalėdų laikas',
    Gavėnios: 'Gavėnios laikas',
    Velykų: 'Velykų laikas',
    Eilinis: 'Eilinis laikas'
};

// Saints database (simplified - major feasts)
const SAINTS_DATABASE: Record<string, { name: string; color?: LiturgicalColor }> = {
    '01-01': { name: 'Švenčiausioji Mergelė Marija, Dievo Gimdytoja', color: 'white' },
    '01-06': { name: 'Viešpaties Apsireiškimas (Trys Karaliai)', color: 'white' },
    '02-02': { name: 'Kristaus Paaukojimas (Grabnyčios)', color: 'white' },
    '02-11': { name: 'Lurdo Švč. Mergelė Marija', color: 'white' },
    '02-14': { name: 'Šv. Kirilas ir Metodijus', color: 'white' },
    '02-22': { name: 'Šv. Petro Sostas', color: 'white' },
    '03-04': { name: 'Šv. Kazimieras, Lietuvos globėjas', color: 'white' },
    '03-19': { name: 'Šv. Juozapas, Švč. M. Marijos Sužadėtinis', color: 'white' },
    '03-25': { name: 'Viešpaties Apreiškimas Švč. M. Marijai', color: 'white' },
    '04-23': { name: 'Šv. Jurgis, kankinys', color: 'red' },
    '04-25': { name: 'Šv. Morkus, evangelistas', color: 'red' },
    '05-01': { name: 'Šv. Juozapas Darbininkas', color: 'white' },
    '05-03': { name: 'Šv. Pilypas ir Jokūbas, apaštalai', color: 'red' },
    '06-24': { name: 'Šv. Jono Krikštytojo Gimimas', color: 'white' },
    '06-29': { name: 'Šv. Petras ir Paulius, apaštalai', color: 'red' },
    '07-11': { name: 'Šv. Benediktas, Europos globėjas', color: 'white' },
    '07-22': { name: 'Šv. Marija Magdalietė', color: 'white' },
    '07-25': { name: 'Šv. Jokūbas, apaštalas', color: 'red' },
    '08-06': { name: 'Viešpaties Atsimainymas', color: 'white' },
    '08-15': { name: 'Švč. M. Marijos Ėmimas į Dangų (Žolinė)', color: 'white' },
    '09-08': { name: 'Švč. M. Marijos Gimimas', color: 'white' },
    '09-14': { name: 'Šventojo Kryžiaus Išaukštinimas', color: 'red' },
    '09-29': { name: 'Šv. arkang. Mykolas, Gabrielius ir Rapolas', color: 'white' },
    '10-04': { name: 'Šv. Pranciškus Asyžietis', color: 'white' },
    '10-15': { name: 'Šv. Teresė Avilietė', color: 'white' },
    '11-01': { name: 'Visi Šventieji', color: 'white' },
    '11-02': { name: 'Mirusiųjų minėjimo diena (Vėlinės)', color: 'violet' },
    '12-08': { name: 'Švč. M. Marijos Nekaltas Prasidėjimas', color: 'white' },
    '12-25': { name: 'Viešpaties Gimimas (Kalėdos)', color: 'white' },
    '12-26': { name: 'Šv. Steponas, pirmasis kankinys', color: 'red' },
    '12-27': { name: 'Šv. Jonas, apaštalas ir evangelistas', color: 'white' },
    '12-28': { name: 'Šventieji Nekaltieji Vaikeliai, kankiniai', color: 'red' },
};

// Readings database (Year B/C - 2026 is Year C/II)
// Format: 'MM-DD': { gospel: 'Ref', title: 'Title' }
const READINGS_DATABASE: Record<string, { gospel: string; title: string }> = {
    // February 2026
    '02-04': { gospel: 'Mk 6, 1–6', title: 'Iš šventosios Evangelijos pagal Morkų' },
    '02-05': { gospel: 'Mk 6, 7–13', title: 'Iš šventosios Evangelijos pagal Morkų' },
    '02-06': { gospel: 'Mk 6, 14–29', title: 'Iš šventosios Evangelijos pagal Morkų' },
    '02-07': { gospel: 'Mk 6, 30–34', title: 'Iš šventosios Evangelijos pagal Morkų' },
    '02-08': { gospel: 'Lk 5, 1–11', title: 'Iš šventosios Evangelijos pagal Luką' }, // 5th Sunday Ordinary Time
    '02-09': { gospel: 'Mk 6, 53–56', title: 'Iš šventosios Evangelijos pagal Morkų' },
    '02-10': { gospel: 'Mk 7, 1–13', title: 'Iš šventosios Evangelijos pagal Morkų' },
    '02-11': { gospel: 'Jn 2, 1–11', title: 'Iš šventosios Evangelijos pagal Joną' }, // Our Lady of Lourdes
    '02-12': { gospel: 'Mk 7, 24–30', title: 'Iš šventosios Evangelijos pagal Morkų' },
    '02-13': { gospel: 'Mk 7, 31–37', title: 'Iš šventosios Evangelijos pagal Morkų' },
    '02-14': { gospel: 'Lk 10, 1–9', title: 'Iš šventosios Evangelijos pagal Luką' }, // Sts Cyril and Methodius
    '02-15': { gospel: 'Lk 6, 17. 20–26', title: 'Iš šventosios Evangelijos pagal Luką' }, // 6th Sunday Ordinary Time
    '02-16': { gospel: 'Mk 8, 11–13', title: 'Iš šventosios Evangelijos pagal Morkų' },
    '02-17': { gospel: 'Mk 8, 14–21', title: 'Iš šventosios Evangelijos pagal Morkų' },
    '02-18': { gospel: 'Mt 6, 1–6. 16–18', title: 'Iš šventosios Evangelijos pagal Matą' }, // Ash Wednesday
    '02-19': { gospel: 'Lk 9, 22–25', title: 'Iš šventosios Evangelijos pagal Luką' },
    '02-20': { gospel: 'Mt 9, 14–15', title: 'Iš šventosios Evangelijos pagal Matą' },
    '02-21': { gospel: 'Lk 5, 27–32', title: 'Iš šventosios Evangelijos pagal Luką' },
    '02-22': { gospel: 'Lk 4, 1–13', title: 'Iš šventosios Evangelijos pagal Luką' }, // 1st Sunday of Lent
};

/**
 * Calculate Easter Sunday for a given year using the Computus algorithm
 */
function calculateEaster(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(year, month - 1, day);
}

/**
 * Calculate Advent start (4th Sunday before Christmas)
 */
function calculateAdventStart(year: number): Date {
    const christmas = new Date(year, 11, 25); // Dec 25
    const dayOfWeek = christmas.getDay();
    // Find 4th Sunday before Christmas
    const daysToSubtract = dayOfWeek === 0 ? 28 : 21 + dayOfWeek;
    const adventStart = new Date(christmas);
    adventStart.setDate(christmas.getDate() - daysToSubtract);
    return adventStart;
}

/**
 * Determine the liturgical season for a given date
 */
function getLiturgicalSeason(date: Date): { season: LiturgicalSeason; color: LiturgicalColor } {
    const year = date.getFullYear();
    const easter = calculateEaster(year);

    // Key dates
    const ashWednesday = new Date(easter);
    ashWednesday.setDate(easter.getDate() - 46);

    const palmSunday = new Date(easter);
    palmSunday.setDate(easter.getDate() - 7);

    const pentecost = new Date(easter);
    pentecost.setDate(easter.getDate() + 49);

    const adventStart = calculateAdventStart(year);
    const christmas = new Date(year, 11, 25);
    const epiphany = new Date(year, 0, 6);

    // Baptism of the Lord (Sunday after Epiphany, or Jan 7 if Epiphany on Sunday)
    let baptismOfLord = new Date(year, 0, 6);
    const epiphanyDay = epiphany.getDay();
    if (epiphanyDay === 0) {
        baptismOfLord.setDate(7);
    } else {
        baptismOfLord.setDate(6 + (7 - epiphanyDay));
    }

    // Normalize dates for comparison
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Christmas season (Dec 25 - Baptism of the Lord)
    const prevChristmas = new Date(year - 1, 11, 25);
    if (d >= prevChristmas && d <= baptismOfLord) {
        return { season: 'Kalėdų', color: 'white' };
    }
    if (d >= christmas) {
        return { season: 'Kalėdų', color: 'white' };
    }

    // Advent (4th Sunday before Christmas to Dec 24)
    const christmasEve = new Date(year, 11, 24);
    if (d >= adventStart && d <= christmasEve) {
        // Gaudete Sunday (3rd Sunday of Advent) - rose color
        const gaudete = new Date(adventStart);
        gaudete.setDate(adventStart.getDate() + 14);
        if (d.getTime() === gaudete.getTime()) {
            return { season: 'Advento', color: 'rose' };
        }
        return { season: 'Advento', color: 'violet' };
    }

    // Lent (Ash Wednesday to Holy Thursday evening)
    const holyThursday = new Date(easter);
    holyThursday.setDate(easter.getDate() - 3);
    if (d >= ashWednesday && d < holyThursday) {
        // Laetare Sunday (4th Sunday of Lent) - rose color
        const laetare = new Date(ashWednesday);
        laetare.setDate(ashWednesday.getDate() + 21 + (7 - ashWednesday.getDay()) % 7);
        if (d.getTime() === laetare.getTime()) {
            return { season: 'Gavėnios', color: 'rose' };
        }
        // Palm Sunday and Holy Week - red for Palm Sunday
        if (d >= palmSunday) {
            if (d.getDay() === 0) return { season: 'Gavėnios', color: 'red' };
        }
        return { season: 'Gavėnios', color: 'violet' };
    }

    // Easter season (Easter Sunday to Pentecost)
    if (d >= easter && d <= pentecost) {
        // Pentecost - red
        if (d.getTime() === pentecost.getTime()) {
            return { season: 'Velykų', color: 'red' };
        }
        return { season: 'Velykų', color: 'white' };
    }

    // Ordinary Time
    return { season: 'Eilinis', color: 'green' };
}

/**
 * Format date in Lithuanian
 */
function formatDateLt(date: Date): string {
    const day = date.getDate();
    const month = MONTHS_LT[date.getMonth()];
    return `${day} ${month}`;
}

/**
 * Get today's liturgy data
 */
export async function getTodayLiturgy(): Promise<LiturgyData> {
    const now = new Date();
    const dateKey = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const { season, color: seasonColor } = getLiturgicalSeason(now);

    // Check for saint/feast override
    const saintData = SAINTS_DATABASE[dateKey];
    const finalColor = saintData?.color || seasonColor;

    const weekOfYear = Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));

    // Check for specific readings in database
    const readingData = READINGS_DATABASE[dateKey];

    const liturgyData: LiturgyData = {
        date: now.toISOString().split('T')[0],
        dateFormatted: formatDateLt(now),
        weekday: WEEKDAYS_LT[now.getDay()],
        season,
        seasonLt: SEASON_NAMES_LT[season],
        color: finalColor,
        colorLt: COLOR_NAMES_LT[finalColor],
        saintOfTheDay: saintData?.name,
        gospelReference: readingData?.gospel || (saintData ? 'Specialūs skaitiniai' : undefined),
        gospelTitle: readingData?.title || 'Dienos Evangelija',
        note: saintData ? undefined : `${season === 'Eilinis' ? weekOfYear : ''} savaitės ${WEEKDAYS_LT[now.getDay()].toLowerCase()}`
    };

    return liturgyData;
}

/**
 * Get CSS color value for liturgical color
 */
export function getLiturgicalColorCSS(color: LiturgicalColor): string {
    const colors: Record<LiturgicalColor, string> = {
        green: '#166534',    // Tailwind green-800
        violet: '#6b21a8',   // Tailwind purple-800
        white: '#fbbf24',    // Gold for white (more visible)
        red: '#dc2626',      // Tailwind red-600
        rose: '#ec4899'      // Tailwind pink-500
    };
    return colors[color];
}

/**
 * Get gradient for liturgical season
 */
export function getLiturgicalGradient(color: LiturgicalColor): string {
    const gradients: Record<LiturgicalColor, string> = {
        green: 'linear-gradient(135deg, #166534 0%, #22c55e 100%)',
        violet: 'linear-gradient(135deg, #6b21a8 0%, #a855f7 100%)',
        white: 'linear-gradient(135deg, #fbbf24 0%, #fde68a 100%)',
        red: 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)',
        rose: 'linear-gradient(135deg, #db2777 0%, #f472b6 100%)'
    };
    return gradients[color];
}
