const { Deepgram } = require("@deepgram/sdk");
const { ElevenLabsClient } = require("elevenlabs");
const config = require("../config/config");
const logger = require("../utils/logger");
const { AppError } = require("../utils/errorHandler");

class SpeechService {
  constructor() {
    this.deepgram = new Deepgram(config.deepgram.apiKey);
    this.elevenLabs = new ElevenLabsClient({
      apiKey: config.elevenLabs.apiKey,
    });
  }

  async speechToText(audioBuffer) {
    try {
      const response = await this.deepgram.transcription.preRecorded(
        {
          buffer: audioBuffer,
          mimetype: "audio/wav",
        },
        {
          punctuate: true,
          model: "general",
          language: "en-US",
          smart_format: true,
          utterances: true,
          diarize: true,
        }
      );

      const transcript =
        response.results?.channels[0]?.alternatives[0]?.transcript;

      if (!transcript) {
        throw new AppError("No transcript found in the response", 400);
      }

      logger.info("Successfully transcribed audio to text");
      return transcript;
    } catch (error) {
      logger.error("Error in speech to text conversion:", error);
      throw new AppError("Failed to convert speech to text", 500);
    }
  }

  async textToSpeech(text, voiceId = "default") {
    try {
      const audioStream = await this.elevenLabs.textToSpeech({
        text,
        voiceId,
        modelId: "eleven_monolingual_v1",
        voiceSettings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      });

      logger.info("Successfully converted text to speech");
      return audioStream;
    } catch (error) {
      logger.error("Error in text to speech conversion:", error);
      throw new AppError("Failed to convert text to speech", 500);
    }
  }

  generateMedicationPrompt(medicationList) {
    const medications = medicationList.join(", ");
    return `Hello, this is a reminder from your healthcare provider to confirm your medications for the day. Please confirm if you have taken your ${medications} today.`;
  }

  async processPatientResponse(response) {
    try {
      const lowerResponse = response.toLowerCase();

      const affirmativePatterns = [
        "yes",
        "yeah",
        "yep",
        "correct",
        "taken",
        "took",
      ];
      const negativePatterns = ["no", "nope", "not", "haven't", "have not"];

      const isAffirmative = affirmativePatterns.some((pattern) =>
        lowerResponse.includes(pattern)
      );
      const isNegative = negativePatterns.some((pattern) =>
        lowerResponse.includes(pattern)
      );

      if (isAffirmative) {
        return {
          status: "confirmed",
          message: "Thank you for confirming. Have a great day!",
        };
      } else if (isNegative) {
        return {
          status: "denied",
          message:
            "Please take your medication now. We will call you back later to confirm.",
        };
      } else {
        return {
          status: "unclear",
          message: "I did not understand your response. Please try again.",
        };
      }
    } catch (error) {
      logger.error("Error processing patient response:", error);
      throw new AppError("Failed to process patient response", 500);
    }
  }
}

module.exports = new SpeechService();
