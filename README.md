WATERLILY SURVEY — TAKE-HOME SUBMISSION

OVERVIEW
A small end-to-end survey app that collects basic demographic info, validates inputs, saves to SQLite, and shows a post-submission review. Built to the 2–3 hour brief with sensible trade-offs and a clean UX.

TECH STACK
• Frontend: React + TypeScript + Tailwind
• Backend: Node.js (Express)
• Database: SQLite (file-backed, no external setup)

FEATURES
• Single-question stepper with Next/Previous and a progress bar
• Validation
– Age must be a number > 0 (and ≤ 120)
– Gender “Other” → requires a free-text “Please specify” field
– Short bio limited to 500 non-space characters (spaces/newlines don’t count), live counter + hard cap
• Autosave drafts to localStorage and “Clear draft” action
• Review screen: “Thank you” message with a concise summary of answers
• API + persistence
– POST /api/responses → returns { id }
– GET /api/responses/:id → returns stored JSON
– Idempotent table creation (CREATE TABLE IF NOT EXISTS)

PROJECT STRUCTURE
• client/ — React app (TypeScript + Tailwind)
– src/components/SurveyForm.tsx — stepper, validation, autosave
– src/components/Review.tsx — thank-you + summary view
– src/data/questions.ts — question schema
– src/types.ts — shared types
– src/App.tsx — toggles between Form and Review by id
• server/ — Express API + SQLite
– src/index.ts — routes and SQLite init (data.db)
• .gitignore — ignores node_modules, build artifacts, and data.db

QUICK START (DEVELOPMENT)

Prerequisites: Node 18+ and npm

Server (API)

Open terminal in the server folder:

cd server

npm install

npm run dev

You should see: API listening on http://localhost:4000

This creates (or reuses) server/data.db and ensures the responses table exists.

Client (Web)

Open a new terminal in the client folder:

cd client

npm install

npm start

The app opens at http://localhost:3000

Client dev proxy (already set): client/package.json has "proxy": "http://127.0.0.1:4000" so /api/... calls from the React dev server go to the API during development. If you change the proxy, restart npm start.

MANUAL END-TO-END CHECK (ABOUT 1 MINUTE)

Open http://localhost:3000

Fill the survey:
– Age > 0
– Gender (choose “Other” to see the required “Please specify” input)
– Short bio (watch the live non-space counter; max 500)

Click Submit → you land on the Thank You / Review screen and see your saved answers.

API REFERENCE

POST /api/responses
• Stores the submission (JSON blob) and returns the new id.
• Example Request JSON: { "age": "30", "gender": "Other", "genderOther": "NB", "bio": "Hello" }
• Example Response JSON: { "id": 6 }

GET /api/responses/:id
• Fetches the previously stored JSON.
• Example Response JSON: { "age": "30", "gender": "Other", "genderOther": "NB", "bio": "Hello" }

VALIDATION RULES
• Age: required, numeric, > 0 and ≤ 120 (input also constrained in the UI)
• Gender: required; if “Other”, then genderOther is required
• Bio: required; ≤ 500 non-space characters (live counter + hard cap)
• Buttons disable until the current step is valid; inline, friendly error messages

TROUBLESHOOTING (QUICK)
• 404 on Review after submit → ensure the client proxy is set and React dev server was restarted; verify only one API server is running and both POST/GET use the same server/data.db.
• Port in use → run API on a different port:
– PowerShell: $env:PORT=5001; npm run dev
• Quick API sanity test (PowerShell):
– $body = @{ age="31"; gender="Other"; genderOther="NB"; bio="test" } | ConvertTo-Json
– $resp = Invoke-RestMethod -Uri "http://127.0.0.1:4000/api/responses" -Method Post -ContentType "application/json" -Body $body
– Invoke-RestMethod -Uri ("http://127.0.0.1:4000/api/responses/{0}" -f $resp.id)

KEY DECISIONS & TRADE-OFFS
• SQLite with a JSON payload column: fastest durable storage with zero external setup for a take-home. With more time, I’d normalize columns (age INT, gender TEXT, created_at) and add server-side validation.
• UX first: I focused on a smooth intake flow—stepper, clear validation, autosave, and a focused review.
• Tailwind for velocity: utility classes keep styles readable and fast to iterate under time constraints.

IF I HAD MORE TIME
• Server-side validation and typed schema (Zod or express-validator), timestamps
• Minimal authentication (JWT/magic-link) and a way to list/edit prior responses
• Tests: API (Supertest) and components (React Testing Library)
• CI and deploy: e.g., Vercel for client, Render/Fly.io for the API
• Accessibility: enhanced ARIA and keyboard focus management between steps

NOTES FOR REVIEWERS (VIDEO)
• The recording covers decisions, trade-offs, and a short “what I’d do next.”
• Demo highlights:
– Age 0 is blocked with a clear inline error
– Gender “Other” prompts a required free-text field
– Bio counter (non-space) with a hard 500-character cap
– Refresh mid-survey restores autosaved draft
– Submit flows to the Thank You / Review with the saved JSON
