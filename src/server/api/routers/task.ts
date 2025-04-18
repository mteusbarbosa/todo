import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc"; // protectedProcedure, // Use se tiver autenticação

// --- Schema para input de update ---
const updateTaskInputSchema = z.object({
  id: z.number().int(), // ID da tarefa a ser atualizada
  title: z.string().min(1, "O título é obrigatório."), // Título atualizado
  description: z.string().min(1, "A descrição é obrigatória."), // Descrição atualizada
  // Permite number, null ou undefined.
  // nullish() = optional().nullable()
  categoryId: z.number().int().nullish(),
});

// Schema para input de getById (necessário para a página de edição)
const getByIdInputSchema = z.object({
  id: z.number().int(),
});

const toggleCompleteInputSchema = z.object({
  id: z.number().int(),
  completed: z.boolean(),
});


const deleteInputSchema = z.object({
  id: z.number().int(),
});

export const taskRouter = createTRPCRouter({
  // --- Procedure getById ---
  getById: publicProcedure
    .input(getByIdInputSchema)
    .query(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({
        where: { id: input.id },
        // where: { id: input.id, userId: ctx.session.user.id }, // Se filtrar por usuário
        include: { category: true }, // Inclui categoria se necessário
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Tarefa com ID ${input.id} não encontrada.`,
        });
      }
      return task;
    }),
  // Procedimento para criar uma nova tarefa (Mutation)
  create: publicProcedure
    .input(z.object({
      title: z.string().min(1, "O título é obrigatório."),
      description: z.string().min(1, "A descrição é obrigatória."),
      categoryId: z.number().int().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Usa o Prisma Client (ctx.db) para criar a tarefa no banco de dados
      const task = await ctx.db.task.create({
        data: {
          title: input.title,
          description: input.description,
          ...(input.categoryId && {
            category: {
              connect: { id: input.categoryId },
            },
          }),
        },
      });
      return task;
    }),

  getAll: publicProcedure // ou protectedProcedure
    .query(({ ctx }) => {
      return ctx.db.task.findMany({
        orderBy: [
          { completed: 'asc' }, // Opcional: tarefas pendentes primeiro
          { createdAt: 'desc' },
        ],
        include: {
          category: true, // Inclui os dados da categoria relacionada
        },
        // where: { userId: ctx.session.user.id } // Se filtrar por usuário
      });
    }),

  toggleComplete: publicProcedure // ou protectedProcedure
    .input(toggleCompleteInputSchema) // Valida o input
    .mutation(async ({ ctx, input }) => {
      const { id, completed } = input;

      // Opcional: Verificar se a tarefa existe antes de tentar atualizar
      const taskExists = await ctx.db.task.findUnique({
        where: { id },
        // where: { id, userId: ctx.session.user.id } // Se filtrar por usuário
      });

      if (!taskExists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Tarefa com ID ${id} não encontrada.`,
        });
      }

      // Atualiza o status 'completed' da tarefa no banco
      const updatedTask = await ctx.db.task.update({
        where: {
          id: id,
          // where: { id, userId: ctx.session.user.id } // Se filtrar por usuário
        },
        data: {
          completed: completed,
        },
      });

      return updatedTask; // Retorna a tarefa atualizada
    }),

  delete: publicProcedure
    .input(deleteInputSchema) // Valida o input (apenas o ID)
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      // 1. Verificar se a tarefa existe (importante!)
      const taskExists = await ctx.db.task.findUnique({
        where: { id },
        // where: { id, userId: ctx.session.user.id } // Se filtrar por usuário
      });

      if (!taskExists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Tarefa com ID ${id} não encontrada para exclusão.`,
        });
      }

      // 2. Excluir a tarefa
      await ctx.db.task.delete({
        where: {
          id: id,
          // where: { id, userId: ctx.session.user.id } // Se filtrar por usuário
        },
      });

      // 3. Retornar sucesso (pode retornar o ID ou um objeto de sucesso)
      return { success: true, deletedId: id };
    }),

  update: publicProcedure
    .input(updateTaskInputSchema) // Valida o input de atualização
    .mutation(async ({ ctx, input }) => {
      const { id, title, description, categoryId } = input;

      // 1. Verificar se a tarefa existe
      const taskExists = await ctx.db.task.findUnique({
        where: { id },
        // where: { id, userId: ctx.session.user.id }, // Se filtrar por usuário
      });

      if (!taskExists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Tarefa com ID ${id} não encontrada para atualização.`,
        });
      }

      // 2. Atualizar a tarefa no banco de dados
      const updatedTask = await ctx.db.task.update({
        where: {
          id: id,
          // where: { id, userId: ctx.session.user.id }, // Se filtrar por usuário
        },
        data: {
          title: title,
          description: description,
          // Atualiza categoryId. Prisma define como null se categoryId for null,
          // ou conecta se for um número. Se for undefined (não incluído no input), não altera.
          // Como nosso schema tem `nullish()`, ele pode ser number, null ou undefined.
          // Se for undefined, não queremos atualizar, então filtramos.
          ...(categoryId !== undefined && { categoryId: categoryId }),

          // Alternativa mais explícita para Prisma < 4.x ou clareza:
          // category: categoryId === null
          //     ? { disconnect: true } // Desconecta se for null
          //     : categoryId !== undefined
          //         ? { connect: { id: categoryId } } // Conecta se for número
          //         : undefined // Não faz nada se for undefined
        },
      });

      return updatedTask; // Retorna a tarefa atualizada
    }),
  // -----------------------------
});