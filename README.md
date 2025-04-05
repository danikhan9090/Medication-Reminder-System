# Voice-Driven Medication Reminder System

> **🚨 VERY IMPORTANT 🚨**

> There is a file in the project called `.env.example`. You **must create your own `.env` file** and copy the entire contents from `.env.example` into your `.env` file. Then, you should replace the placeholders with your actual credentials for the following services:
>
> - **Twilio**: Account SID, Auth Token, and Phone Number
> - **Deepgram**: API Key
> - **ElevenLabs**: API Key
> - **MongoDB**: Connection URI
> - **BASE_URL** This should be a production URL (e.g., use ngrok to get a production URL) or deploy this on a live server

---

# Voice-Driven Medication Reminder System

A Node.js-based system that uses Twilio for voice calls and Deepgram/ElevenLabs for speech processing to remind patients about their medications.

## Features

- Outbound voice calls to remind patients about medications
- Speech-to-Text (STT) processing of patient responses
- Text-to-Speech (TTS) for natural voice interactions
- Voicemail and SMS fallback for unanswered calls
- Detailed call logging and monitoring
- RESTful API for system integration

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Twilio Account
- Deepgram Account
- ElevenLabs Account

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd medication-reminder-system
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:

   ```
   PORT=3000
   NODE_ENV=development

   # Twilio Configuration
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number

   # Deepgram Configuration
   DEEPGRAM_API_KEY=your_deepgram_api_key

   # ElevenLabs Configuration
   ELEVENLABS_API_KEY=your_elevenlabs_api_key

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/medication-reminder

   # Logging Configuration
   LOG_LEVEL=debug
   ```

## Usage

1. Start the server:

   ```bash
   npm start
   ```

2. Make an API call to initiate a medication reminder:

   ```bash
   curl -X POST http://localhost:3000/api/calls/initiate \
     -H "Content-Type: application/json" \
     -d '{
       "phoneNumber": "+1234567890",
       "message": "Time to take your medication"
     }'
   ```

3. View call logs:
   ```bash
   curl http://localhost:3000/api/calls/logs
   ```

## API Endpoints

- `POST /api/calls/initiate`: Initiate a new medication reminder call
- `POST /api/calls/webhook`: Twilio webhook for call handling
- `POST /api/calls/gather`: Handle patient voice responses
- `POST /api/calls/status`: Handle call status updates
- `GET /api/calls/logs`: Retrieve call logs

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Utility functions
├── models/         # Database models
├── tests/          # Test files
└── server.js       # Main application file
```

## Error Handling

The system includes comprehensive error handling:

- Global error handler for all uncaught errors
- Async utility wrapper for promise rejections
- Detailed error logging with Winston
- HTTP-appropriate error responses

## Testing

Run the test suite:

```bash
npm test
```

## Production Deployment

1. Set environment variables for production
2. Configure MongoDB for production use
3. Set up proper logging and monitoring
4. Use PM2 or similar for process management
5. Set up SSL/TLS for secure communications

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
