import { Config } from "./default";

export const productionConfig: Partial<Config> = {
  firebase: {
    useEmulator: false,
  },
  app: {
    environment: "production",
  },
  api: {
    baseUrl: "/api",
  },
};
