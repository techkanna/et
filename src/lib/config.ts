import { z } from "zod";

const envSchema = z.object({
  ET_LLM_BASE_URL: z.string().default("http://127.0.0.1:1234/v1"),
  ET_LLM_MODEL: z.string().default("google/gemma-4-e4b"),
  ET_STT_BASE_URL: z.string().default("http://localhost:8100"),
  ET_TTS_BASE_URL: z.string().default("http://localhost:8200"),
  ET_DATABASE_PATH: z.string().default("./data/database.db"),
  ET_STORAGE_PATH: z.string().default("./storage"),
  ET_MOCK_AI: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

function loadConfig() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }
  return parsed.data;
}

export const config = loadConfig();
