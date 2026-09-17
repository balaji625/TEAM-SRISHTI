# 🏥 CarePath AI

<div align="center">

### AI-Powered Healthcare Access Ecosystem

Connecting Patients, Verified Hospitals, Healthcare Professionals, Independent Experts, and AI-Powered Healthcare Guidance in One Unified Platform.

![React](https://img.shields.io/badge/Frontend-React-blue)
![Node.js](https://img.shields.io/badge/Backend-Node.js-green)
![Express](https://img.shields.io/badge/API-Express-black)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-brightgreen)
![JWT](https://img.shields.io/badge/Auth-JWT-orange)
![AI](https://img.shields.io/badge/AI-Enabled-purple)
![RAG](https://img.shields.io/badge/RAG-Architecture-red)

</div>

---

# 🚀 Problem Statement

Healthcare access remains fragmented, making it difficult for patients to:

- Find the right hospitals and specialists
- Understand medical reports
- Manage healthcare records
- Access trusted healthcare information
- Seek expert opinions
- Navigate healthcare services efficiently

This often leads to delayed decisions, confusion, and poor healthcare experiences.

---

# 💡 Solution

CarePath AI is an intelligent healthcare ecosystem that combines AI-powered assistance with verified healthcare networks.

```text
Patients
    ↓
AI Healthcare Assistant
    ↓
Healthcare Guidance
    ↓
Verified Hospitals
    ↓
Healthcare Professionals
    ↓
Independent Experts
```

The platform helps users make informed healthcare decisions while maintaining privacy, trust, and security.

---

# ✨ Key Features

## 👤 Patient Portal

- Personalized Dashboard
- AI Healthcare Assistant
- Hospital Discovery
- Doctor Discovery
- Appointment Booking
- Medical Report Upload
- Health Record Management
- Healthcare History Tracking
- Expert Consultation Requests

---

## 🏥 Hospital Portal

- Hospital Profile Management
- Doctor Management
- Appointment Handling
- Patient Request Management
- Analytics Dashboard

---

## 👨‍⚕️ Professional Portal

- Professional Profile Management
- Credential Management
- Availability Scheduling
- Consultation Handling
- Hospital Association Requests

---

## 🧠 Expert Portal

- Expert Profile Management
- Escalated Consultation Handling
- Advanced Healthcare Support
- Availability Management

---

## 🛡️ Admin Portal

- User Management
- Hospital Verification
- Professional Verification
- Expert Verification
- Platform Monitoring
- Audit Review
- Analytics Dashboard

---

# 🤖 AI Intelligence Layer

CarePath AI includes a provider-independent AI architecture designed for healthcare guidance and assistance.

## AI Workflow

```text
User Query
      ↓
Intent Detection
      ↓
AI Orchestrator
      ↓
Specialized Agent
      ↓
Knowledge Retrieval
      ↓
Response Generation
      ↓
Safety Validation
      ↓
Final Response
```

## Specialized Agents

- Healthcare Information Agent
- Hospital Recommendation Agent
- Report Understanding Agent
- Preventive Care Agent
- Triage Assistance Agent

---

# 📚 Retrieval-Augmented Generation (RAG)

To improve reliability and reduce AI hallucinations, CarePath AI utilizes a Retrieval-Augmented Generation architecture.

```text
Trusted Healthcare Sources
           ↓
Document Processing
           ↓
Embeddings
           ↓
Vector Database
           ↓
Retriever
           ↓
LLM
           ↓
Safety Validation
           ↓
Response
```

### Benefits

- Context-aware responses
- Reduced misinformation
- Improved healthcare relevance
- Expandable knowledge base
- Provider-independent architecture

---

# 🔐 Security & Privacy

Healthcare data requires enterprise-grade protection.

CarePath AI implements:

- JWT Authentication
- Refresh Token Strategy
- Role-Based Access Control (RBAC)
- Password Hashing (bcrypt)
- Input Validation
- Rate Limiting
- CORS Protection
- Audit Logging
- Consent Management
- Secure Environment Variables

---

# 👥 User Roles

| Role | Description |
|--------|------------|
| USER | Patient seeking healthcare support |
| HOSPITAL | Hospital administrators |
| PROFESSIONAL | Doctors and healthcare professionals |
| EXPERT | Independent healthcare experts |
| ADMIN | Platform administrators |

Server-side RBAC ensures secure access control across all protected APIs.

---

# 🏗️ Technology Stack

## Frontend

- React.js
- Vite
- Tailwind CSS
- React Router
- Axios

## Backend

- Node.js
- Express.js

## Database

- MongoDB
- Mongoose

## Authentication

- JWT Authentication
- Refresh Tokens

## AI Layer

- Provider-Independent AI Service
- Retrieval-Augmented Generation (RAG)

---

# 📂 Project Structure

```text
CarePath-AI/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── tests/
│   ├── seed/
│   └── utils/
│
├── README.md
├── IBM_BOB_USAGE.md
└── .env.example
```

---

# ⚙️ Environment Variables

Create a `.env` file inside the server directory.

```env
PORT=5000
NODE_ENV=development

CLIENT_URL=http://localhost:5173

```

> Never commit real credentials or secrets to GitHub.

---

# 🚀 Installation

### Prerequisites

- Node.js v18+
- MongoDB Atlas or Local MongoDB

### Install Dependencies

```bash
npm run install:all
```

Or manually:

```bash
cd server && npm install
cd ../client && npm install
```

---

# ▶️ Running the Application

### Start Backend

```bash
npm run server
```

or

```bash
cd server && npm run dev
```

### Start Frontend

```bash
npm run dev
```

or

```bash
cd client && npm run dev
```

---

# 🌐 API Health Check

```http
GET /api/health
```

Response:

```json
{
  "success": true,
  "message": "CarePath AI API is running",
  "environment": "development"
}
```

---

# 📈 Development Roadmap

| Stage | Status |
|---------|---------|
| Project Foundation | ✅ |
| MongoDB Models | ✅ |
| Authentication & RBAC | ✅ |
| User Dashboard | ✅ |
| Hospital Management | ✅ |
| Professional Management | ✅ |
| Expert Management | ✅ |
| Appointments & Requests | ✅ |
| Health Records & Reports | ✅ |
| AI Assistant | ✅ |
| Notifications | ✅ |
| Analytics | ✅ |
| Security & Audit Logs | ✅ |
| Testing & QA | ✅ |

---

# 🏆 IBM Hackathon

This project was developed with assistance from **IBM Bob** as an AI-powered development assistant.

IBM Bob supported:

- Architecture Planning
- Frontend Development
- Backend Development
- Database Design
- Security Review
- AI Workflow Design
- Debugging
- Documentation

For detailed information, see:

📄 **IBM_BOB_USAGE.md**

---

# 🌟 Vision

To build an intelligent healthcare ecosystem that helps people navigate healthcare services efficiently while maintaining trust, privacy, accessibility, and safety.

By combining AI-powered assistance with verified healthcare networks, CarePath AI aims to make healthcare guidance more accessible, reliable, and user-centric.

---

# 📜 License

MIT License

---

<div align="center">

### Built for Better Healthcare Accessibility ❤️

**CarePath AI • IBM Hackathon Project**

</div>
