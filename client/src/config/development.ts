import { Config } from "./default";

export const developmentConfig: Partial<Config> = {
  firebase: {
    useEmulator: true,
    emulatorPorts: {
      auth: 9099,
      firestore: 8080,
      functions: 5001,
    },
  },
  app: {
    environment: "development",
  },
};
