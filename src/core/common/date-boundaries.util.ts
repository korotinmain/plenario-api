/**
 * Returns the start (00:00:00.000) and end (23:59:59.999) of the
 * current calendar day in the given IANA timezone, expressed as UTC Dates.
 *
 * Uses Intl.DateTimeFormat to find the local midnight boundaries without
 * depending on any third-party library.
 */
export function getTodayBoundaries(timezone: string): {
  dayStart: Date;
  dayEnd: Date;
} {
  const now = new Date();

  // Format today's date parts in the target timezone
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const localDateStr = fmt.format(now); // "YYYY-MM-DD"

  // Parse start-of-day in that timezone
  const dayStart = localDateToUtc(localDateStr, "00:00:00", timezone);
  const dayEnd = localDateToUtc(localDateStr, "23:59:59.999", timezone);

  return { dayStart, dayEnd };
}

/**
 * Converts a local YYYY-MM-DD date string + time string to a UTC Date,
 * anchored in the given timezone.
 */
function localDateToUtc(
  dateStr: string,
  timeStr: string,
  timezone: string,
): Date {
  // Build an ISO-like string and use Date.parse, then correct for offset
  const isoLike = `${dateStr}T${timeStr}`;

  // Find offset: create the date as if UTC, measure what the local clock shows
  const probe = new Date(`${isoLike}Z`);
  const localParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .formatToParts(probe)
    .reduce<Record<string, string>>((acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    }, {});

  const localProbe = new Date(
    `${localParts.year}-${localParts.month}-${localParts.day}T${localParts.hour}:${localParts.minute}:${localParts.second}Z`,
  );
  const offsetMs = localProbe.getTime() - probe.getTime();

  return new Date(probe.getTime() - offsetMs);
}
