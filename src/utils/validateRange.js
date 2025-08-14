export function parseDateRange(preset, from, to) {
  const now = new Date();
  let start = null, end = now;

  const map = {
    'lastHour': 60 * 60 * 1000,
    'last24h': 24 * 60 * 60 * 1000,
    'lastWeek': 7 * 24 * 60 * 60 * 1000,
    'lastMonth': 30 * 24 * 60 * 60 * 1000
  };

  if (preset && map[preset]) {
    start = new Date(now.getTime() - map[preset]);
  } else if (from && to) {
    start = new Date(from);
    end = new Date(to);
  } else {
    // default last24h
    start = new Date(now.getTime() - map['last24h']);
  }
  return { start, end };
}
