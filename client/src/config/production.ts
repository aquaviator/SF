import { Config } from "./default";

export const productionConfig: Partial<Config> = {
  api: {
    baseUrl: "/api",
    timeout: 10000,
  },
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "prod-api-key",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "agentshifts.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "agentshifts",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "agentshifts.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "987654321",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:987654321:web:prod",
    useEmulator: false,
    emulatorPorts: {
      auth: 9099,
      firestore: 8080,
      functions: 5001,
    },
  app: {
    name: "Agent Shifts",
    version: "1.0.0",
    environment: "production",
};
