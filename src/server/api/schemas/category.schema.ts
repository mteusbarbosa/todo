import { z } from "zod";

export const createCategoryInputSchema = z.object({
  name: z.string().min(1, {
    message: "O nome da categoria não pode estar vazio.",
  }),
});