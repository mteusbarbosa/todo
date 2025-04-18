import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

// Helper function para normalizar (pode ficar aqui ou em um arquivo utils)
const normalizeCategoryName = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

// Schema de validação para o nome da nova categoria
const createCategoryInputSchema = z.object({
  name: z.string().min(1, { message: "O nome da categoria não pode estar vazio." }),
});

export const categoryRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    // Busca todas as categorias no banco de dados
    return ctx.db.category.findMany({
      orderBy: { name: 'asc' }, // Opcional: ordenar por nome
    });
  }),
  // Nova mutação para criar uma categoria
  create: publicProcedure
    .input(createCategoryInputSchema) // Validar o input com Zod
    .mutation(async ({ ctx, input }) => {
      // --- Normalização aqui ---
      const normalizedName = normalizeCategoryName(input.name);
      // -------------------------

      // Validação extra (opcional): Verificar se o nome normalizado é válido
      if (!normalizedName) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Nome da categoria inválido após normalização.',
        });
      }
      // Exemplo: Limite de tamanho após normalização
      if (normalizedName.length > 100) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Nome da categoria muito longo (máx 100 caracteres).',
        });
      }
      // Verificar se já existe uma categoria com o mesmo nome (case-insensitive)
      // Isso é opcional, mas recomendado para evitar duplicatas
      const existingCategory = await ctx.db.category.findFirst({
        where: {
          name: {
            equals: input.name,
            mode: 'insensitive', // Ignora maiúsculas/minúsculas na busca
          }
        }
      });

      if (existingCategory) {
        // Você pode lançar um erro ou retornar a categoria existente
        // Lançar erro é mais explícito sobre a falha na criação "nova"
        throw new Error(`A categoria "${input.name}" já existe.`);
        // Ou retornar a existente: return existingCategory;
      }

      // Cria a nova categoria no banco de dados
      const newCategory = await ctx.db.category.create({
        data: {
          name: normalizedName, // Use o nome normalizado
        },
      });
      return newCategory; // Retorna a categoria recém-criada (inclui o ID)
    }),
});

// Não se esqueça de adicionar o categoryRouter ao seu appRouter principal
// em src/server/api/root.ts