/**
 * Netlify Function: spray-conditions
 * Proxies the Bureau of Meteorology public JSON feed for Perth Airport
 * and returns spray suitability data to the frontend.
 *
 * Endpoint: /api/spray-conditions  (mapped via netlify.toml redirect)
 *
 * BOM station options:
 *   Perth Airport:  IDW60901/IDW60901.94608.json  (default)
 *   Geraldton:      IDW05094/IDW05094.94637.json  (comment swap below)
 */

const https = require('https');

// BOM station URL — swap comment to change location
const BOM_URL = 'http://www.bom.gov.au/fwo/IDW60901/IDW60901.94608.json';
// const BOM_URL = 'http://www.bom.gov.au/fwo/IDW05094/IDW05094.94637.json'; // Geraldton

const FETCH_TIMEOUT_MS = 8000;

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('BOM request timed out')), FETCH_TIMEOUT_MS);
    https.get(url, { headers: { 'User-Agent': 'ElkFishRobotics/1.0' } }, (res) => {
      // BOM serves over HTTP; handle any redirect to HTTPS
      if (res.statusCode === 301 || res.statusCode === 302) {
        clearTimeout(timer);
        fetchUrl(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        clearTimeout(timer);
        reject(new Error(`BOM returned HTTP ${res.statusCode}`));
        return;
      }
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => { clearTimeout(timer); resolve(body); });
      res.on('error', (err) => { clearTimeout(timer); reject(err); });
    }).on('error', (err) => { clearTimeout(timer); reject(err); });
  });
}

function parseRain(trace) {
  if (!trace || trace === '-') return 0;
  const n = parseFloat(trace);
  return isNaN(n) ? 0 : n;
}

function sprayRating(wind, temp, humidity, rainMm) {
  // Poor conditions — worst case wins
  if (
    wind > 25 ||
    temp > 35 ||
    humidity < 25 ||
    humidity > 90 ||
    rainMm > 0
  ) return 'poor';

  // Marginal
  if (
    wind >= 15 ||
    temp >= 30 ||
    humidity < 40 ||
    humidity > 80
  ) return 'marginal';

  // Good
  return 'good';
}

exports.handler = async () => {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=600',   // 10 min browser cache
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const raw = await fetchUrl(BOM_URL);
    const json = JSON.parse(raw);
    const obs = json?.response?.observations?.data?.[0];

    if (!obs) {
      throw new Error('No observation data in BOM response');
    }

    const wind      = parseFloat(obs.wind_spd_kmh) || 0;
    const temp      = parseFloat(obs.air_temp)     || 0;
    const humidity  = parseFloat(obs.rel_hum)      || 0;
    const rainMm    = parseRain(obs.rain_trace);
    const station   = obs.name || 'Perth Airport';
    const localTime = obs.local_date_time_full || obs.aifstime_utc || null;

    const rating    = sprayRating(wind, temp, humidity, rainMm);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        rating,
        wind,
        temp,
        humidity,
        rainMm,
        station,
        localTime,
        fetchedAt: new Date().toISOString(),
      }),
    };
  } catch (err) {
    console.error('[spray-conditions] Error:', err.message);
    return {
      statusCode: 200,   // Return 200 so the widget shows "unavailable" rather than erroring
      headers,
      body: JSON.stringify({
        ok: false,
        error: err.message,
        fetchedAt: new Date().toISOString(),
      }),
    };
  }
};
