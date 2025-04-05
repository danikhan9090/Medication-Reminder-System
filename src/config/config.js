const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const config = {
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },
  deepgram: {
    apiKey: process.env.DEEPGRAM_API_KEY,
  },
  elevenLabs: {
    apiKey: process.env.ELEVENLABS_API_KEY,
  },
  mongodb: {
    uri: process.env.MONGODB_URI,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  medication: {
    list: process.env.MEDICATION_LIST ? process.env.MEDICATION_LIST.split(',') : ['Aspirin', 'Cardivol', 'Metformin'],
  },
};

const requiredEnvVars = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'DEEPGRAM_API_KEY',
  'ELEVENLABS_API_KEY',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

module.exports = config; 