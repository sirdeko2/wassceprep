# Legacy Tech WASSCEPrep — Full Setup Guide

## Overview
This is a React + Supabase web app for WASSCE exam preparation in Liberia.
Stack: React 18, Vite, React Router, Supabase (auth + database), Claude AI API, Vercel (hosting).

---

## STEP 1 — Get the project on your computer

Open your terminal (VS Code terminal is fine) and run:

```bash
# Clone your GitHub repo (replace with your actual repo URL)
git clone https://github.com/YOUR_USERNAME/legacy-tech-wassce-prep.git
cd legacy-tech-wassce-prep

# Copy all scaffold files into this folder
# (move the contents of wassce-prep-scaffold/ here)

# Install dependencies
npm install

# Test that it runs
npm run dev
```

Open http://localhost:5173 in your browser. You should see the app.

---

## STEP 2 — Create your Supabase project (free)

1. Go to https://supabase.com and sign up for a free account
2. Click **New Project**
3. Fill in:
   - Project name: `legacy-tech-wassce-prep`
   - Database password: choose a strong password and SAVE IT
   - Region: choose closest to Liberia (EU West or US East)
4. Wait 2 minutes for the project to be created

### Run the database schema

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Open the file `supabase/migrations/001_initial_schema.sql` from this project
4. Copy the entire contents and paste into the SQL editor
5. Click **Run**
6. You should see "Success. No rows returned" — that means it worked

### Get your API keys

1. In Supabase dashboard, go to **Project Settings** (gear icon) > **API**
2. Copy:
   - **Project URL** (looks like: https://abcdefgh.supabase.co)
   - **anon / public key** (long string starting with eyJ...)

---

## STEP 3 — Create your .env file

In your project root folder, create a file called `.env` (NOT `.env.example`):

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### Get your Anthropic API key

1. Go to https://console.anthropic.com
2. Sign up or log in
3. Go to **API Keys** > **Create Key**
4. Copy the key and paste it into your .env file
5. Add $5 credit to start (this will last a very long time for a small app)

**IMPORTANT: Never commit your .env file to GitHub.**
The `.gitignore` file already excludes it, but double-check before pushing.

---

## STEP 4 — Run the app locally

```bash
npm run dev
```

Test the following:
- [ ] Landing page loads
- [ ] Register creates a new account (check Supabase > Authentication > Users)
- [ ] Login works and redirects to dashboard
- [ ] Subject select shows all 8 subjects
- [ ] Quiz loads questions and timer works
- [ ] AI Tutor sends messages and gets responses
- [ ] Completing a quiz saves to Supabase (check Table Editor > quiz_sessions)
- [ ] Progress page shows your scores

---

## STEP 5 — Deploy to Vercel (free hosting)

1. Push your code to GitHub:
```bash
git add .
git commit -m "Initial WASSCEPrep deployment"
git push origin main
```

2. Go to https://vercel.com and sign in with GitHub
3. Click **Add New Project**
4. Select your `legacy-tech-wassce-prep` repo
5. Vercel will auto-detect it is a Vite project
6. Before clicking Deploy, click **Environment Variables** and add:
   - `VITE_SUPABASE_URL` = your supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
   - `VITE_ANTHROPIC_API_KEY` = your Claude API key
7. Click **Deploy**
8. In about 60 seconds, your app will be live at `your-project.vercel.app`

---

## STEP 6 — Connect your custom domain

1. Buy a domain (e.g. `legacytechprep.com`) at https://namecheap.com (~$10/year)
2. In Vercel dashboard > your project > **Settings** > **Domains**
3. Add your domain and follow the DNS instructions
4. Done — your site is live at your own domain

---

## STEP 7 — Add more questions to the database

### Option A: Via Supabase Dashboard (easiest)
1. Go to Supabase > **Table Editor** > `questions`
2. Click **Insert Row**
3. Fill in all fields
4. The `options` field must be valid JSON: `["Option A", "Option B", "Option C", "Option D"]`
5. `correct_answer_index` is 0-based (0=A, 1=B, 2=C, 3=D)

### Option B: Via SQL (faster for bulk)
Open SQL Editor and run INSERT statements following the pattern in `001_initial_schema.sql`

### Option C: Build an admin panel (Phase 2)
A protected admin page where you or teachers can add questions via a form.
This is recommended once you have 3+ people adding content.

---

## Project Structure

```
src/
  components/
    layout/
      Navbar.jsx          ← Top navigation bar
    quiz/                 ← Quiz-specific components (future)
    dashboard/            ← Dashboard widgets (future)
  context/
    AuthContext.jsx       ← Global auth state (user, login, logout)
  data/
    subjects.js           ← Subject list and WAEC grading scale
  hooks/
    useData.js            ← Supabase data hooks (questions, progress, saveSession)
  lib/
    supabase.js           ← Supabase client setup
  pages/
    LandingPage.jsx       ← Homepage
    LoginPage.jsx         ← Login form
    RegisterPage.jsx      ← Registration form
    DashboardPage.jsx     ← Student dashboard
    SubjectsPage.jsx      ← Subject + mode selection
    QuizPage.jsx          ← Full quiz engine
    TutorPage.jsx         ← AI tutor chat
    ProgressPage.jsx      ← Progress tracking
    NotFoundPage.jsx      ← 404 page
supabase/
  migrations/
    001_initial_schema.sql  ← Full database schema + sample questions
.env.example              ← Template for environment variables
```

---

## Database Tables

| Table | Purpose |
|---|---|
| `profiles` | Student info (name, county, streak) |
| `questions` | All WASSCE practice questions |
| `quiz_sessions` | Every completed quiz result |
| `chat_history` | AI tutor conversation history |

---

## Common Issues

**App shows blank page**
- Check browser console for errors
- Make sure .env file exists and has correct values
- Restart dev server after changing .env

**"Missing Supabase environment variables" error**
- Your .env file is missing or has wrong variable names
- Variable names must start with VITE_ to work with Vite

**Questions not loading**
- Check Supabase > Table Editor > questions — are there rows?
- Run the SQL migration again if the table is empty
- Check RLS policies are enabled correctly

**AI Tutor not responding**
- Check your Anthropic API key in .env
- Check you have credit at console.anthropic.com
- Check browser console for the actual error message

**Login not working**
- Go to Supabase > Authentication > Providers > make sure Email is enabled
- Check Supabase > Authentication > Users to see if the user was created

---

## Next Features to Build (Phase 2)

- [ ] Admin panel for uploading questions
- [ ] Email password reset
- [ ] Offline mode (PWA / service worker)
- [ ] Leaderboard by county
- [ ] Study notes PDF uploads per subject
- [ ] Teacher/school dashboard
- [ ] Push notifications for study reminders
- [ ] Mobile app (React Native using same Supabase backend)

---

## Cost Summary

| Service | Cost |
|---|---|
| Vercel hosting | Free |
| Supabase (up to 50,000 users) | Free |
| Claude API (AI Tutor) | ~$5-20/month depending on usage |
| Domain name | ~$10-15/year |
| **Total to launch** | **~$15 one-time + ~$10/month** |

---

Built with love for Liberian students.
Legacy Tech WASSCEPrep — Free WASSCE prep for every Liberian student. 🇱🇷
