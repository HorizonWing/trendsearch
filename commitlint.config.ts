import type { UserConfig } from "@commitlint/types";

const config: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "header-max-length": [2, "always", 300],
    "body-max-line-length": [2, "always", 400],
    "footer-max-line-length": [2, "always", 400],
  },
};

export default config;
