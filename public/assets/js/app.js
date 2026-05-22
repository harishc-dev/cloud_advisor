const form = document.getElementById('assessment-form');
const messageEl = document.getElementById('form-message');

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    messageEl.textContent = 'Submitting...';

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('api/submit.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
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

    document.getElementById('explanation').textContent = data.explanation;
  }
}
