const path = require('path');
const express = require('express');
const {
  initDb,
  insertSubmission,
  insertFeedback,
  listSubmissions,
  clearSubmissions,
} = require('./backend/db');
const { computeScores, buildReasons } = require('./backend/scoring');
const { fetchGeminiInsights, fallbackExplanation, fallbackServices } = require('./backend/gemini');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/submit', async (req, res) => {
  const input = req.body || {};

  const requiredFields = [
    'name',
    'email',
    'industry',
    'project_type',
    'project_scale',
    'budget_range',
    'primary_region',
    'active_users',
    'traffic_pattern',
    'database_needed',
    'file_storage_needed',
    'ai_requirement',
    'ease_vs_control',
    'existing_provider',
    'support_requirement',
    'deployment_preference',
  ];

  for (const field of requiredFields) {
    const value = input[field];
    if (typeof value === 'undefined' || String(value).trim() === '') {
      return res.status(422).json({ error: `Missing field: ${field}` });
    }
  }

  const email = String(input.email || '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(422).json({ error: 'Invalid email address' });
  }

  try {
    const scores = computeScores(input);
    const reasons = buildReasons(input, scores);
    const gemini = await fetchGeminiInsights(input, scores);
    const explanation = gemini?.explanation || fallbackExplanation(scores);
    const services = gemini?.services || fallbackServices(scores);

    const submissionId = await insertSubmission({
      ...input,
      microsoft_integration: input.microsoft_integration || 'Not important',
      compliance_requirement: input.compliance_requirement || 'Basic',
      aws_score: scores.scores.AWS,
      azure_score: scores.scores.Azure,
      gcp_score: scores.scores.GCP,
      final_recommendation: scores.top_provider,
      confidence_score: scores.confidence_score,
      explanation,
      reasons_json: JSON.stringify(reasons || []),
      services_json: JSON.stringify(services || []),
    });

    return res.json({
      submission_id: submissionId,
      top_provider: scores.top_provider,
      ranking: scores.ranking,
      confidence_score: scores.confidence_score,
      reasons,
      explanation,
      services,
    });
  } catch (error) {
    console.error('Submit error:', error);
    const debugFlag = process.env.APP_DEBUG || '';
    const debugEnabled = ['1', 'true', 'yes'].includes(debugFlag.toLowerCase());
    if (debugEnabled) {
      return res.status(500).json({
        error: 'Server error.',
        details: error?.message || String(error),
      });
    }
    return res.status(500).json({ error: 'Server error. Check logs.' });
  }
});

app.get('/api/submissions', async (req, res) => {
  const limit = Number.parseInt(req.query.limit, 10);
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 200) : 50;
  try {
    const rows = await listSubmissions(safeLimit);
    return res.json({ submissions: rows });
  } catch (error) {
    console.error('History error:', error);
    return res.status(500).json({ error: 'Server error. Check logs.' });
  }
});

app.delete('/api/submissions', async (req, res) => {
  try {
    await clearSubmissions();
    return res.json({ ok: true });
  } catch (error) {
    console.error('Clear history error:', error);
    return res.status(500).json({ error: 'Server error. Check logs.' });
  }
});

app.post('/api/feedback', async (req, res) => {
  const input = req.body || {};
  const rating = Number.parseInt(input.rating, 10);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return res.status(422).json({ error: 'Rating must be between 1 and 5.' });
  }

  const comment = String(input.comment || '').trim();
  const submissionId = Number.isFinite(Number(input.submission_id))
    ? Number.parseInt(input.submission_id, 10)
    : null;

  try {
    const feedbackId = await insertFeedback({
      submission_id: submissionId,
      rating,
      comment,
    });
    return res.json({ ok: true, feedback_id: feedbackId });
  } catch (error) {
    console.error('Feedback error:', error);
    return res.status(500).json({ error: 'Server error. Check logs.' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Cloud Advisor running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });
