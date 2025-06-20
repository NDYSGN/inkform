import nodemailer from 'nodemailer';
import { format } from 'date-fns';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface AppointmentEmailData {
  clientName: string;
  clientEmail: string;
  appointmentDate: Date;
  description: string;
  price?: number;
  deposit?: number;
  studioName: string;
  studioAddress?: string;
  studioPhone?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(config: EmailConfig) {
    this.transporter = nodemailer.createTransport(config);
  }

  async sendAppointmentConfirmation(data: AppointmentEmailData) {
    const subject = `Appointment Confirmed - ${data.studioName}`;
    const html = this.generateConfirmationEmail(data);
    
    return this.sendEmail({
      to: data.clientEmail,
      subject,
      html,
    });
  }

  async sendAppointmentReminder(data: AppointmentEmailData) {
    const subject = `Appointment Reminder - ${data.studioName}`;
    const html = this.generateReminderEmail(data);
    
    return this.sendEmail({
      to: data.clientEmail,
      subject,
      html,
    });
  }

  async sendAppointmentCancellation(data: AppointmentEmailData) {
    const subject = `Appointment Cancelled - ${data.studioName}`;
    const html = this.generateCancellationEmail(data);
    
    return this.sendEmail({
      to: data.clientEmail,
      subject,
      html,
    });
  }

  private async sendEmail({ to, subject, html }: {
    to: string;
    subject: string;
    html: string;
  }) {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@inkform.com',
        to,
        subject,
        html,
      });
      
      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  private generateConfirmationEmail(data: AppointmentEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Appointment Confirmed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .details { background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
            .price-info { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Appointment Confirmed!</h1>
              <p>Hi ${data.clientName},</p>
              <p>Your tattoo appointment has been confirmed. Here are the details:</p>
            </div>
            
            <div class="details">
              <h2>Appointment Details</h2>
              <p><strong>Date:</strong> ${format(data.appointmentDate, 'PPP')}</p>
              <p><strong>Time:</strong> ${format(data.appointmentDate, 'p')}</p>
              <p><strong>Description:</strong> ${data.description}</p>
              ${data.studioAddress ? `<p><strong>Location:</strong> ${data.studioAddress}</p>` : ''}
              
              ${data.price ? `
                <div class="price-info">
                  <h3>Payment Information</h3>
                  <p><strong>Total Price:</strong> €${data.price.toFixed(2)}</p>
                  ${data.deposit ? `<p><strong>Deposit Required:</strong> €${data.deposit.toFixed(2)}</p>` : ''}
                </div>
              ` : ''}
            </div>
            
            <div class="footer">
              <p><strong>${data.studioName}</strong></p>
              ${data.studioPhone ? `<p>Phone: ${data.studioPhone}</p>` : ''}
              <p>Please arrive 10 minutes before your appointment time.</p>
              <p>If you need to reschedule or cancel, please contact us as soon as possible.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateReminderEmail(data: AppointmentEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Appointment Reminder</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .details { background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
            .reminder { background: #d1ecf1; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Appointment Reminder</h1>
              <p>Hi ${data.clientName},</p>
              <p>This is a friendly reminder about your upcoming tattoo appointment tomorrow!</p>
            </div>
            
            <div class="details">
              <h2>Appointment Details</h2>
              <p><strong>Date:</strong> ${format(data.appointmentDate, 'PPP')}</p>
              <p><strong>Time:</strong> ${format(data.appointmentDate, 'p')}</p>
              <p><strong>Description:</strong> ${data.description}</p>
              ${data.studioAddress ? `<p><strong>Location:</strong> ${data.studioAddress}</p>` : ''}
              
              <div class="reminder">
                <h3>Important Reminders:</h3>
                <ul>
                  <li>Please arrive 10 minutes before your appointment</li>
                  <li>Bring a valid ID</li>
                  <li>Stay hydrated and get a good night's sleep</li>
                  <li>Avoid alcohol 24 hours before your appointment</li>
                </ul>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>${data.studioName}</strong></p>
              ${data.studioPhone ? `<p>Phone: ${data.studioPhone}</p>` : ''}
              <p>If you need to reschedule, please contact us immediately.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateCancellationEmail(data: AppointmentEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Appointment Cancelled</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8d7da; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .details { background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Appointment Cancelled</h1>
              <p>Hi ${data.clientName},</p>
              <p>Your tattoo appointment has been cancelled. We're sorry for any inconvenience.</p>
            </div>
            
            <div class="details">
              <h2>Cancelled Appointment Details</h2>
              <p><strong>Date:</strong> ${format(data.appointmentDate, 'PPP')}</p>
              <p><strong>Time:</strong> ${format(data.appointmentDate, 'p')}</p>
              <p><strong>Description:</strong> ${data.description}</p>
            </div>
            
            <div class="footer">
              <p><strong>${data.studioName}</strong></p>
              ${data.studioPhone ? `<p>Phone: ${data.studioPhone}</p>` : ''}
              <p>Please contact us to reschedule your appointment.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
} 