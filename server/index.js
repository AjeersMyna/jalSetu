const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { logDispatchToDynamoDB } = require('./aws');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'JalSetu Dispatch Engine',
    awsRegion: process.env.AWS_REGION || 'ap-south-1'
  });
});

app.get('/api/wards', (req, res) => {
  try {
    const raw = fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8');
    const wards = JSON.parse(raw);

    const enriched = wards.map(w => {
      const margin = w.currentWaterLevelMeters - w.criticalThresholdMeters;
      const rawDays = margin > 0 ? (margin / w.dailyDepletionRate).toFixed(1) : 0;
      const daysRemaining = Math.max(0, parseFloat(rawDays));

      let dispatchStatus = 'STABLE';
      let actionRecommendation = 'Normal bore extraction permitted. Regular audit.';
      let priorityScore = 1;

      if (daysRemaining <= 1.5) {
        dispatchStatus = 'CRITICAL';
        actionRecommendation = 'Immediate emergency tanker dispatch triggered. Non-essential supply halted.';
        priorityScore = 3;
      } else if (daysRemaining <= 5) {
        dispatchStatus = 'ELEVATED';
        actionRecommendation = 'Stage 1 pooling: Schedule shared society tanker batch to save 30% surge rate.';
        priorityScore = 2;
      }

      return {
        ...w,
        daysRemaining,
        dispatchStatus,
        priorityScore,
        actionRecommendation
      };
    });

    enriched.sort((a, b) => b.priorityScore - a.priorityScore || a.daysRemaining - b.daysRemaining);

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read ward data' });
  }
});

// Logs tanker bookings to AWS DynamoDB
app.post('/api/dispatch/book', async (req, res) => {
  const { wardId, tankerCount } = req.body;

  const bookingRecord = {
    bookingId: `BK-${Date.now().toString().slice(-6)}`,
    wardId,
    tankerCount: tankerCount || 1,
    dispatchedAt: new Date().toISOString(),
    status: 'CONFIRMED'
  };

  // Persists item in AWS DynamoDB
  await logDispatchToDynamoDB(bookingRecord);

  res.json({
    success: true,
    ...bookingRecord
  });
});

app.listen(PORT, () => {
  console.log(`JalSetu API server listening on http://localhost:${PORT}`);
});
