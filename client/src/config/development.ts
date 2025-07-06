import { Config } from "./default";

export const developmentConfig: Partial<Config> = {
  api: {
    baseUrl: "http://localhost:5000",
    timeout: 5000,
  },
  firebase: {
    apiKey: "dev-api-key",
    authDomain: "dev-project.firebaseapp.com",
    projectId: "dev-project",
    storageBucket: "dev-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:dev",
    useEmulator: true,
    emulatorPorts: {
      auth: 9099,
      firestore: 8080,
      functions: 5001,
    },
  app: {
    name: "Agent Shifts Dev",
    version: "1.0.0-dev",
    environment: "development",
};
