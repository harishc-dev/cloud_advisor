const form = document.getElementById('assessment-form');
const messageEl = document.getElementById('form-message');

if (form) {
  const steps = Array.from(form.querySelectorAll('.step'));
  const progressFill = document.querySelector('.progress-fill');
  const stepCurrent = document.getElementById('step-current');
  const stepTotal = document.getElementById('step-total');
  const prevBtn = document.getElementById('prev-step');
  const nextBtn = document.getElementById('next-step');
  const submitBtn = document.getElementById('submit-step');
  let currentStep = 0;

  if (stepTotal) {
    stepTotal.textContent = String(steps.length || 1);
  }

  const isStepComplete = (step) => {
    const requiredFields = Array.from(step.querySelectorAll('input, select, textarea')).filter(
      (el) => el.required
    );

    return requiredFields.every((el) => {
      if (el.type === 'radio') {
        const group = step.querySelectorAll(`input[type="radio"][name="${el.name}"]`);
        return Array.from(group).some((radio) => radio.checked);
      }
      if (el.type === 'checkbox') {
        return el.checked;
      }
      return String(el.value || '').trim() !== '';
    });
  };

  const updateProgress = () => {
    const completed = steps.filter(isStepComplete).length;
    const total = steps.length || 1;
    const percent = Math.round((completed / total) * 100);
    if (progressFill) {
      progressFill.style.width = `${percent}%`;
    }
  };

  const showStep = (index) => {
    steps.forEach((step, i) => {
      step.classList.toggle('active', i === index);
    });
    if (stepCurrent) {
      stepCurrent.textContent = String(index + 1);
    }
    if (prevBtn) {
      prevBtn.style.display = index === 0 ? 'none' : 'inline-flex';
    }
    if (nextBtn) {
      nextBtn.style.display = index === steps.length - 1 ? 'none' : 'inline-flex';
    }
    if (submitBtn) {
      submitBtn.style.display = index === steps.length - 1 ? 'inline-flex' : 'none';
    }
    updateProgress();
  };

  if (steps.length > 0) {
    showStep(0);
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentStep = Math.max(0, currentStep - 1);
      showStep(currentStep);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const step = steps[currentStep];
      if (!isStepComplete(step)) {
        const invalid = step.querySelector('input:invalid, select:invalid, textarea:invalid');
        if (invalid && typeof invalid.reportValidity === 'function') {
          invalid.reportValidity();
        }
        return;
      }
      currentStep = Math.min(steps.length - 1, currentStep + 1);
      showStep(currentStep);
    });
  }

  form.addEventListener('input', updateProgress);
  form.addEventListener('change', updateProgress);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    messageEl.textContent = 'Submitting...';

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const raw = await response.text();
      let result;
      try {
        result = JSON.parse(raw);
      } catch (parseError) {
        const preview = raw.replace(/\s+/g, ' ').slice(0, 200);
        throw new Error(`Server returned an invalid response. ${preview}`);
      }

      if (!response.ok) {
        throw new Error(result.error || 'Something went wrong');
      }

      localStorage.setItem('cloudAdvisorResult', JSON.stringify(result));
      window.location.href = 'result.html';
    } catch (error) {
      messageEl.textContent = error.message;
    }
  });
}

const resultCard = document.getElementById('result-card');
if (resultCard) {
  const data = JSON.parse(localStorage.getItem('cloudAdvisorResult') || '{}');
  if (!data.top_provider) {
    resultCard.innerHTML = '<p>No results found. Please take the assessment.</p>';
  } else {
    document.getElementById('top-provider').textContent = `Top pick: ${data.top_provider}`;
    document.getElementById('confidence').textContent = `Confidence: ${data.confidence_score}%`;

    const scoreGrid = document.getElementById('score-grid');
    scoreGrid.innerHTML = '';
    data.ranking.forEach((item) => {
      const div = document.createElement('div');
      div.className = 'score-card';
      div.innerHTML = `<h4>${item.provider}</h4><p>${item.score} points</p>`;
      scoreGrid.appendChild(div);
    });

    const reasonsList = document.getElementById('reasons-list');
    reasonsList.innerHTML = '';
    data.reasons.forEach((reason) => {
      const li = document.createElement('li');
      li.textContent = reason;
      reasonsList.appendChild(li);
    });

    const servicesList = document.getElementById('services-list');
    if (servicesList) {
      servicesList.innerHTML = '';
      (data.services || []).forEach((service) => {
        const card = document.createElement('div');
        card.className = 'score-card';
        const reasonsHtml = (service.reasons || [])
          .map((reason) => `<li>${reason}</li>`)
          .join('');
        card.innerHTML = `
          <h4>${service.name}</h4>
          <ul>${reasonsHtml}</ul>
        `;
        servicesList.appendChild(card);
      });
    }

    document.getElementById('explanation').textContent = data.explanation;
  }
}

