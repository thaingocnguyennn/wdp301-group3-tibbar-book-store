# Email Configuration Guide

## Overview
The bookstore application now sends OTP (One-Time Password) emails when users request password resets. This guide explains how to configure email sending.

## Supported Email Services

### 1. Gmail (Recommended for Development)

#### Steps:
1. **Create a Google Account or use existing one**

2. **Enable 2-Factor Authentication:**
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

3. **Generate App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or your device)
   - Generate password (16 characters)

4. **Update .env file:**
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password_here
   EMAIL_FROM_NAME=Bookstore
   EMAIL_FROM_EMAIL=noreply@bookstore.com
   ```

### 2. Other SMTP Services

For other email services (SendGrid, AWS SES, Mailgun, etc.), update the configuration:

```
EMAIL_HOST=smtp.service.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_username
EMAIL_PASSWORD=your_password
EMAIL_FROM_NAME=Bookstore
EMAIL_FROM_EMAIL=noreply@bookstore.com
```

## Configuration Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `EMAIL_HOST` | SMTP server address | smtp.gmail.com |
| `EMAIL_PORT` | SMTP port (587 for TLS, 465 for SSL) | 587 |
| `EMAIL_SECURE` | Use SSL (true for port 465, false for 587) | false |
| `EMAIL_USER` | Email account username | your_email@gmail.com |
| `EMAIL_PASSWORD` | Email account password or app password | your_app_password |
| `EMAIL_FROM_NAME` | Display name in "From" field | Bookstore |
| `EMAIL_FROM_EMAIL` | Email address in "From" field | noreply@bookstore.com |

## Implementation Details

### Email Helper (`src/utils/emailHelper.js`)
- `sendOTPEmail(toEmail, otp, userName)` - Sends OTP to user
- `sendPasswordResetConfirmationEmail(toEmail, userName)` - Sends confirmation after password reset

### Auth Service Integration
- OTP is automatically sent when user requests password reset
- Confirmation email is sent after successful password reset

## Email Templates

### OTP Email
- Includes formatted OTP display
- 10-minute expiry notice
- Security warnings
- Professional HTML template

### Confirmation Email
- Success confirmation
- Security advisory
- Support contact info

## Testing Email Setup

1. Start the backend:
   ```bash
   npm run dev
   ```

2. Use the API:
   ```bash
   POST /auth/forgot-password
   {
     "email": "user@example.com"
   }
   ```

3. Check the recipient's email inbox for the OTP

## Troubleshooting

### Email Not Sending
- Verify email credentials in `.env`
- Check console logs for error messages
- Ensure EMAIL_USER has correct permissions
- Verify firewall/network allows SMTP connections

### Gmail Errors
- If using regular Gmail password, enable "Less secure app access"
- Recommended: Use App Password instead
- Check Gmail Security: https://myaccount.google.com/security

### Timeout Issues
- Verify EMAIL_HOST and EMAIL_PORT are correct
- Check network connectivity
- Try different SMTP port (465 or 587)

## Security Notes

1. **Never commit .env file** - Keep email credentials private
2. **Use environment variables** - Load from `.env` file only
3. **App passwords** - Use Gmail App Passwords instead of main password
4. **Production** - Use dedicated email service for high volume

## Development vs Production

### Development
- Use Gmail or local SMTP
- Test emails go to real inboxes
- Log OTP in console for debugging

### Production
- Use dedicated email service (SendGrid, AWS SES)
- Enable rate limiting
- Monitor email delivery
- Set up email verification

## Environment Template

```
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM_NAME=Bookstore
EMAIL_FROM_EMAIL=noreply@bookstore.com
```

## API Endpoints

### Request Password Reset
```
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "If the email exists in our system, an OTP will be sent"
}
```

### Verify OTP
```
POST /auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

### Reset Password
```
POST /auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "newpassword123"
}
```

## Support

For additional help:
1. Check the console logs for error messages
2. Verify all environment variables are set
3. Test email configuration before deployment
