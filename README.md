# Personal Expense Tracker

Personal Expense Tracker is a full-stack finance app built to help you keep an honest picture of your money without making the process feel complicated. You can create an account, log in safely, add and organize expenses, set budget goals, save your wallet balance, and review your spending in a dashboard that is easy to understand at a glance. It also includes a basic local AI coach, so even if the external AI service is unavailable, you still get practical spending advice.

## Features
- User signup and login
- Secure JWT-based authentication
- Email verification during signup
- Password reset by email
- Create, edit, and delete personal expenses
- Organize expenses by category
- View recent spending activity
- Track monthly spending totals
- Save and update wallet balance
- Set monthly budget goals
- Monitor category-based budget targets
- View recurring spend patterns
- See last 6 months of spending trends
- Get spending advice from the AI coach
- Fall back to local AI advice when the external AI service is limited or unavailable
- MongoDB-backed data storage

## Tech Stack
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- Arcjet 
- Google Gemini API for the AI coach
- Local fallback coach logic for basic advice

## What It Helps With
- Keeping track of where your money goes
- Spotting habits that quietly eat into your budget
- Storing a realistic wallet balance
- Setting simple spending goals you can actually follow
- Getting quick, friendly AI guidance when you need a nudge

## Getting Started
1. Install dependencies:
   `npm install`
2. Create your local env file:
   - copy `.env.example` to `.env.development.local`
   - fill in `DB_URI`, `JWT_SECRET`, `ARCJET_KEY`, `GEMINI_API_KEY`, and the SMTP email settings
3. Start the server:
   `npm run dev`
4. Open the app and start adding your expenses.

## AI Coach Setup
- The app uses the Google Gemini API as the primary AI coach.
- If the Gemini request fails or hits a quota limit, the app shows a local fallback coach response instead.
- Required env var: `GEMINI_API_KEY`
- Optional env var: `GEMINI_MODEL`
- After updating env vars, restart the server so the new values load.

## Email Setup
- Set `SMTP_SERVER`, `SMTP_PORT`, `EMAIL`, and `PASSWORD` in your local env file.
- `EMAIL` should be the Gmail address you want the app to send from.
- `PASSWORD` should be the Gmail app password, not your normal Gmail login password.
- Set `APP_URL` to the URL users should open from the verification and reset links.
- Optional: set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_UPLOAD_PRESET`, and `CLOUDINARY_FOLDER` if you want users to upload a custom profile photo.
- If those Cloudinary values are not set, the dashboard keeps using the default DiceBear avatar.
