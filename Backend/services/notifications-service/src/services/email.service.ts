import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import * as handlebars from 'handlebars';
import { notificationTemplates, NotificationTemplate, TemplateVariables } from '../templates/notification-templates';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
    this.registerHelpers();
  }

  private initializeTransporter(): void {
    const emailConfig = this.configService.get('email');
    
    // Skip SMTP setup in development if no valid config
    if (!emailConfig?.smtp?.host || emailConfig.smtp.host === 'localhost') {
      this.logger.warn('Email service disabled - no valid SMTP configuration');
      return;
    }
    
    this.transporter = nodemailer.createTransport({
      host: emailConfig.smtp.host,
      port: emailConfig.smtp.port,
      secure: emailConfig.smtp.secure,
      auth: {
        user: emailConfig.smtp.auth.user,
        pass: emailConfig.smtp.auth.pass,
      },
    });

    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('Email configuration error:', error);
      } else {
        this.logger.log('Email service ready');
      }
    });
  }

  private registerHelpers(): void {
    handlebars.registerHelper('if', function(conditional, options) {
      if (conditional) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    });

    handlebars.registerHelper('formatDate', function(date) {
      return new Date(date).toLocaleString();
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.transporter) {
        this.logger.warn(`Email sending disabled - no transporter configured`);
        return false;
      }

      const emailConfig = this.configService.get('email');
      
      const mailOptions = {
        from: options.from || emailConfig.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo || emailConfig.replyTo,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      this.logger.log(`Email sent successfully to ${options.to}: ${result.messageId}`);
      return true;

    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  async sendTemplatedEmail(
    to: string,
    eventType: string,
    variables: TemplateVariables,
  ): Promise<boolean> {
    try {
      const template = this.getEmailTemplate(eventType);
      if (!template) {
        this.logger.error(`No email template found for event type: ${eventType}`);
        return false;
      }

      const compiledSubject = handlebars.compile(template.subject);
      const compiledHtml = handlebars.compile(template.html);
      const compiledText = handlebars.compile(template.text);

      const emailOptions: EmailOptions = {
        to,
        subject: compiledSubject(variables),
        html: compiledHtml(variables),
        text: compiledText(variables),
      };

      return await this.sendEmail(emailOptions);

    } catch (error) {
      this.logger.error(`Failed to send templated email: ${error.message}`, error.stack);
      return false;
    }
  }

  async sendBulkEmails(emails: EmailOptions[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    const emailPromises = emails.map(async (email) => {
      const result = await this.sendEmail(email);
      if (result) {
        success++;
      } else {
        failed++;
      }
    });

    await Promise.allSettled(emailPromises);

    this.logger.log(`Bulk email completed: ${success} successful, ${failed} failed`);
    return { success, failed };
  }

  private getEmailTemplate(eventType: string): NotificationTemplate | null {
    const templates = notificationTemplates[eventType];
    return templates?.email || null;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      this.logger.error('Email connection test failed:', error);
      return false;
    }
  }

  async sendDigestEmail(
    to: string,
    notifications: any[],
    frequency: string,
  ): Promise<boolean> {
    try {
      const digestTemplate = this.createDigestTemplate(notifications, frequency);
      
      const emailOptions: EmailOptions = {
        to,
        subject: `Your ${frequency} notification digest`,
        html: digestTemplate.html,
        text: digestTemplate.text,
      };

      return await this.sendEmail(emailOptions);

    } catch (error) {
      this.logger.error(`Failed to send digest email: ${error.message}`, error.stack);
      return false;
    }
  }

  private createDigestTemplate(notifications: any[], frequency: string): { html: string; text: string } {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Your ${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Digest</h2>
        <p>Here's a summary of your notifications:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
          ${notifications.map(notification => `
            <div style="margin-bottom: 15px; padding: 15px; background-color: white; border-radius: 3px;">
              <h4 style="margin: 0 0 5px 0; color: #2c3e50;">${notification.title}</h4>
              <p style="margin: 0; color: #7f8c8d;">${notification.message}</p>
              <small style="color: #95a5a6;">${new Date(notification.createdAt).toLocaleString()}</small>
            </div>
          `).join('')}
        </div>
        <p>Best regards,<br>Academic Publications Team</p>
      </div>
    `;

    const text = `Your ${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Digest

Here's a summary of your notifications:

${notifications.map(notification => `
${notification.title}
${notification.message}
${new Date(notification.createdAt).toLocaleString()}
---
`).join('')}

Best regards,
Academic Publications Team`;

    return { html, text };
  }
}