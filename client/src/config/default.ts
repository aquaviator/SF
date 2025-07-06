import { z } from "zod";

export const configSchema = z.object({
  firebase: z.object({
    apiKey: z.string(),
    authDomain: z.string(),
    projectId: z.string(),
    storageBucket: z.string(),
    messagingSenderId: z.string(),
    appId: z.string(),
    useEmulator: z.boolean().default(false),
    emulatorPorts: z.object({
      auth: z.number().default(9099),
      firestore: z.number().default(8080),
      functions: z.number().default(5001),
    }),
  }),
  app: z.object({
    name: z.string().default("Agent Shifts"),
    version: z.string().default("1.0.0"),
    environment: z.string().default("development"),
  }),
  api: z.object({
    baseUrl: z.string().default("/api"),
    timeout: z.number().default(10000),
  }),
});

export type Config = z.infer<typeof configSchema>;

export const defaultConfig: Config = {
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY || "default-api-key",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "agent-shifts.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "agent-shifts",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "agent-shifts.appspot.com",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: process.env.FIREBASE_APP_ID || "1:123456789:web:abcdef",
    useEmulator: true,
    emulatorPorts: {
      auth: 9099,
      firestore: 8080,
      functions: 5001,
    },
  },
  app: {
    name: "Agent Shifts",
    version: "1.0.0",
    environment: "development",
  },
  api: {
    baseUrl: "/api",
    timeout: 10000,
  },
};
