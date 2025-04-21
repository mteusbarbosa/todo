import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { normalizeCategoryName } from "~/utils/category.utils";
import { createCategoryInputSchema } from "../schemas/category.schema";

export const categoryRouter = createTRPCRouter({

  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.db.category.findMany({
      orderBy: { name: 'asc' },
    });
  }),

  create: publicProcedure
    .input(createCategoryInputSchema)
    .mutation(async ({ ctx, input }) => {

      const normalizedName = normalizeCategoryName(input.name);

      if (!normalizedName) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Nome da categoria inválido após normalização.',
        });
      }
      
      if (normalizedName.length > 100) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Nome da categoria muito longo (máx 100 caracteres).',
        });
      }
      
      const existingCategory = await ctx.db.category.findFirst({
        where: {
          name: {
            equals: input.name,
            mode: 'insensitive',
          }
        }
      });

      if (existingCategory) {
        throw new Error(`A categoria "${input.name}" já existe.`);
      }

      const newCategory = await ctx.db.category.create({
        data: {
          name: normalizedName,
        },
      });
      return newCategory;
    }),
});