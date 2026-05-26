/**
 * Netlify Function: spray-conditions
 * Server-side proxy for the Bureau of Meteorology public JSON feed.
 * Browser requests to BOM are blocked by CORS — this runs on the server.
 *
 * Endpoint: /api/spray-conditions  (mapped via netlify.toml redirect)
 *
 * BOM station options — swap the comment to change location:
 *   Perth Airport:  IDW60901/IDW60901.94608.json  (default)
 *   Geraldton:      IDW05094/IDW05094.94637.json
 */

const https = require('https');

// Use HTTPS directly — the HTTP URL 301-redirects here anyway
const BOM_URL = 'https://www.bom.gov.au/fwo/IDW60901/IDW60901.94608.json';
// const BOM_URL = 'https://www.bom.gov.au/fwo/IDW05094/IDW05094.94637.json'; // Geraldton

const FETCH_TIMEOUT_MS = 5000; // 5 s hard limit

const STATUS_LABELS = {
  good:      'Good to spray',
  marginal:  'Marginal conditions',
  poor:      'Poor conditions',
};

// ─── helpers ────────────────────────────────────────────────────────────────

function fetchBom(url) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('BOM request timed out after 5 s')),
      FETCH_TIMEOUT_MS
    );

    const req = https.get(url, {
      headers: {
        'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept':          'application/json, text/plain, */*',
        'Accept-Language': 'en-AU,en;q=0.9',
      },
    }, (res) => {
      // Follow a single redirect (BOM occasionally shifts CDN paths)
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        clearTimeout(timer);
        fetchBom(res.headers.location).then(resolve).catch(reject);
        res.resume(); // drain socket
        return;
      }
      if (res.statusCode !== 200) {
        clearTimeout(timer);
        res.resume();
        reject(new Error(`BOM returned HTTP ${res.statusCode}`));
        return;
      }
      let body = '';
      res.on('data',  (chunk) => { body += chunk; });
      res.on('end',   ()      => { clearTimeout(timer); resolve(body); });
      res.on('error', (err)   => { clearTimeout(timer); reject(err); });
    });

    req.on('error', (err) => { clearTimeout(timer); reject(err); });
  });
}

function parseRain(trace) {
  if (!trace || trace === '-') return 0;
  const n = parseFloat(trace);
  return isNaN(n) ? 0 : n;
}

function sprayStatus(wind, temp, humidity, rainMm) {
  // Worst condition wins: Poor > Marginal > Good
  if (wind > 25 || temp > 35 || humidity < 25 || humidity > 90 || rainMm > 0) return 'poor';
  if (wind >= 15 || temp >= 30 || humidity < 40 || humidity > 80)              return 'marginal';
  return 'good';
}

/**
 * Parse BOM's compact datetime string: YYYYMMDDHHMMSS
 * Returns e.g. "10:42 AM AWST"
 */
function formatBomTime(bomStr) {
  if (!bomStr || bomStr.length < 12) return '';
  const h   = parseInt(bomStr.slice(8, 10), 10);
  const m   = bomStr.slice(10, 12);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  return `${h12}:${m} ${ampm} AWST`;
}

// ─── handler ────────────────────────────────────────────────────────────────

exports.handler = async () => {
  const responseHeaders = {
    'Content-Type':                'application/json',
    'Cache-Control':               'public, max-age=600', // 10 min CDN cache
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const raw  = await fetchBom(BOM_URL);
    const json = JSON.parse(raw);

    // BOM JSON shape: { observations: { data: [ {...} ] } }
    // There is NO outer "response" wrapper — that was a bug in the previous version.
    const obs = json?.observations?.data?.[0];
    if (!obs) throw new Error('No observation record in BOM response');

    const wind     = parseFloat(obs.wind_spd_kmh) || 0;
    const temp     = parseFloat(obs.air_temp)     || 0;
    const humidity = parseFloat(obs.rel_hum)      || 0;
    const rainMm   = parseRain(obs.rain_trace);
    const status   = sprayStatus(wind, temp, humidity, rainMm);
    const updated  = formatBomTime(obs.local_date_time_full);

    return {
      statusCode: 200,
      headers:    responseHeaders,
      body: JSON.stringify({
        status,
        wind,
        temp,
        humidity,
        label:   STATUS_LABELS[status],
        updated,
      }),
    };

  } catch (err) {
    console.error('[spray-conditions] fetch error:', err.message);
    return {
      statusCode: 200, // always 200 — widget handles "unavailable" state gracefully
      headers:    responseHeaders,
      body: JSON.stringify({
        status:   'unavailable',
        label:    'Conditions unavailable',
        updated:  '',
        wind:     null,
        temp:     null,
        humidity: null,
      }),
    };
  }
};
