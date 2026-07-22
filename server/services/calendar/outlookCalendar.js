class OutlookCalendarService {
  constructor() {
    this.clientId = process.env.OUTLOOK_CALENDAR_CLIENT_ID || '';
    this.clientSecret = process.env.OUTLOOK_CALENDAR_CLIENT_SECRET || '';
    this.redirectUri = process.env.OUTLOOK_CALENDAR_REDIRECT_URI || 'http://localhost:5000/api/calendar/outlook/callback';
    this.tenantId = process.env.OUTLOOK_TENANT_ID || 'common';
  }

  getAuthUrl() {
    if (!this.clientId) {
      throw new Error('OUTLOOK_CALENDAR_CLIENT_ID not configured. Set it in .env to enable Outlook Calendar sync.');
    }
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'https://graph.microsoft.com/Calendars.ReadWrite',
    });
    return `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  async handleCallback(code) {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Outlook Calendar OAuth not configured.');
    }
    const response = await fetch(`https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    if (!response.ok) throw new Error('Outlook OAuth token exchange failed');
    return response.json();
  }

  async createEvent(accessToken, event) {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/calendar/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
    if (!response.ok) throw new Error('Failed to create Outlook Calendar event');
    return response.json();
  }
}

module.exports = new OutlookCalendarService();
