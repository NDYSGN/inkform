import { google, Auth, calendar_v3 } from 'googleapis';

export class CalendarService {
  private calendar: calendar_v3.Calendar;
  private auth: Auth.OAuth2Client;

  constructor(credentials: string | object) {
    if (typeof credentials === 'string') {
        credentials = JSON.parse(credentials);
    }
    
    const creds = credentials as {
        client_id: string;
        client_secret: string;
        redirect_uris: string[];
        tokens: any;
    }

    this.auth = new Auth.OAuth2Client(
        creds.client_id,
        creds.client_secret,
        creds.redirect_uris[0]
    );

    this.auth.setCredentials(creds.tokens);

    this.calendar = google.calendar({ version: 'v3', auth: this.auth });
  }

  async createEvent(event: calendar_v3.Params$Resource$Events$Insert['requestBody']) {
    try {
      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  async updateEvent(eventId: string, event: calendar_v3.Params$Resource$Events$Update['requestBody']) {
    try {
      const response = await this.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: event,
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
        eventId: eventId,
      });
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  }

  async getEvents() {
    try {
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
      });
      return response.data.items;
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  }
} 