const express = require('express');
const {
  initiateCall,
  handleWebhook,
  handleGather,
  handleStatus,
  handleRecording,
  getCallLogs,
} = require('../controllers/callController');

const router = express.Router();

router.post('/webhook', handleWebhook);
router.post('/gather', handleGather);
router.post('/status', handleStatus);
router.post('/recording', handleRecording);

router.post('/initiate', initiateCall);
router.get('/logs', getCallLogs);

module.exports = router; 