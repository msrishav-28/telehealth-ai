
# TeleHealth AI

**TeleHealth AI** is an AI-powered virtual care platform offering personalized medical guidance through specialized digital assistants. It leverages real-time, evidence-based information using Perplexity’s Sonar API to deliver medically sound responses.

---

## Key Features

* **Multi-Persona AI Assistants**
  Five specialized medical personas, including Psychiatrist, Allergist, Geriatrician, Dermatologist, and Psychologist.

* **Citation-Based Medical Information**
  Responses are enriched with credible citations from trusted sources using the Perplexity Sonar API.

* **Smart Symptom Navigation**
  An interactive decision flow routes users to the most relevant AI expert.

* **Medication Interaction Checker**
  Analyze potential interactions between multiple prescribed or over-the-counter drugs.

* **Conversation Analytics Dashboard**
  Monitor user trends, popular topics, and overall usage metrics in a visual format.

* **Voice-Enabled Interaction**
  Users can ask health questions using natural speech.

* **PDF Chat Export**
  Users can download their full conversation history for personal records.

* **Dark Mode Support**
  A visually accessible interface with light/dark themes and smooth animation transitions.

---

## Tech Stack

* **Frontend**: Next.js 14 (App Router), React 18, TypeScript
* **Styling**: Tailwind CSS, shadcn/ui, Framer Motion
* **Backend**: tRPC, Prisma, PostgreSQL
* **AI Services**: Google Gemini Pro, Perplexity Sonar API
* **Authentication**: Clerk
* **Caching**: Redis via Upstash
* **Deployment**: Vercel

---

## Prerequisites

* Node.js 18 or higher
* PostgreSQL database
* Redis instance (optional; recommended via Upstash)
* API keys for:

  * Perplexity
  * Google Gemini
  * Clerk
  * Redis (optional)

---

## Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/telehealth-ai.git
   cd telehealth-ai
   ```

2. **Install Dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Configure Environment Variables**

   ```bash
   cp .env.example .env.local
   ```

   Update `.env.local` with your keys:

   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/telehealth"
   PERPLEXITY_API_KEY="your-perplexity-api-key"
   GEMINI_API_KEY="your-gemini-api-key"
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
   CLERK_SECRET_KEY="your-clerk-secret-key"
   UPSTASH_REDIS_REST_URL="your-upstash-url"
   UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
   ```

4. **Initialize the Database**

   ```bash
   npx prisma generate
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Run the Development Server**

   ```bash
   npm run dev
   ```

   The application will be available at [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
telehealth-ai/
├── src/
│   ├── app/                    # Next.js App Router structure
│   ├── components/             # UI and feature components
│   │   ├── chat/
│   │   ├── analytics/
│   │   ├── animations/
│   │   └── ui/
│   ├── lib/                    # Utility libraries and configs
│   │   ├── personas/
│   │   ├── safety/
│   │   └── api/
│   ├── server/                 # tRPC routes and backend logic
│   └── types/                  # TypeScript types and interfaces
├── prisma/                     # Prisma schema and seed scripts
├── public/                     # Static assets
└── tests/                      # Unit and E2E tests
```

---

## Usage Guide

1. Register or log in using email or a connected identity provider.
2. Start with the symptom checker or directly choose a specialist.
3. Ask health-related questions via text or voice input.
4. Review responses with source citations for validation.
5. Export chat transcripts as PDF documents for later reference.

---

## Testing

```bash
npm run test          # Unit tests
npm run test:watch    # Watch mode
npm run test:e2e      # End-to-end tests
```

---

## Deployment

### Vercel (Recommended)

1. Push your repository to GitHub.
2. Import into Vercel.
3. Add environment variables in the Vercel dashboard.
4. Deploy automatically.

### Manual

```bash
npm run build
npm start
```

---

## Security and Compliance

* **Data Encryption**: Secures all data in transit and at rest.
* **PII Filtering**: Built-in sanitization to prevent storage of identifiable user information.
* **Audit Logging**: Tracks usage and behavior for security monitoring.
* **HIPAA Readiness**: While not production-certified, the architecture allows for HIPAA-aligned workflows.
* **Rate Limiting**: Guards against abuse and malicious usage patterns.

---

## Safety Protocols

* **Emergency Detection**: Triggers alerts upon detecting critical symptoms or phrases.
* **Red Flag Monitoring**: Real-time keyword-based health risk analysis.
* **Medical Disclaimers**: Clear advisories across the platform emphasizing informational use.
* **Professional Referral Guidance**: Prompts users to consult licensed healthcare professionals.

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push the branch and submit a Pull Request

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

---

## Acknowledgments

* Perplexity AI for access to the Sonar API
* Google AI Studio for Gemini Pro access
* Clerk for authentication tools
* Vercel for deployment infrastructure
* shadcn/ui for robust UI components

---

## Disclaimer

This platform is intended for informational and educational use only. It does not constitute medical advice, diagnosis, or treatment. Please consult a licensed medical professional for health-related concerns.