const feedbackForm = document.getElementById('feedback-form');
if (feedbackForm) {
  const feedbackMessage = document.getElementById('feedback-message');
  feedbackForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (feedbackMessage) {
      feedbackMessage.textContent = 'Sending feedback...';
    }

    const formData = new FormData(feedbackForm);
    const payload = Object.fromEntries(formData.entries());
    const stored = JSON.parse(localStorage.getItem('cloudAdvisorResult') || '{}');
    if (stored.submission_id) {
      payload.submission_id = stored.submission_id;
    }

    try {
      const response = await fetch('api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const raw = await response.text();
      let result;
      try {
        result = JSON.parse(raw);
      } catch (parseError) {
        const preview = raw.replace(/\s+/g, ' ').slice(0, 200);
        throw new Error(`Server returned an invalid response. ${preview}`);
      }

      if (!response.ok) {
        throw new Error(result.error || 'Unable to submit feedback');
      }

      if (feedbackMessage) {
        feedbackMessage.textContent = 'Thanks! Your feedback was saved.';
      }
      feedbackForm.reset();
    } catch (error) {
      if (feedbackMessage) {
        feedbackMessage.textContent = error.message;
      }
    }
  });
}

const historyList = document.getElementById('history-list');
if (historyList) {
  const empty = document.getElementById('history-empty');
  const clearBtn = document.getElementById('clear-history');

  const renderHistory = (submissions) => {
    historyList.innerHTML = '';
    if (!submissions || submissions.length === 0) {
      if (empty) {
        empty.textContent = 'No assessments yet. Run an assessment to see it here.';
      }
      return;
    }
    if (empty) {
      empty.textContent = '';
    }

    submissions.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'history-card';
      const created = item.created_at ? new Date(item.created_at) : null;
      const createdLabel = created ? created.toLocaleString() : 'Just now';
      card.innerHTML = `
        <strong>${item.name}</strong>
        <span class="history-meta">${createdLabel}</span>
        <div>Top pick: <strong>${item.final_recommendation}</strong></div>
        <div class="history-meta">${item.project_type} • ${item.project_scale} • ${item.budget_range}</div>
        <button class="button ghost" type="button">Open result</button>
      `;
      const button = card.querySelector('button');
      button.addEventListener('click', () => {
        let storedReasons = [];
        let storedServices = [];
        try {
          storedReasons = item.reasons_json ? JSON.parse(item.reasons_json) : [];
        } catch (error) {
          storedReasons = [];
        }
        try {
          storedServices = item.services_json ? JSON.parse(item.services_json) : [];
        } catch (error) {
          storedServices = [];
        }
        localStorage.setItem(
          'cloudAdvisorResult',
          JSON.stringify({
            submission_id: item.id,
            top_provider: item.final_recommendation,
            ranking: [
              { provider: 'AWS', score: item.aws_score },
              { provider: 'Azure', score: item.azure_score },
              { provider: 'GCP', score: item.gcp_score },
            ].sort((a, b) => b.score - a.score),
            confidence_score: item.confidence_score,
            reasons: storedReasons,
            explanation: item.explanation,
            services: storedServices,
          })
        );
        window.location.href = 'result.html';
      });
      historyList.appendChild(card);
    });
  };

  const loadHistory = () => {
    fetch('api/submissions')
      .then((res) => res.json())
      .then((data) => renderHistory(data.submissions || []))
      .catch(() => {
        if (empty) {
          empty.textContent = 'Unable to load history.';
        }
      });
  };

  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      const confirmed = window.confirm('Delete all assessment history?');
      if (!confirmed) return;
      await fetch('api/submissions', { method: 'DELETE' });
      loadHistory();
    });
  }

  loadHistory();
}
