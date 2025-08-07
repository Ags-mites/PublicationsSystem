export interface NotificationTemplate {
  subject: string;
  html: string;
  text: string;
}
export interface TemplateVariables {
  [key: string]: any;
}
export const notificationTemplates: Record<string, Record<string, NotificationTemplate>> = {
  'user.registered': {
    email: {
      subject: 'Welcome to Academic Publications System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Welcome to Academic Publications System!</h2>
          <p>Dear {{firstName}} {{lastName}},</p>
          <p>Welcome to our academic publications platform! Your account has been successfully created.</p>
          <p><strong>Account Details:</strong></p>
          <ul>
            <li>Email: {{email}}</li>
            <li>Registration Date: {{registeredAt}}</li>
          </ul>
          <p>You can now:</p>
          <ul>
            <li>Submit publications for review</li>
            <li>Browse the academic catalog</li>
            <li>Participate in the review process</li>
          </ul>
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>Academic Publications Team</p>
        </div>
      `,
      text: `Welcome to Academic Publications System!
Dear {{firstName}} {{lastName}},
Welcome to our academic publications platform! Your account has been successfully created.
Account Details:
- Email: {{email}}
- Registration Date: {{registeredAt}}
You can now:
- Submit publications for review
- Browse the academic catalog
- Participate in the review process
If you have any questions, please don't hesitate to contact our support team.
Best regards,
Academic Publications Team`
    },
    websocket: {
      subject: 'Welcome!',
      html: 'Account created successfully. Welcome to Academic Publications System!',
      text: 'Account created successfully. Welcome to Academic Publications System!'
    }
  },
  'user.login': {
    email: {
      subject: 'Login Alert - Academic Publications System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Login Alert</h2>
          <p>Dear {{firstName}},</p>
          <p>We detected a login to your account:</p>
          <p><strong>Login Details:</strong></p>
          <ul>
            <li>Time: {{loginAt}}</li>
            <li>IP Address: {{ipAddress}}</li>
          </ul>
          <p>If this wasn't you, please secure your account immediately.</p>
          <p>Best regards,<br>Academic Publications Team</p>
        </div>
      `,
      text: `Login Alert
Dear {{firstName}},
We detected a login to your account:
Login Details:
- Time: {{loginAt}}
- IP Address: {{ipAddress}}
If this wasn't you, please secure your account immediately.
Best regards,
Academic Publications Team`
    }
  },
  'publication.submitted': {
    email: {
      subject: 'Publication Submitted Successfully',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #27ae60;">Publication Submitted!</h2>
          <p>Dear {{authorName}},</p>
          <p>Your publication has been successfully submitted for review.</p>
          <p><strong>Publication Details:</strong></p>
          <ul>
            <li>Title: {{title}}</li>
            <li>Submitted: {{submittedAt}}</li>
            <li>Category: {{category}}</li>
          </ul>
          <p>Your submission is now in the review queue. You'll receive updates as it progresses through the review process.</p>
          <p>Best regards,<br>Academic Publications Team</p>
        </div>
      `,
      text: `Publication Submitted!
Dear {{authorName}},
Your publication has been successfully submitted for review.
Publication Details:
- Title: {{title}}
- Submitted: {{submittedAt}}
- Category: {{category}}
Your submission is now in the review queue. You'll receive updates as it progresses through the review process.
Best regards,
Academic Publications Team`
    },
    websocket: {
      subject: 'Publication Submitted',
      html: 'Your publication "{{title}}" has been submitted successfully.',
      text: 'Your publication "{{title}}" has been submitted successfully.'
    }
  },
  'publication.published': {
    email: {
      subject: 'Publication Published: {{title}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #27ae60;">Your Publication is Now Live!</h2>
          <p>Dear {{authorName}},</p>
          <p>Congratulations! Your publication has been published and is now available in the academic catalog.</p>
          <p><strong>Publication Details:</strong></p>
          <ul>
            <li>Title: {{title}}</li>
            <li>Published: {{publishedAt}}</li>
            <li>Category: {{category}}</li>
            {{#if doi}}<li>DOI: {{doi}}</li>{{/if}}
          </ul>
          <p>Your work is now accessible to the academic community and will contribute to advancing knowledge in your field.</p>
          <p>Best regards,<br>Academic Publications Team</p>
        </div>
      `,
      text: `Your Publication is Now Live!
Dear {{authorName}},
Congratulations! Your publication has been published and is now available in the academic catalog.
Publication Details:
- Title: {{title}}
- Published: {{publishedAt}}
- Category: {{category}}
{{#if doi}}
- DOI: {{doi}}
{{/if}}
Your work is now accessible to the academic community and will contribute to advancing knowledge in your field.
Best regards,
Academic Publications Team`
    },
    websocket: {
      subject: 'Publication Published',
      html: 'Your publication "{{title}}" has been published!',
      text: 'Your publication "{{title}}" has been published!'
    }
  },
  'review.requested': {
    email: {
      subject: 'Review Request: {{publicationTitle}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3498db;">Review Request</h2>
          <p>Dear {{reviewerName}},</p>
          <p>You have been invited to review a publication.</p>
          <p><strong>Review Details:</strong></p>
          <ul>
            <li>Publication: {{publicationTitle}}</li>
            <li>Requested: {{requestedAt}}</li>
            <li>Due Date: {{dueDate}}</li>
          </ul>
          <p>Please log in to the system to access the publication and submit your review.</p>
          <p>Thank you for contributing to the academic review process.</p>
          <p>Best regards,<br>Academic Publications Team</p>
        </div>
      `,
      text: `Review Request
Dear {{reviewerName}},
You have been invited to review a publication.
Review Details:
- Publication: {{publicationTitle}}
- Requested: {{requestedAt}}
- Due Date: {{dueDate}}
Please log in to the system to access the publication and submit your review.
Thank you for contributing to the academic review process.
Best regards,
Academic Publications Team`
    },
    websocket: {
      subject: 'New Review Request',
      html: 'You have a new review request for "{{publicationTitle}}"',
      text: 'You have a new review request for "{{publicationTitle}}"'
    }
  },
  'review.completed': {
    email: {
      subject: 'Review Completed: {{publicationTitle}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #27ae60;">Review Completed</h2>
          <p>Dear Author,</p>
          <p>A review has been completed for your publication.</p>
          <p><strong>Review Details:</strong></p>
          <ul>
            <li>Publication: {{publicationTitle}}</li>
            <li>Reviewer: {{reviewerName}}</li>
            <li>Completed: {{completedAt}}</li>
            <li>Decision: {{decision}}</li>
          </ul>
          {{#if comments}}
          <p><strong>Reviewer Comments:</strong></p>
          <p style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff;">{{comments}}</p>
          {{/if}}
          <p>Please log in to view the complete review details.</p>
          <p>Best regards,<br>Academic Publications Team</p>
        </div>
      `,
      text: `Review Completed
Dear Author,
A review has been completed for your publication.
Review Details:
- Publication: {{publicationTitle}}
- Reviewer: {{reviewerName}}
- Completed: {{completedAt}}
- Decision: {{decision}}
{{#if comments}}
Reviewer Comments:
{{comments}}
{{/if}}
Please log in to view the complete review details.
Best regards,
Academic Publications Team`
    },
    websocket: {
      subject: 'Review Completed',
      html: 'Review completed for "{{publicationTitle}}" - {{decision}}',
      text: 'Review completed for "{{publicationTitle}}" - {{decision}}'
    }
  }
};