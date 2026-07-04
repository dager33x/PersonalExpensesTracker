import dotenv from 'dotenv';

const envName = process.env.NODE_ENV || 'development';

dotenv.config({ path: `.env.${envName}.local` });
dotenv.config({ path: `.env.${envName}` });

export const {
    PORT,
    NODE_ENV,
    DB_URI,
    JWT_SECRET,
    JWT_EXPIRE_IN,
    FRONTEND_URL,
    NEXT_PUBLIC_API_UR,
    GEMINI_API_KEY,
    GOOGLE_API_KEY,
    GEMINI_MODEL,
    SMTP_SERVER,
    SMTP_PORT,
    EMAIL,
    PASSWORD,
    APP_URL,
} = process.env;
