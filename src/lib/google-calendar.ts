import { google } from "googleapis";

const TIMEZONE = "America/Argentina/Buenos_Aires";
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID ?? "primary";

function getCalendar() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) return null;

  const auth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  auth.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  return google.calendar({ version: "v3", auth });
}

export async function createCalendarEvent({
  summary,
  description,
  startISO,
  durationMinutes,
}: {
  summary: string;
  description?: string;
  startISO: string;
  durationMinutes: number;
}): Promise<string | null> {
  const calendar = getCalendar();
  if (!calendar) return null;

  const start = new Date(startISO);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  try {
    const res = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: {
        summary,
        description,
        start: { dateTime: start.toISOString(), timeZone: TIMEZONE },
        end: { dateTime: end.toISOString(), timeZone: TIMEZONE },
      },
    });
    return res.data.id ?? null;
  } catch (err) {
    console.error("[Google Calendar] Error al crear evento:", err);
    return null;
  }
}

export async function updateCalendarEvent(
  eventId: string,
  {
    summary,
    description,
    startISO,
    durationMinutes,
  }: {
    summary?: string;
    description?: string;
    startISO?: string;
    durationMinutes?: number;
  }
): Promise<void> {
  const calendar = getCalendar();
  if (!calendar) return;

  const patch: Record<string, unknown> = {};
  if (summary) patch.summary = summary;
  if (description !== undefined) patch.description = description;
  if (startISO) {
    const start = new Date(startISO);
    const end = new Date(start.getTime() + (durationMinutes ?? 120) * 60 * 1000);
    patch.start = { dateTime: start.toISOString(), timeZone: TIMEZONE };
    patch.end = { dateTime: end.toISOString(), timeZone: TIMEZONE };
  }

  try {
    await calendar.events.patch({ calendarId: CALENDAR_ID, eventId, requestBody: patch });
  } catch (err) {
    console.error("[Google Calendar] Error al actualizar evento:", err);
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const calendar = getCalendar();
  if (!calendar) return;

  try {
    await calendar.events.delete({ calendarId: CALENDAR_ID, eventId });
  } catch (err) {
    console.error("[Google Calendar] Error al eliminar evento:", err);
  }
}
