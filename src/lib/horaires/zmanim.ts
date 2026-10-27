/**
 * Coucher du soleil et tombée de la nuit, calculés sur place (algorithme solaire de la NOAA,
 * le même que celui d'Hebcal) : aucun appel réseau, et surtout un arrondi maîtrisé.
 *
 * Arrondis « dans le sens de la prudence », comme sur les calendriers des rabbins :
 *  - heures avant lesquelles il faut agir (allumage) : arrondies à la minute inférieure ;
 *  - heures après lesquelles c'est permis (fin de Chabbat, allumage du 2ᵉ soir) : minute supérieure.
 * Hebcal arrondit à la minute la plus proche, d'où parfois une minute d'écart (19h32 au lieu de 19h33).
 */

const RAD = Math.PI / 180;

/** Zénith du coucher du soleil (réfraction et demi-diamètre du disque compris). */
const SUNSET_ZENITH = 90.833;

function julianCentury(utcMs: number): number {
  const julianDay = utcMs / 86400000 + 2440587.5;
  return (julianDay - 2451545) / 36525;
}

/** Équation du temps (minutes) et déclinaison du soleil (degrés) à l'instant donné. */
function solarParams(utcMs: number) {
  const t = julianCentury(utcMs);
  const meanLong = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
  const meanAnom = 357.52911 + t * (35999.05029 - 0.0001537 * t);
  const ecc = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  const center =
    Math.sin(meanAnom * RAD) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * meanAnom * RAD) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * meanAnom * RAD) * 0.000289;
  const omega = 125.04 - 1934.136 * t;
  const appLong = meanLong + center - 0.00569 - 0.00478 * Math.sin(omega * RAD);
  const meanObliq = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  const obliq = meanObliq + 0.00256 * Math.cos(omega * RAD);
  const declination = Math.asin(Math.sin(obliq * RAD) * Math.sin(appLong * RAD)) / RAD;
  const y = Math.tan((obliq / 2) * RAD) ** 2;
  const eqTime =
    4 /
    RAD *
    (y * Math.sin(2 * meanLong * RAD) -
      2 * ecc * Math.sin(meanAnom * RAD) +
      4 * ecc * y * Math.sin(meanAnom * RAD) * Math.cos(2 * meanLong * RAD) -
      0.5 * y * y * Math.sin(4 * meanLong * RAD) -
      1.25 * ecc * ecc * Math.sin(2 * meanAnom * RAD));
  return { eqTime, declination };
}

/**
 * Instant (ms UTC) où le soleil descend sous le zénith donné, le soir de la date civile AAAA-MM-JJ.
 * Deux passes : les paramètres solaires sont recalculés à l'heure trouvée.
 */
function eveningTime(date: string, latitude: number, longitude: number, zenith: number): number {
  const midnightUtc = Date.parse(`${date}T00:00:00Z`);
  let guess = midnightUtc + 18 * 3600000;
  for (let pass = 0; pass < 3; pass++) {
    const { eqTime, declination } = solarParams(guess);
    const cosHa =
      Math.cos(zenith * RAD) / (Math.cos(latitude * RAD) * Math.cos(declination * RAD)) -
      Math.tan(latitude * RAD) * Math.tan(declination * RAD);
    const hourAngle = Math.acos(Math.min(1, Math.max(-1, cosHa))) / RAD;
    const minutes = 720 - 4 * longitude - eqTime + 4 * hourAngle;
    guess = midnightUtc + minutes * 60000;
  }
  return guess;
}

export type Place = { latitude: number; longitude: number };

/** Coucher du soleil (ms UTC, à la seconde). */
export function sunset(date: string, place: Place): number {
  return eveningTime(date, place.latitude, place.longitude, SUNSET_ZENITH);
}

/** Tombée de la nuit : soleil à 8,5° sous l'horizon (ms UTC, à la seconde). */
export function nightfall(date: string, place: Place): number {
  return eveningTime(date, place.latitude, place.longitude, 90 + 8.5);
}

const MINUTE = 60000;
export const floorMinute = (ms: number) => Math.floor(ms / MINUTE) * MINUTE;
export const ceilMinute = (ms: number) => Math.ceil(ms / MINUTE) * MINUTE;

/** Allumage : N minutes avant le coucher du soleil, arrondi à la minute inférieure. */
export function candleLighting(date: string, place: Place, candleMinutes: number): number {
  return floorMinute(sunset(date, place) - candleMinutes * MINUTE);
}

/**
 * Fin de Chabbat / de fête : tombée de la nuit (8,5°) ou N minutes après le coucher,
 * arrondie à la minute supérieure.
 */
export function endOfDay(date: string, place: Place, havdalahMinutes: number | null): number {
  const exact = havdalahMinutes ? sunset(date, place) + havdalahMinutes * MINUTE : nightfall(date, place);
  return ceilMinute(exact);
}
