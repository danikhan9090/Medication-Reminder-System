const twilioService = require("../services/twilioService");
const speechService = require("../services/speechService");
const CallLog = require("../models/CallLog");
const logger = require("../utils/logger");
const { AppError } = require("../utils/errorHandler");
const { asyncHandler } = require("../utils/asyncHandler");
const config = require("../config/config");

const initiateCall = asyncHandler(async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    throw new AppError("Phone number is required", 400);
  }

  const callbackUrl = `${config.server.baseUrl}/api/calls/webhook`;
  const call = await twilioService.initiateCall(phoneNumber, callbackUrl);

  await CallLog.create({
    callSid: call.sid,
    patientPhone: phoneNumber,
    status: "initiated",
    direction: "outbound",
    medicationList: config.medication.list,
  });

  logger.info(`Call initiated to ${phoneNumber} with SID: ${call.sid}`);

  res.status(200).json({
    status: "success",
    data: {
      callSid: call.sid,
      status: call.status,
    },
  });
});

const handleWebhook = asyncHandler(async (req, res) => {
  const { CallSid, CallStatus } = req.body;

  const callLog = await CallLog.findOne({ callSid: CallSid });
  if (!callLog) {
    throw new AppError("Call log not found", 404);
  }

  const prompt = speechService.generateMedicationPrompt(callLog.medicationList);
  const twiml = twilioService.generateTwiML(prompt, {
    gather: true,
    gatherCallback: `${config.server.baseUrl}/api/calls/gather`,
  });

  callLog.status = CallStatus;
  await callLog.save();

  logger.info(`Webhook received for call ${CallSid} with status ${CallStatus}`);

  res.type("text/xml");
  res.send(twiml);
});

const handleGather = asyncHandler(async (req, res) => {
  const { CallSid, SpeechResult } = req.body;

  const callLog = await CallLog.findOne({ callSid: CallSid });
  if (!callLog) {
    throw new AppError("Call log not found", 404);
  }

  callLog.patientResponse = SpeechResult;
  await callLog.save();

  logger.info(`Received speech result for call ${CallSid}: ${SpeechResult}`);

  const response = await speechService.processPatientResponse(SpeechResult);
  const twiml = twilioService.generateTwiML(response.message);

  res.type("text/xml");
  res.send(twiml);
});

const handleStatus = asyncHandler(async (req, res) => {
  const { CallSid, CallStatus, CallDuration } = req.body;

  const callLog = await CallLog.findOne({ callSid: CallSid });
  if (!callLog) {
    throw new AppError("Call log not found", 404);
  }

  callLog.status = CallStatus;
  callLog.duration = CallDuration;

  if (CallStatus === "no-answer") {
    const voicemailMessage =
      "We called to check on your medication but couldn't reach you. Please call us back or take your medications if you haven't done so.";
    const twiml = twilioService.generateTwiML(voicemailMessage, {
      recordVoicemail: true,
      recordCallback: `${config.server.baseUrl}/api/calls/recording`,
    });
    callLog.voicemailLeft = true;

    await twilioService.sendSMS(callLog.patientPhone, voicemailMessage);
    callLog.smsSent = true;

    if (callLog.needsRetry()) {
      callLog.callAttempts += 1;
      callLog.nextAttemptAt = new Date(Date.now() + 30 * 60 * 1000);
    }
  }

  await callLog.save();

  logger.info(`Call status updated for ${CallSid}: ${CallStatus}`);

  res.sendStatus(200);
});

const handleRecording = asyncHandler(async (req, res) => {
  const { CallSid, RecordingUrl } = req.body;

  const callLog = await CallLog.findOne({ callSid: CallSid });
  if (!callLog) {
    throw new AppError("Call log not found", 404);
  }

  const recording = await twilioService.handleRecording(CallSid, RecordingUrl);
  callLog.recordingUrl = recording.uri;
  await callLog.save();

  logger.info(`Recording saved for call ${CallSid}: ${recording.uri}`);

  res.sendStatus(200);
});

const getCallLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, phoneNumber } = req.query;
  const query = {};

  if (status) query.status = status;
  if (phoneNumber) query.patientPhone = phoneNumber;

  const callLogs = await CallLog.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await CallLog.countDocuments(query);

  logger.info(`Retrieved ${callLogs.length} call logs`);

  res.status(200).json({
    status: "success",
    results: callLogs.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
    },
    data: {
      callLogs,
    },
  });
});

module.exports = {
  initiateCall,
  handleWebhook,
  handleGather,
  handleStatus,
  handleRecording,
  getCallLogs,
};
