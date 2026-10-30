# OdiPrep API (v1)

Base URL: `/api` · Auth: `Authorization: Bearer <JWT>`
🔓 public · 👤 logged-in student · 🛡️ admin only

All responses: `{ success, data, message }`. Lists support `?page=1&limit=20`.

---

## 1. Auth — `/api/auth`
| Method | Endpoint | Access | Body / Notes |
|---|---|---|---|
| POST | `/register` | 🔓 | `{ name, email, password }` → `{ user, token }` |
| POST | `/login` | 🔓 | `{ email, password }` → `{ user, token }` |
| POST | `/google` | 🔓 | `{ idToken }` → verify with Google, create/login user |
| GET | `/me` | 👤 | current user |
| POST | `/forgot-password` | 🔓 | `{ email }` → reset link by email |
| POST | `/reset-password` | 🔓 | `{ token, password }` |

## 2. Profile — `/api/users`
| Method | Endpoint | Access | Body / Notes |
|---|---|---|---|
| PATCH | `/me` | 👤 | `{ name, preferredLanguage, targetExam, targetExamDate }` |
| PATCH | `/me/password` | 👤 | `{ oldPassword, newPassword }` |

## 3. Exams & content — `/api/exams`
| Method | Endpoint | Access | Notes |
|---|---|---|---|
| GET | `/` | 🔓 | all active exams (home page cards) |
| GET | `/:slug` | 🔓 | exam details + subjects |
| GET | `/:slug/tests?type=pyq` | 🔓 | papers in sequence (`type`: pyq / mock / daily_quiz); adds `myStatus` if logged in |

## 4. Tests — `/api/tests`
| Method | Endpoint | Access | Notes |
|---|---|---|---|
| GET | `/:slug` | 🔓 | test info: duration, marking, sections, question count (no questions) |
| GET | `/daily-quiz/today` | 👤 | today's quiz |

## 5. Attempts (mock test engine) — `/api/attempts`
| Method | Endpoint | Access | Body / Notes |
|---|---|---|---|
| POST | `/` | 👤 | `{ testId }` → start, or resume existing `in_progress` attempt. Returns questions **without answers** + `endsAt` |
| GET | `/:id` | 👤 | resume: questions, saved answers, `lastQuestionIndex`, time left |
| PATCH | `/:id/answer` | 👤 | `{ questionId, selectedOption, markedForReview, timeSpentSec }` — autosave each answer |
| POST | `/:id/warning` | 👤 | `{ kind: "tab_switch" \| "fullscreen_exit" }` |
| POST | `/:id/submit` | 👤 | score with negative marking, update TopicStat, Mistake, DailyActivity, streak |
| GET | `/:id/result` | 👤 | score, rank, accuracy, section-wise, time taken |
| GET | `/:id/review` | 👤 | every question with my answer, correct answer, explanation |
| GET | `/` | 👤 | my attempt history |

> Server rejects answers after `endsAt`; an unfinished attempt is auto-submitted when opened after time is up.

## 6. Dashboard — `/api/dashboard`
| Method | Endpoint | Access | Notes |
|---|---|---|---|
| GET | `/summary` | 👤 | tests taken, avg score, accuracy, best rank, streak, continue-last-paper |
| GET | `/score-trend?limit=8` | 👤 | last N scores (line chart) |
| GET | `/subject-accuracy` | 👤 | per subject % (bar chart) |
| GET | `/weak-topics?limit=3` | 👤 | lowest-accuracy topics (min 10 attempted) |
| GET | `/streak-calendar?days=84` | 👤 | DailyActivity rows (heatmap) |
| GET | `/pyq-progress?exam=slug` | 👤 | each paper: done / in progress / not started |

## 7. Bookmarks & mistakes — `/api/bookmarks`, `/api/mistakes`
| Method | Endpoint | Access | Notes |
|---|---|---|---|
| GET | `/bookmarks` | 👤 | my bookmarks |
| POST | `/bookmarks` | 👤 | `{ questionId, note }` |
| DELETE | `/bookmarks/:questionId` | 👤 | remove |
| GET | `/mistakes?resolved=false` | 👤 | mistake notebook |
| PATCH | `/mistakes/:id` | 👤 | `{ resolved: true }` |
| POST | `/mistakes/practice` | 👤 | creates a practice set from unresolved mistakes |

## 8. Leaderboard — `/api/leaderboard`
| Method | Endpoint | Access | Notes |
|---|---|---|---|
| GET | `/test/:testId` | 🔓 | top 50 for a test + my rank |

---

## 9. Admin — `/api/admin` 🛡️
**Questions**
| Method | Endpoint | Notes |
|---|---|---|
| GET | `/questions?exam=&subject=&status=&search=` | filter + paginate |
| POST | `/questions` | add one |
| PATCH | `/questions/:id` | edit (fix answer key) |
| DELETE | `/questions/:id` | archive |
| POST | `/questions/upload` | Excel/CSV (multer) → saved as `draft`, returns `uploadBatch` + row errors |
| POST | `/questions/publish` | `{ ids }` or `{ uploadBatch }` → published |
| GET | `/questions/template` | download Excel template |

**Exams / subjects / topics**
| Method | Endpoint | Notes |
|---|---|---|
| POST · PATCH | `/exams`, `/exams/:id` | create / edit |
| POST · PATCH | `/subjects`, `/topics` | create / edit |

**Tests**
| Method | Endpoint | Notes |
|---|---|---|
| POST | `/tests` | create with sections + question ids |
| POST | `/tests/auto-generate` | `{ exam, sections:[{subject, count}] }` random pick |
| PATCH | `/tests/:id` | edit |
| POST | `/tests/:id/publish` | publish / unpublish |

**Stats**
| Method | Endpoint | Notes |
|---|---|---|
| GET | `/stats` | total users, attempts today, popular tests |

---

## Middlewares
`auth` (verify JWT) · `isAdmin` · `validate(schema)` · `upload` (multer, 5 MB, xlsx/csv) · `rateLimit` on auth routes

## Status codes
200 ok · 201 created · 400 bad input · 401 not logged in · 403 not allowed · 404 not found · 409 duplicate · 410 test time over · 500 server error
