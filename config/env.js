import dotenv from 'dotenv';


dotenv.config({path: `.env.${process.env.NODE_ENV || 'development'}.local`});

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
    GEMINI_MODEL
} = process.env;
