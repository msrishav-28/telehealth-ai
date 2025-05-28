# TeleHealth AI 🏥

An AI-powered telehealth platform providing personalized medical guidance from specialized AI personas, powered by Perplexity's Sonar API for evidence-based information.

![TeleHealth AI Banner](./public/banner.png)

## 🏆 Hackathon-Winning Features

- **🤖 Multi-Persona AI System**: 5 specialized medical AI assistants (Psychiatrist, Allergist, Geriatrician, Dermatologist, Psychologist)
- **📚 Citation-Rich Responses**: All medical information backed by trusted sources via Perplexity Sonar API
- **🎯 Smart Symptom Checker**: Interactive flow to route users to the right specialist
- **💊 Drug Interaction Checker**: Check interactions between multiple medications
- **📊 Analytics Dashboard**: Track conversations, popular topics, and usage patterns
- **🎙️ Voice Input**: Speak your health questions naturally
- **📄 Export Conversations**: Download chat history as PDF for your records
- **🌓 Dark Mode**: Eye-friendly interface for late-night health concerns
- **✨ Beautiful Animations**: Smooth, modern UI with Framer Motion

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: tRPC, Prisma, PostgreSQL
- **AI**: Google Gemini Pro (Free!), Perplexity Sonar API
- **Auth**: Clerk
- **Caching**: Redis (Upstash)
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis instance (or Upstash Redis)
- API Keys:
  - Perplexity API key
  - Google Gemini API key (Free tier available!)
  - Clerk keys
  - Upstash Redis credentials (optional)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/telehealth-ai.git
   cd telehealth-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Fill in your API keys and database credentials in `.env.local`:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/telehealth"
   
   # Perplexity API
   PERPLEXITY_API_KEY="your-perplexity-api-key"
   
   # Google Gemini API (Free tier!)
   GEMINI_API_KEY="your-gemini-api-key"
   
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
   CLERK_SECRET_KEY="your-clerk-secret-key"
   
   # Redis (optional - for caching)
   UPSTASH_REDIS_REST_URL="your-upstash-url"
   UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate dev
   
   # Seed the database (optional)
   npx prisma db seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🏗️ Project Structure

```
telehealth-ai/
├── src/
│   ├── app/                    # Next.js app router pages
│   ├── components/             # React components
│   │   ├── chat/              # Chat-related components
│   │   ├── analytics/         # Analytics components
│   │   ├── animations/        # Animation components
│   │   └── ui/               # shadcn/ui components
│   ├── lib/                   # Utility functions
│   │   ├── personas/         # AI persona configurations
│   │   ├── safety/          # Safety and moderation
│   │   └── api/            # API integrations
│   ├── server/               # Backend code
│   │   ├── api/            # tRPC routers
│   │   └── services/       # Business logic
│   └── types/               # TypeScript types
├── prisma/                  # Database schema
├── public/                  # Static assets
└── tests/                   # Test files
```

## 🎮 Usage

1. **Sign Up/Login**: Create an account using email or social login
2. **Symptom Checker**: Start with the symptom checker or skip directly to chat
3. **Choose Specialist**: Select the appropriate AI specialist for your concern
4. **Ask Questions**: Type or speak your health questions
5. **View Citations**: Click on citations to see source information
6. **Export Chat**: Download your conversation as PDF for your records

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e
```

## 📦 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy!

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🔒 Security & Compliance

- **HIPAA Considerations**: This is a demonstration project. For production use, ensure HIPAA compliance
- **Data Encryption**: All conversations are encrypted in transit and at rest
- **PII Protection**: Automatic filtering of personally identifiable information
- **Audit Logging**: All interactions are logged for security monitoring
- **Rate Limiting**: Protection against abuse and excessive usage

## 🚨 Safety Features

- **Emergency Detection**: Automatic detection of emergency keywords with immediate alerts
- **Red Flag Monitoring**: Real-time monitoring for concerning symptoms
- **Disclaimers**: Clear medical disclaimers throughout the platform
- **Professional Referral**: Always encourages consulting real healthcare providers

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Perplexity AI](https://perplexity.ai) for their amazing Sonar API
- [Google AI Studio](https://makersuite.google.com) for Gemini API
- [Clerk](https://clerk.dev) for authentication
- [Vercel](https://vercel.com) for hosting
- [shadcn/ui](https://ui.shadcn.com) for beautiful components

## 📞 Support

For support, email support@telehealthai.com or join our Discord server.

## ⚠️ Medical Disclaimer

This platform is for educational and informational purposes only. It does not provide medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.

---

Built with ❤️ for the hackathon by [Your Team Name]