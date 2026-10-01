# NexusCore Career & Hackathon Platform

A next-generation career progression, skills assessment, and hackathon development portal engineered with semantic **HTML5**, modern **Vanilla CSS**, modular **JavaScript**, and a route-guarded **REST API** with PostgreSQL schema mapping.

---

## 🏛️ System Architecture

```text
+--------------------------------------------------+
| FRONTEND (React / Next.js / Vanilla ES6)         |
|  Login | Profile | Assessment | Roadmap          |
+--------------------------------------------------+
                      |  HTTPS + JWT cookie
                      v
+--------------------------------------------------+
| REST API (route guard on every endpoint)         |
|  Auth API | Profile API | Assessment API |       |
|  Roadmap API                                     |
+--------------------------------------------------+
                      |
                      v
+--------------------------------------------------+
| BACKEND SERVICES                                 |
|  Auth & sessions | Scoring engine |              |
|  Roadmap generator                               |
+--------------------------------------------------+
                      |
                      v
+--------------------------------------------------+
| DATA (PostgreSQL)                                |
|  Users & profiles | Assessment results |         |
|  Careers & skills catalog                        |
+--------------------------------------------------+
```

### PostgreSQL Schema Mappings

- `users` (`id`, `email`, `password_hash`, `created_at`)
- `profiles` (`user_id`, `education`, `skills[]`, `interests[]`, `target_role`)
- `assessments` (`id`, `user_id`, `answers_json`, `scores_json`, `created_at`)
- `careers` (`id`, `title`, `description`)
- `skills` (`id`, `name`, `category`)
- `career_skills` (`career_id`, `skill_id`, `importance`)
- `roadmaps` (`id`, `user_id`, `assessment_id`, `created_at`)
- `roadmap_steps` (`id`, `roadmap_id`, `title`, `order`, `resource_url`, `status`)

---

## ✨ Features & 1-Click Universal Menu Bar

The web application is equipped with a persistent **Glassmorphic Universal Menu Bar** at the top of the viewport, enabling instant single-click access to all platform features:

1. **🔐 Login / Auth View**:
   - Animated tab slider between **Sign In** and **Create Account**.
   - Real-time password strength meter and toggle visibility.
   - Fast 1-click **Demo Auto-Fill** (`alex.developer@hackathon.dev`).
   - 1-click **OAuth sign-in** for Google, GitHub, and Apple.
   - Interactive **Password Reset** modal dialog.

2. **👤 Profile & Workspace View**:
   - **Target Role & Education** mapping directly to `profiles` table.
   - **Skills Inventory (`skills[]`)** and **Interested Domains (`domains[]`)** interactive tag clouds.
   - **Interested Domain & Assessment Metrics**:
     - *Active Interested Domain Card*: Shows chosen track (e.g. `🤖 AI & Autonomous Agents`) with direct link to domain assessment.
     - *Reference Study Articles Card*: Shows 2 study guides available with quick study link.
     - *Assessment Proficiency Score*: Real-time verified competency score.
   - **Edit Profile Modal** allowing instant updates to education, target role, bio, and skill tags.
   - **Active Submissions** tracker with progress bars and "Submit Project" modal.
   - **Squad Teammates** panel with status indicators and 1-click shareable invite link generator.
   - **Developer API Token Box** with 1-click clipboard copy.

3. **📝 Assessment & Curated Reference Articles Engine**:
   - **Interested Domain Selector**: Choose between 5 industry domains (*AI & Autonomous Agents*, *Cloud & DevOps*, *Full-Stack Web*, *Cybersecurity & ZK*, *Data Engineering*).
   - **📚 Step 1: Study Reference Articles**: Each domain provides **two comprehensive reference study articles** with key architectural takeaways, code patterns, and an in-app reading guide so users can thoroughly study the topics.
   - **✍️ Step 2: Attend Domain Assessment**: Curated multiple-choice questions tailored to the selected domain.
   - **Real-Time Evaluation**: Direct evaluation against the SQLite database, returning percentage score, pass/fail status, question explanations, and domain roadmap synchronization.

4. **🗺️ Career Progression Roadmap View**:
   - Sequenced milestone timeline matching `roadmap_steps` (`order`, `title`, `resource_url`, `status`).
   - Interactive status button on each step (`Completed ✓`, `In Progress ⏳`, `Pending`) that cycles on click and updates the overall progress bar.
   - Direct documentation links for each technology.
   - 1-click **Regenerate Roadmap** and **Share & Export** capabilities.

5. **⚡ "All Features" Dropdown Menu**:
   - A drop-down menu situated in the menu bar providing 1-click execution for all 15+ functions on the platform.

---

## 🚀 How to Run Locally

### Local Server
The project is hosted locally via Node.js on port 3000:

```powershell
node server.js
```
Then visit **`http://localhost:3000`** in your browser.

### Backend Python / FastAPI Architecture
The `backend/` folder provides the production-ready FastAPI service matching the architecture:
- `backend/app/main.py`: Application entry point with CORS and route handlers.
- `backend/app/core/config.py`: Configuration and environment settings.
- `backend/app/models/entities.py`: SQLAlchemy ORM models matching the exact PostgreSQL schema.
- `backend/app/schemas/schemas.py`: Pydantic validation schemas.
- `backend/app/services/`: Authentication, scoring engine, and roadmap generator services.
- `backend/app/api/v1/`: Auth, profile, assessment, and roadmap endpoints.

---

## 📁 File Structure

```text
internal hackathon/
├── index.html                 # Universal menu bar, views (Login, Profile, Assessment, Roadmap) & modals
├── style.css                  # Design tokens, glassmorphism, responsive navigation & keyframes
├── app.js                     # 1-click menu router, reactive state, scoring engine & roadmap controller
├── server.js                  # Local server & REST API endpoints (/api/v1/...)
├── README.md                  # Architecture, schema specification & documentation
└── backend/                   # FastAPI backend architecture
    ├── requirements.txt       # Dependencies (FastAPI, SQLAlchemy, Pydantic, etc.)
    ├── .env.example           # Environment template
    └── app/
        ├── main.py            # FastAPI app
        ├── core/config.py     # Application settings
        ├── models/entities.py # SQLAlchemy PostgreSQL models
        ├── schemas/schemas.py # Pydantic schemas
        ├── services/          # Auth, scoring engine & roadmap generator
        └── api/v1/            # Auth, profile, assessment & roadmap routes
```
