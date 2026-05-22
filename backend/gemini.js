const { GEMINI_API_KEY } = require('./config');

function buildGeminiPrompt(answers, scores) {
  const summary = JSON.stringify(
    {
      answers,
      scores: scores.scores,
      top_provider: scores.top_provider,
    },
    null,
    2
  );

  return `You are a cloud advisor. Use the data to recommend services from ONLY the top_provider.\n\nReturn ONLY valid JSON with this shape:\n{\n  "explanation": "string (4-6 sentences)",\n  "services": [\n    { "name": "service name", "reasons": ["reason 1", "reason 2", "reason 3"] }\n  ]\n}\n\nRules:\n- Provide 3-5 services from the top_provider.\n- Each service must include 2-4 concise bullet reasons.\n- Keep reasons tied to the user answers.\n\nData:\n${summary}`;
}

function extractJson(text) {
  if (!text) {
    return null;
  }
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    return null;
  }
  try {
    return JSON.parse(match[0]);
  } catch (error) {
    return null;
  }
}

async function fetchGeminiInsights(answers, scores) {
  if (!GEMINI_API_KEY) {
    return null;
  }

  if (typeof fetch !== 'function') {
    return null;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(
    GEMINI_API_KEY
  )}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: buildGeminiPrompt(answers, scores) }],
      },
    ],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const parsed = extractJson(rawText);
  if (!parsed || !parsed.explanation || !Array.isArray(parsed.services)) {
    return null;
  }

  return {
    explanation: String(parsed.explanation),
    services: parsed.services
      .filter((item) => item && item.name && Array.isArray(item.reasons))
      .map((item) => ({
        name: String(item.name),
        reasons: item.reasons.map((reason) => String(reason)).slice(0, 4),
      }))
      .slice(0, 5),
  };
}

function fallbackExplanation(scores) {
  const top = scores.top_provider;

  if (top === 'AWS') {
    return 'AWS offers the widest range of services and a very mature ecosystem. It is a safe choice for most web and general workloads, especially when you want strong scalability and global coverage. AWS also provides many tools for storage, compute, and security that grow with your project.';
  }

  if (top === 'Azure') {
    return 'Azure is a strong fit when Microsoft tools and enterprise governance matter. It works well with Windows, Active Directory, and common corporate IT workflows. Azure also delivers solid global coverage and robust compliance features.';
  }

  return 'Google Cloud Platform shines for AI/ML and analytics-driven workloads. It is often cost-effective for prototypes and data-heavy projects while still providing reliable global infrastructure. GCP’s data services and AI tooling are a major advantage for modern applications.';
}

function fallbackServices(scores) {
  const top = scores.top_provider;
  if (top === 'AWS') {
    return [
      {
        name: 'Amazon EC2 + Auto Scaling',
        reasons: [
          'Flexible compute for web applications and APIs.',
          'Scales with traffic spikes automatically.',
          'Wide regional availability for global reach.',
        ],
      },
      {
        name: 'Amazon RDS (MySQL/PostgreSQL)',
        reasons: [
          'Managed relational database with backups.',
          'Simplifies maintenance for small teams.',
          'Good fit for transactional workloads.',
        ],
      },
      {
        name: 'Amazon S3',
        reasons: [
          'Durable object storage for files and assets.',
          'Low cost with lifecycle policies.',
          'Integrates easily with CDN and compute.',
        ],
      },
    ];
  }

  if (top === 'Azure') {
    return [
      {
        name: 'Azure App Service',
        reasons: [
          'Managed hosting for web apps and APIs.',
          'Easy deployment and scaling.',
          'Integrates with Azure identity and monitoring.',
        ],
      },
      {
        name: 'Azure SQL Database',
        reasons: [
          'Managed relational database with backups.',
          'Strong compliance and governance tooling.',
          'Fits enterprise app patterns.',
        ],
      },
      {
        name: 'Azure Blob Storage',
        reasons: [
          'Scalable object storage for files and media.',
          'Cost-effective tiers for growth.',
          'Easy integration with CDN and apps.',
        ],
      },
    ];
  }

  return [
    {
      name: 'Google Compute Engine',
      reasons: [
        'Flexible VMs for custom workloads.',
        'Strong global network performance.',
        'Good cost/performance for startups.',
      ],
    },
    {
      name: 'Cloud SQL',
      reasons: [
        'Managed relational database with backups.',
        'Easy setup for web apps.',
        'Supports MySQL and PostgreSQL.',
      ],
    },
    {
      name: 'Cloud Storage',
      reasons: [
        'Durable object storage for assets.',
        'Integrates with analytics and AI tools.',
        'Simple pricing tiers.',
      ],
    },
  ];
}

module.exports = {
  fetchGeminiInsights,
  fallbackExplanation,
  fallbackServices,
};
