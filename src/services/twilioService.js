const twilio = require('twilio');
const config = require('../config/config');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errorHandler');

class TwilioService {
  constructor() {
    this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
  }

  async initiateCall(toNumber, callbackUrl) {
    try {
      const call = await this.client.calls.create({
        to: toNumber,
        from: config.twilio.phoneNumber,
        url: callbackUrl,
        statusCallback: `${callbackUrl}/status`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        statusCallbackMethod: 'POST',
        record: true,
        recordingStatusCallback: `${callbackUrl}/recording`,
        recordingStatusCallbackEvent: ['completed'],
        recordingStatusCallbackMethod: 'POST',
      });

      logger.info(`Initiated call to ${toNumber} with SID: ${call.sid}`);
      return call;
    } catch (error) {
      logger.error('Error initiating Twilio call:', error);
      throw new AppError('Failed to initiate call', 500);
    }
  }

  async sendSMS(toNumber, message) {
    try {
      const sms = await this.client.messages.create({
        to: toNumber,
        from: config.twilio.phoneNumber,
        body: message,
      });

      logger.info(`Sent SMS to ${toNumber} with SID: ${sms.sid}`);
      return sms;
    } catch (error) {
      logger.error('Error sending SMS:', error);
      throw new AppError('Failed to send SMS', 500);
    }
  }

  generateTwiML(message, options = {}) {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();

    if (options.gather) {
      const gather = response.gather({
        input: 'speech',
        timeout: 3,
        action: options.gatherCallback,
        method: 'POST',
        speechTimeout: 'auto',
        enhanced: true,
        language: 'en-US',
      });
      gather.say(message, { voice: 'Polly.Amy' });
    } else {
      response.say(message, { voice: 'Polly.Amy' });
      if (options.recordVoicemail) {
        response.record({
          action: options.recordCallback,
          maxLength: 30,
          transcribe: true,
          transcribeCallback: options.transcribeCallback,
          playBeep: true,
        });
      }
    }

    return response.toString();
  }

  async handleRecording(callSid, recordingUrl) {
    try {
      const recording = await this.client.recordings(recordingUrl).fetch();
      logger.info(`Recording fetched for call ${callSid}: ${recording.uri}`);
      return recording;
    } catch (error) {
      logger.error(`Error fetching recording for call ${callSid}:`, error);
      throw new AppError('Failed to fetch recording', 500);
    }
  }

  async getCallDetails(callSid) {
    try {
      const call = await this.client.calls(callSid).fetch();
      logger.info(`Call details fetched for SID: ${callSid}`);
      return call;
    } catch (error) {
      logger.error(`Error fetching call details for SID ${callSid}:`, error);
      throw new AppError('Failed to fetch call details', 500);
    }
  }
}

module.exports = new TwilioService(); 