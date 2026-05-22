function normalizeString(value) {
  return String(value || '').trim().toLowerCase();
}

function computeScores(answers) {
  let aws = 50;
  let azure = 50;
  let gcp = 50;

  const projectType = normalizeString(answers.project_type);
  const scale = normalizeString(answers.project_scale);
  const budget = normalizeString(answers.budget_range);
  const region = normalizeString(answers.primary_region);
  const users = normalizeString(answers.active_users);
  const traffic = normalizeString(answers.traffic_pattern);
  const dbNeeded = normalizeString(answers.database_needed);
  const storageNeeded = normalizeString(answers.file_storage_needed);
  const ai = normalizeString(answers.ai_requirement);
  const microsoft = normalizeString(answers.microsoft_integration || 'not important');
  const ease = normalizeString(answers.ease_vs_control);
  const existing = normalizeString(answers.existing_provider);
  const compliance = normalizeString(answers.compliance_requirement || 'basic');
  const support = normalizeString(answers.support_requirement);

  if (projectType.includes('web')) {
    aws += 10;
    azure += 6;
    gcp += 6;
  } else if (projectType.includes('mobile')) {
    aws += 8;
    gcp += 8;
    azure += 4;
  } else if (projectType.includes('ai') || projectType.includes('ml')) {
    gcp += 15;
    aws += 8;
    azure += 6;
  } else if (projectType.includes('analytics')) {
    gcp += 12;
    aws += 8;
    azure += 6;
  } else if (projectType.includes('e-commerce')) {
    aws += 12;
    azure += 8;
    gcp += 6;
  } else if (projectType.includes('internal')) {
    azure += 12;
    aws += 8;
    gcp += 5;
  }

  if (scale === 'enterprise') {
    aws += 12;
    azure += 14;
    gcp += 8;
  } else if (scale === 'smb') {
    aws += 10;
    azure += 8;
    gcp += 8;
  } else if (scale === 'startup') {
    aws += 8;
    gcp += 10;
    azure += 6;
  } else if (scale === 'personal') {
    gcp += 10;
    aws += 6;
    azure += 5;
  }

  if (budget.includes('<$100')) {
    gcp += 12;
    aws += 6;
    azure += 6;
  } else if (budget.includes('$100-$500')) {
    gcp += 10;
    aws += 8;
    azure += 8;
  } else if (budget.includes('$500-$2,000')) {
    aws += 10;
    azure += 9;
    gcp += 8;
  } else if (budget.includes('$2,000-$10,000')) {
    aws += 12;
    azure += 12;
    gcp += 8;
  } else if (budget.includes('$10,000')) {
    aws += 14;
    azure += 14;
    gcp += 8;
  }

  if (users.includes('100,000')) {
    aws += 12;
    azure += 10;
    gcp += 10;
  } else if (users.includes('10,000-100,000')) {
    aws += 10;
    gcp += 9;
    azure += 8;
  } else if (users.includes('1,000-10,000')) {
    aws += 8;
    gcp += 8;
    azure += 7;
  }

  if (traffic.includes('heavy')) {
    aws += 12;
    gcp += 10;
    azure += 9;
  } else if (traffic.includes('moderate')) {
    aws += 8;
    gcp += 8;
    azure += 7;
  }

  if (dbNeeded === 'yes') {
    aws += 6;
    azure += 6;
    gcp += 5;
  }

  if (storageNeeded === 'yes') {
    aws += 6;
    gcp += 6;
    azure += 5;
  }

  if (ai === 'high') {
    gcp += 18;
    aws += 10;
    azure += 8;
  } else if (ai === 'medium') {
    gcp += 12;
    aws += 8;
    azure += 7;
  } else if (ai === 'low') {
    gcp += 6;
    aws += 5;
    azure += 5;
  }

  if (microsoft === 'critical') {
    azure += 18;
    aws += 6;
    gcp += 4;
  } else if (microsoft === 'important') {
    azure += 12;
    aws += 6;
    gcp += 4;
  } else if (microsoft === 'nice to have') {
    azure += 8;
    aws += 6;
    gcp += 4;
  }

  if (ease === 'prefer ease of use') {
    gcp += 8;
    azure += 7;
    aws += 6;
  } else if (ease === 'prefer advanced control') {
    aws += 10;
    azure += 8;
    gcp += 7;
  }

  if (existing.includes('aws')) {
    aws += 6;
  } else if (existing.includes('azure')) {
    azure += 6;
  } else if (existing.includes('gcp')) {
    gcp += 6;
  }

  if (compliance === 'strict') {
    aws += 10;
    azure += 10;
    gcp += 8;
  } else if (compliance === 'moderate') {
    aws += 6;
    azure += 6;
    gcp += 5;
  }

  if (support.includes('24/7')) {
    aws += 8;
    azure += 8;
    gcp += 6;
  } else if (support.includes('business')) {
    aws += 6;
    azure += 6;
    gcp += 5;
  }

  if (region.includes('europe') || region.includes('asia')) {
    aws += 4;
    azure += 4;
    gcp += 4;
  }

  const scores = {
    AWS: aws,
    Azure: azure,
    GCP: gcp,
  };

  const ranking = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([provider, score]) => ({ provider, score }));

  const topProvider = ranking[0].provider;
  const topScore = ranking[0].score;
  const secondScore = ranking[1].score;
  const confidence = Math.max(55, Math.min(95, Math.trunc(70 + (topScore - secondScore))));

  return {
    scores,
    ranking,
    top_provider: topProvider,
    confidence_score: confidence,
  };
}

function buildReasons(answers, scores) {
  const reasons = [];
  const top = scores.top_provider;
  const ai = normalizeString(answers.ai_requirement);
  const microsoft = normalizeString(answers.microsoft_integration);
  const scale = normalizeString(answers.project_scale);
  const traffic = normalizeString(answers.traffic_pattern);

  if (top === 'AWS') {
    reasons.push('Broad service catalog and mature ecosystem for web applications.');
    if (traffic.includes('heavy')) {
      reasons.push('Strong autoscaling options for spiky traffic patterns.');
    }
    if (scale === 'enterprise') {
      reasons.push('Proven at enterprise scale with extensive global regions.');
    }
  } else if (top === 'Azure') {
    reasons.push('Best fit for Microsoft tooling and enterprise IT needs.');
    if (microsoft === 'critical' || microsoft === 'important') {
      reasons.push('Deep integration with Microsoft products and identity systems.');
    }
    if (scale === 'enterprise') {
      reasons.push('Strong governance and compliance features for large organizations.');
    }
  } else {
    reasons.push('Excellent AI/ML and analytics capabilities for modern workloads.');
    if (ai === 'high' || ai === 'medium') {
      reasons.push('Well-known for competitive AI tooling and data services.');
    }
    if (scale === 'startup' || scale === 'personal') {
      reasons.push('Cost-effective for early-stage and prototype projects.');
    }
  }

  if (reasons.length < 3) {
    reasons.push('Balanced mix of performance, global reach, and service options.');
  }

  return reasons.slice(0, 4);
}

module.exports = {
  computeScores,
  buildReasons,
};
