import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc"; // protectedProcedure, // Use se tiver autenticação
import { deleteInputSchema, getByIdInputSchema, toggleCompleteInputSchema, updateOrderInputSchema, updateTaskInputSchema } from "../schemas/task.schema";


export const taskRouter = createTRPCRouter({
  
  getById: publicProcedure
    .input(getByIdInputSchema)
    .query(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({
        where: { id: input.id },
        include: { category: true },
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Tarefa com ID ${input.id} não encontrada.`,
        });
      }
      return task;
    }),
  
  create: publicProcedure
    .input(z.object({
      title: z.string().min(1, "O título é obrigatório."),
      description: z.string().min(1, "A descrição é obrigatória."),
      categoryId: z.number().int().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.create({
        data: {
          title: input.title,
          description: input.description,
          order: Date.now(),
          ...(input.categoryId && {
            category: {
              connect: { id: input.categoryId },
            },
          }),
        },
      });
      return task;
    }),

  getAll: publicProcedure
    .query(({ ctx }) => {
      return ctx.db.task.findMany({
        orderBy: [
          { order: 'asc' },
        ],
        include: {
          category: true,
        },
      });
    }),

  toggleComplete: publicProcedure 
    .input(toggleCompleteInputSchema) 
    .mutation(async ({ ctx, input }) => {
      const { id, completed } = input;

      const taskExists = await ctx.db.task.findUnique({
        where: { id },
      });

      if (!taskExists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Tarefa com ID ${id} não encontrada.`,
        });
      }

      const updatedTask = await ctx.db.task.update({
        where: {
          id: id,
        },
        data: {
          completed: completed,
        },
      });

      return updatedTask;
    }),

  delete: publicProcedure
    .input(deleteInputSchema) 
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      const taskExists = await ctx.db.task.findUnique({
        where: { id },
      });

      if (!taskExists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Tarefa com ID ${id} não encontrada para exclusão.`,
        });
      }

      await ctx.db.task.delete({
        where: {
          id: id,
        },
      });

      return { success: true, deletedId: id };
    }),

  update: publicProcedure
    .input(updateTaskInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, title, description, categoryId } = input;

      const taskExists = await ctx.db.task.findUnique({
        where: { id },
      });

      if (!taskExists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Tarefa com ID ${id} não encontrada para atualização.`,
        });
      }

      const updatedTask = await ctx.db.task.update({
        where: {
          id: id,
        },
        data: {
          title: title,
          description: description,
          ...(categoryId !== undefined && { categoryId: categoryId }),
        },
      });

      return updatedTask;
    }),

  updateOrder: publicProcedure
    .input(updateOrderInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { orderedIds } = input;

      try {
        await ctx.db.$transaction(
          orderedIds.map((id, index) =>
            ctx.db.task.update({
              where: { id: id },
              data: { order: index + 1.0 },
            })
          )
        );
        return { success: true };
      } catch (error) {
        console.error("Failed to update task order:", error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Falha ao atualizar a ordem das tarefas.',
          cause: error,
        });
      }
    }),
});