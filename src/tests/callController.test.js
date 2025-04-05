const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../server');
const CallLog = require('../models/CallLog');
const twilioService = require('../services/twilioService');
const speechService = require('../services/speechService');

jest.mock('../services/twilioService');
jest.mock('../services/speechService');

describe('Call Controller', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/medication-reminder-test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await CallLog.deleteMany({});
    jest.clearAllMocks();
  });

  describe('POST /api/calls/initiate', () => {
    it('should initiate a call successfully', async () => {
      const mockCall = {
        sid: 'test-call-sid',
        status: 'initiated',
      };

      twilioService.initiateCall.mockResolvedValue(mockCall);

      const response = await request(app)
        .post('/api/calls/initiate')
        .send({ phoneNumber: '+1234567890' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.callSid).toBe(mockCall.sid);
      expect(response.body.data.status).toBe(mockCall.status);

      const callLog = await CallLog.findOne({ callSid: mockCall.sid });
      expect(callLog).toBeTruthy();
      expect(callLog.patientPhone).toBe('+1234567890');
      expect(callLog.status).toBe('initiated');
    });

    it('should return 400 if phone number is missing', async () => {
      const response = await request(app)
        .post('/api/calls/initiate')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Phone number is required');
    });
  });

  describe('POST /api/calls/webhook', () => {
    it('should handle webhook successfully', async () => {
      const callSid = 'test-call-sid';
      const callStatus = 'ringing';

      await CallLog.create({
        callSid,
        patientPhone: '+1234567890',
        status: 'initiated',
        direction: 'outbound',
      });

      const response = await request(app)
        .post('/api/calls/webhook')
        .send({ CallSid: callSid, CallStatus: callStatus });

      expect(response.status).toBe(200);
      expect(response.type).toBe('text/xml');

      const callLog = await CallLog.findOne({ callSid });
      expect(callLog.status).toBe(callStatus);
    });

    it('should return 404 if call log not found', async () => {
      const response = await request(app)
        .post('/api/calls/webhook')
        .send({ CallSid: 'non-existent-sid', CallStatus: 'ringing' });

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('fail');
    });
  });

  describe('POST /api/calls/gather', () => {
    it('should handle patient response successfully', async () => {
      const callSid = 'test-call-sid';
      const speechResult = 'Yes, I have taken my medication';

      await CallLog.create({
        callSid,
        patientPhone: '+1234567890',
        status: 'in-progress',
        direction: 'outbound',
      });

      speechService.processPatientResponse.mockResolvedValue({
        status: 'confirmed',
        message: 'Thank you for confirming. Have a great day!',
      });

      const response = await request(app)
        .post('/api/calls/gather')
        .send({ CallSid: callSid, SpeechResult: speechResult });

      expect(response.status).toBe(200);
      expect(response.type).toBe('text/xml');

      const callLog = await CallLog.findOne({ callSid });
      expect(callLog.patientResponse).toBe(speechResult);
    });
  });

  describe('GET /api/calls/logs', () => {
    it('should return call logs with pagination', async () => {
      await CallLog.create([
        {
          callSid: 'test-call-1',
          patientPhone: '+1234567890',
          status: 'completed',
          direction: 'outbound',
        },
        {
          callSid: 'test-call-2',
          patientPhone: '+1234567890',
          status: 'completed',
          direction: 'outbound',
        },
      ]);

      const response = await request(app)
        .get('/api/calls/logs')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.results).toBe(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.data.callLogs).toHaveLength(2);
    });
  });
}); 