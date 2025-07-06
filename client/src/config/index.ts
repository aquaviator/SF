import { defaultConfig, configSchema, type Config } from "./default";
import { developmentConfig } from "./development";
import { productionConfig } from "./production";

const env = import.meta.env.NODE_ENV || "development";
const envConfigs = {
  development: developmentConfig,
  production: productionConfig,
  test: developmentConfig,
};
const mergedConfig = {
  ...defaultConfig,
  ...envConfigs[env as keyof typeof envConfigs],
export const config = configSchema.parse(mergedConfig);
export type { Config };
