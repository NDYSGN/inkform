import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(config: any) {
    this.transporter = nodemailer.createTransport(config);
  }

  async sendMail(options: nodemailer.SendMailOptions) {
    return this.transporter.sendMail(options);
  }
}