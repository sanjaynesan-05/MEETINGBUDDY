class IcsGenerator {
  generateActionItemsIcs(meeting, actionItems) {
    if (!actionItems || actionItems.length === 0) return null;

    const now = new Date();
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Meeting Intelligence//Actions//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Meeting Action Items',
    ];

    for (let i = 0; i < actionItems.length; i++) {
      const item = actionItems[i];
      const uid = `action-${meeting._id}-${i}@meeting-intelligence`;
      const dtstamp = this._formatDate(now);

      const parsedDeadline = this._parseDeadline(item.deadline);
      const startDate = parsedDeadline ? parsedDeadline[0] : this._formatDate(now);
      const endDate = parsedDeadline ? parsedDeadline[1] : this._formatDate(new Date(now.getTime() + 3600000));
      const hasTime = parsedDeadline ? parsedDeadline[2] : false;

      const entries = this._generateEventLines({
        uid,
        dtstamp,
        dtstart: startDate,
        dtend: endDate,
        hasTime,
        summary: `ACTION: ${item.task}`,
        description: `Action Item from Meeting: ${meeting.title}\n\nTask: ${item.task}\nOwner: ${item.owner || 'Unassigned'}\nPriority: ${item.priority || 'Medium'}\nStatus: ${item.status || 'Pending'}`,
        location: meeting.title,
      });

      lines.push(...entries);
    }

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  _generateEventLines({ uid, dtstamp, dtstart, dtend, hasTime, summary, description, location }) {
    const lines = [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
    ];

    if (hasTime) {
      lines.push(`DTSTART:${dtstart}`);
      lines.push(`DTEND:${dtend}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${dtstart}`);
      lines.push(`DTEND;VALUE=DATE:${dtend}`);
    }

    lines.push(`SUMMARY:${summary}`);
    lines.push(`DESCRIPTION:${description}`);
    if (location) lines.push(`LOCATION:${location}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');

    return lines;
  }

  _parseDeadline(deadline) {
    if (!deadline) return null;
    const trimmed = deadline.trim();

    const dateOnlyRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    const dateOnlyMatch = trimmed.match(dateOnlyRegex);
    if (dateOnlyMatch) {
      return [trimmed, this._addDays(trimmed, 1), false];
    }

    const dateTimeRegex = /^(\d{4}-\d{2}-\d{2})/;
    const dtMatch = trimmed.match(dateTimeRegex);
    if (dtMatch) {
      const datePart = dtMatch[1];
      const startDt = datePart.replace(/-/g, '') + 'T120000';
      const endDt = datePart.replace(/-/g, '') + 'T130000';
      return [startDt, endDt, true];
    }

    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const formatted = this._formatICalDate(parsed);
      const endFormatted = this._formatICalDate(new Date(parsed.getTime() + 3600000));
      return [formatted, endFormatted, true];
    }

    return null;
  }

  _formatDate(date) {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  _formatICalDate(date) {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  _addDays(dateStr, days) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0].replace(/-/g, '');
  }
}

module.exports = new IcsGenerator();
