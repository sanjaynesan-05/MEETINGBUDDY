const nodemailer = require('nodemailer');
const cron = require('node-cron');
const Notification = require('../models/Notification');
const Meeting = require('../models/Meeting');
const User = require('../models/User');

class NotificationService {
  constructor() {
    this.transporter = null;
    this._initSmtp();
    this._initCronJobs();
  }

  _initSmtp() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10) || 587,
        secure: parseInt(port, 10) === 465,
        auth: { user, pass },
      });
      console.log('[NotificationService] SMTP configured');
    } else {
      console.log('[NotificationService] SMTP not configured. Email sending disabled.');
    }
  }

  _initCronJobs() {
    cron.schedule('0 8 * * *', () => {
      this._checkActionItemDeadlines().catch((err) =>
        console.error('[Notification Cron] Error:', err.message)
      );
    });
    console.log('[NotificationService] Cron job registered: check deadlines daily at 8 AM');
  }

  async createNotification({ userId, type, title, message, meetingId, actionItemIndex }) {
    const dedupKey = `${userId}_${type}_${meetingId || ''}_${actionItemIndex ?? ''}`;

    const existing = await Notification.findOne({ dedupKey });
    if (existing) return existing;

    return Notification.create({ userId, type, title, message, meetingId, actionItemIndex, dedupKey });
  }

  async getNotifications(userId, { limit = 20, unreadOnly = false } = {}) {
    const filter = { userId };
    if (unreadOnly) filter.read = false;

    return Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async markAsRead(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true },
      { new: true }
    );
  }

  async markAllAsRead(userId) {
    return Notification.updateMany({ userId, read: false }, { read: true });
  }

  async sendEmail(to, subject, text) {
    if (!this.transporter) {
      console.log('[NotificationService] Email not sent: SMTP not configured');
      return false;
    }
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
      });
      return true;
    } catch (err) {
      console.error('[NotificationService] Email send failed:', err.message);
      return false;
    }
  }

  async _checkActionItemDeadlines() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const meetings = await Meeting.find({ status: 'completed' }).populate('uploadedBy').lean();

    for (const meeting of meetings) {
      const actionItems = meeting.aiAnalysis?.actionItems || [];
      const userId = meeting.uploadedBy?._id || meeting.uploadedBy;
      if (!userId) continue;

      for (let i = 0; i < actionItems.length; i++) {
        const item = actionItems[i];
        if (!item.deadline || item.status === 'Completed') continue;
        if (item.status === 'done' || item.status === 'completed') continue;

        const deadline = this._parseDeadline(item.deadline);
        if (!deadline) continue;

        const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());

        const isOverdue = deadlineDate < today;
        const isDueToday = deadlineDate.getTime() === today.getTime();
        const isDueTomorrow = deadlineDate.getTime() === tomorrow.getTime();

        if (isOverdue && item.status !== 'Overdue') {
          await this.createNotification({
            userId,
            type: 'action_item_overdue',
            title: 'Action Item Overdue',
            message: `"${item.task}" was due on ${item.deadline}`,
            meetingId: meeting._id,
            actionItemIndex: i,
          });
        } else if (isDueToday) {
          await this.createNotification({
            userId,
            type: 'action_item_due',
            title: 'Action Item Due Today',
            message: `"${item.task}" is due today (${item.deadline})`,
            meetingId: meeting._id,
            actionItemIndex: i,
          });
        } else if (isDueTomorrow) {
          await this.createNotification({
            userId,
            type: 'action_item_due',
            title: 'Action Item Due Tomorrow',
            message: `"${item.task}" is due tomorrow (${item.deadline})`,
            meetingId: meeting._id,
            actionItemIndex: i,
          });
        }
      }
    }
  }

  _parseDeadline(deadline) {
    if (!deadline) return null;
    const d = new Date(deadline);
    if (!isNaN(d.getTime())) return d;

    const parts = deadline.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (parts) return new Date(parts[1], parts[2] - 1, parts[3]);

    return null;
  }
}

module.exports = new NotificationService();
