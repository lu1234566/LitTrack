# Readora

**Readora** is a premium, polished literary journal and reading tracker in the cloud. Designed for bibliophiles who value elegance and organization, Readora provides a sophisticated environment to log your reading journey, analyze your habits, and connect with a community of readers.

## ✨ Features

- **Personal Library**: Keep track of books read, currently reading, and your wishlist.
- **Literary Journal**: Log your thoughts, ratings, and progress for every book.
- **Dynamic Insights**: Visualize your reading habits with monthly and annual statistics.
- **Cloud Sync**: Powered by Firebase for real-time synchronization across devices.
- **Reading Challenges**: Join community challenges and earn unique badges.
- **Export & Backup**: Your data is yours. Export your library to JSON or PDF reports at any time.
- **Premium Design**: A luxury dark-mode aesthetic designed for comfort and focus.

## 🛠ï¸Ž Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Backend/Database**: Firebase (Firestore & Auth)
- **Visualization**: Recharts

## 🚀 Environment Variables

To run this project locally or deploy it, you need to configure the following environment variables in a `.env` file:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_ID=(optional)_custom_db_id
GEMINI_API_KEY=your_gemini_api_key (for AI-powered recommendations)
```

## 📦 Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🌐 Deployment (Vercel)

1. Push your code to a GitHub repository.
2. Import the project in Vercel.
3. Add the environment variables listed above in the Vercel project settings.
4. Set the **Build Command** to `npm run build` and **Output Directory** to `dist`.
5. Deploy!

## 🔥 Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** and add **Google** as a sign-in provider.
3. Enable **Cloud Firestore** in production or test mode.
4. Create a web app in your Firebase project to get the configuration keys.
5. Add your domain to the **Authorized Domains** list in the Firebase Auth settings.
6. Deploy the rules using `firebase deploy --only firestore:rules`.

---

*Readora — Seu diário literário na nuvem.*
