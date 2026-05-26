# Cloud Advisor

Cloud Advisor is a beginner-friendly, full-stack web app that recommends the best cloud provider (AWS, Azure, GCP) based on a short questionnaire. It runs on **Node.js (Express)** and stores assessments in **SQLite**.

## Highlights
- Multi-step assessment UI with progress tracking.
- Scoring engine that ranks AWS, Azure, and GCP.
- Optional Gemini-generated explanation and service shortlist (with robust fallbacks).
- History view with saved assessments.
- SQLite persistence via prepared statements.

## Tech Stack
- **Backend:** Node.js 18+, Express, SQLite3
- **Frontend:** HTML, CSS, Vanilla JS
- **AI (optional):** Google Gemini API (server-side only)

## Project Structure
```
cloud_advisor/
├─ public/
│  ├─ index.html
│  ├─ assessment.html
│  ├─ result.html
│  ├─ history.html
│  └─ assets/
│     ├─ css/styles.css
│     └─ js/app.js
├─ backend/
│  ├─ config.js
│  ├─ db.js
│  ├─ gemini.js
│  └─ scoring.js
├─ data/                 # SQLite DB created at runtime
├─ schema.sql            # Reference schema (SQL)
├─ package.json
├─ server.js
└─ README.md
```

## Local Setup
1. Install **Node.js 18+** (required for native `fetch`).
2. Install dependencies:
   - `npm install`
3. Start the server:
   - `npm start`
4. Open `http://localhost:3000`.

## Configuration
Gemini usage is optional. The app uses fallback explanations and service picks if Gemini is unavailable.

Update the key in [backend/config.js](backend/config.js):
```js
module.exports = {
  DB_PATH: path.join(__dirname, '..', 'data', 'cloud_advisor.sqlite'),
  GEMINI_API_KEY: 'YOUR_API_KEY_HERE'
};
```

> Note: For production, move secrets out of source control and into environment variables.

## API Endpoints
All endpoints are served by Express in [server.js](server.js).

### POST /api/submit
Submits the assessment and returns scores, reasons, and service recommendations.

**Required fields (JSON body):**
`name`, `email`, `industry`, `project_type`, `project_scale`, `budget_range`,
`primary_region`, `active_users`, `traffic_pattern`, `database_needed`,
`file_storage_needed`, `ai_requirement`, `ease_vs_control`, `existing_provider`,
`support_requirement`, `deployment_preference`

**Response:**
```json
{
  "top_provider": "AWS",
  "ranking": [{ "provider": "AWS", "score": 120 }],
  "confidence_score": 82,
  "reasons": ["..."] ,
  "explanation": "...",
  "services": [{ "name": "...", "reasons": ["..."] }]
}
```

### GET /api/submissions
Returns recent submissions (default 50, max 200).

### DELETE /api/submissions
Clears all submission history.

## Scoring Logic
Scoring lives in [backend/scoring.js](backend/scoring.js). It assigns a base score to each provider, then adjusts scores based on answers (scale, budget, AI needs, Microsoft integration, etc.). The top provider is the highest score, and confidence is derived from the gap between the top two scores.

## Data Storage
SQLite is initialized in [backend/db.js](backend/db.js). The database file is created automatically at:

- `data/cloud_advisor.sqlite`

The `schema.sql` file is a reference schema that mirrors the stored fields.

## Deployment (EC2 Quick Start)
1. Launch an EC2 instance (Amazon Linux 2023 or Ubuntu 22.04).
2. Allow inbound **HTTP (80)** and **SSH (22)** in the security group.
3. Install Node.js 18+.
4. Upload the project, run `npm install`, then `npm start`.
5. Open `http://YOUR_EC2_PUBLIC_IP:3000`.

## Security Notes
- Gemini requests are server-side only.
- The frontend never sees API keys.
- Inputs are validated and written with prepared statements.

## Troubleshooting
- **Gemini not returning results:** the app will fall back automatically.
- **Port in use:** set `PORT` when starting the server (e.g., `PORT=4000 npm start`).
- **Database reset:** delete `data/cloud_advisor.sqlite` to start fresh.
