import { z } from "zod";

export const createTaskInputSchema = z.object({
    title: z.string().min(1, "O título é obrigatório."),
    description: z.string().min(1, "A descrição é obrigatória."),
    categoryId: z.number().int().optional(),
});

export const updateTaskInputSchema = z.object({
    id: z.number().int(),
    title: z.string().min(1, "O título é obrigatório."),
    description: z.string().min(1, "A descrição é obrigatória."),
    categoryId: z.number().int().nullish(),
});

export const getByIdInputSchema = z.object({
    id: z.number().int(),
});

export const toggleCompleteInputSchema = z.object({
    id: z.number().int(),
    completed: z.boolean(),
});

export const updateOrderInputSchema = z.object({
    orderedIds: z.array(z.number().int()),
});

export const deleteInputSchema = z.object({
    id: z.number().int(),
});


