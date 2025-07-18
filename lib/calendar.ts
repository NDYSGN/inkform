import { google, calendar_v3 } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{ email: string }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

interface ServiceAccountCredentials {
  client_email?: string;
  private_key?: string;
}

export class GoogleCalendarService {
  private auth: GoogleAuth;
  private calendar: calendar_v3.Calendar;

  constructor(credentials: ServiceAccountCredentials) {
    this.auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
    this.calendar = google.calendar({ version: 'v3', auth: this.auth });
  }

  async createEvent(event: CalendarEvent) {
    try {
      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  async updateEvent(eventId: string, event: CalendarEvent) {
    try {
      const response = await this.calendar.events.update({
        calendarId: 'primary',
        eventId,
        requestBody: event,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string) {
    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId,
      });
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  }

  async listEvents(timeMin: string, timeMax: string) {
    try {
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
      });
      return response.data.items;
    } catch (error) {
      console.error('Error listing calendar events:', error);
      throw error;
    }
  }
}

// Helper function to create appointment event
export function createAppointmentEvent(
  clientName: string,
  appointmentDate: Date,
  description: string,
  price?: number,
  deposit?: number
): CalendarEvent {
  const startTime = new Date(appointmentDate);
  const endTime = new Date(appointmentDate);
  endTime.setHours(endTime.getHours() + 2); // Default 2-hour appointment

  const eventDescription = [
    `Client: ${clientName}`,
    `Description: ${description}`,
    ...(price ? [`Total Price: €${price.toFixed(2)}`] : []),
    ...(deposit ? [`Deposit: €${deposit.toFixed(2)}`] : []),
  ].join('\n');

  return {
    summary: `Tattoo Appointment - ${clientName}`,
    description: eventDescription,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 24 hours before
        { method: 'popup', minutes: 60 }, // 1 hour before
      ],
    },
  };
} 