import type { ZodType, infer as ZodInfer } from "zod";

import { SchemaValidationError } from "../../errors";

export const validateSchema = <TSchema extends ZodType>(args: {
  endpoint: string;
  schema: TSchema;
  data: unknown;
}): ZodInfer<TSchema> => {
  const result = args.schema.safeParse(args.data);
  if (!result.success) {
    const issues = result.error.issues.map(
      (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`
    );
    throw new SchemaValidationError({ endpoint: args.endpoint, issues });
  }

  return result.data;
};
