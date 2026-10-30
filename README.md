# OdiPrep

Free mock-test and PYQ platform for Odisha govt exams.

## Folder structure

```
odiprep/
├── client/                  # React (Vite) + Tailwind — next step
└── server/
    ├── server.js            # entry: load env, connect DB, start app
    ├── .env.example
    └── src/
        ├── app.js           # express app, middleware, routes
        ├── config/          # db.js, cloudinary.js
        ├── models/          # Mongoose schemas (below)
        ├── routes/          # URL -> controller
        ├── controllers/     # req/res handling
        ├── services/        # business logic (scoring, streaks, rank)
        ├── middlewares/     # auth, isAdmin, upload, validate
        ├── validators/      # request body validation
        └── utils/           # helpers (IST date, excel parser)
```

## Collections

| Model | What it stores |
|---|---|
| User | student/admin, language, target exam, streak |
| Exam | OSSSC RI, OSSC CGL, OTET… + default marking |
| Subject | Odisha GK, Reasoning, Arithmetic, English |
| Topic | sub-topic of a subject (for weak topics) |
| Question | bilingual question, options, answer, explanation, draft/published |
| Test | a PYQ paper / mock / daily quiz, with sections of questions |
| Attempt | one student's attempt: answers, server timer, result, rank |
| DailyActivity | one row per active day → streak heatmap |
| TopicStat | per-student accuracy per topic → weak topics, subject bars |
| Bookmark | saved questions |
| Mistake | wrong answers → mistake notebook |

## Relations

```
Exam 1─* Test 1─* Section *─* Question *─1 Subject 1─* Topic
User 1─* Attempt *─1 Test
User 1─* DailyActivity | TopicStat | Bookmark | Mistake
```

## Key rules
- Timer is server-side (`Attempt.endsAt`), so refresh can't reset it.
- `correctOption` is never sent to the client until the test is submitted.
- Only `status: "published"` questions appear to students.
- Dates for streaks are stored as `YYYY-MM-DD` in IST.

## Run
```
cd server
cp .env.example .env   # add your Atlas URI
npm install
npm run dev
```

## Tests
```
cd server
npm test   # runs on an in-memory MongoDB (downloads it on first run)
```

## Git workflow
- `main` → live (production) code only
- `dev` → working branch; features merge here first
- `feature/<name>` → one branch per feature, e.g. `feature/auth`
- Merge via Pull Request: feature → dev → main

## Frontend (client)
```
cd client
npm install
npm run dev      # http://localhost:5173 — /api calls go to the server on :5050
npm run build    # production build in client/dist
```
Production: set `VITE_API_URL` to the deployed API (e.g. `https://odiprep-api.onrender.com/api`).
