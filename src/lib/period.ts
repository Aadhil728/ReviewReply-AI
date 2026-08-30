export function getUtcPeriod(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

export function getNextUtcReset(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}
