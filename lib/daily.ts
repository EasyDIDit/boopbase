/** Day key (YYYY-MM-DD, New York time) for daily Insights counters. */
export function dayKey(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
