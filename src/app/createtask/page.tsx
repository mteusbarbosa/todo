// src/app/createtask/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { TaskForm, type TaskFormData } from "../_components/TaskForm"; // Importa o formulário e o tipo

export default function CreateTaskPage() {
  const router = useRouter();
  const utils = api.useUtils();
  const [globalError, setGlobalError] = useState<string | null>(null); // Para erros não relacionados ao form

  // Query para buscar categorias existentes
  const categoriesQuery = api.category.getAll.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  // Mutação para criar a tarefa
  const createTaskMutation = api.task.create.useMutation({
    onSuccess: async () => {
      setGlobalError(null);
      await utils.task.getAll.invalidate(); // Invalida a lista de tarefas na home
      router.push("/"); // Redireciona para a home
      // router.refresh(); // Alternativa se não usar invalidação
    },
    onError: (error) => {
      const zodError = error.data?.zodError?.fieldErrors;
      const message = zodError?.title?.[0] ?? zodError?.description?.[0] ?? error.message;
      setGlobalError(message ?? "Falha ao criar a tarefa.");
      console.error("Erro ao criar tarefa:", error);
    },
  });

  // Mutação para criar a categoria
  const createCategoryMutation = api.category.create.useMutation({
    onSuccess: async (newCategory) => {
      console.log("Categoria criada:", newCategory);
      // Invalida a query de categorias para atualizar o select no TaskForm
      await utils.category.getAll.invalidate();
      // Não chama createTaskMutation aqui, o handleFormSubmit fará isso
      // com o ID da nova categoria após o refetch ou atualização manual.
      // Idealmente, o TaskForm deveria receber a nova categoria e selecioná-la.
      // Por simplicidade, vamos confiar na invalidação por enquanto.
      setGlobalError(null); // Limpa erro global se a criação da categoria deu certo
    },
    onError: (error) => {
      setGlobalError(error.message ?? "Falha ao criar a categoria.");
      console.error("Erro ao criar categoria:", error);
    },
  });

  // Função passada para o TaskForm como onSubmit
  const handleFormSubmit = (data: TaskFormData, newCategoryName?: string) => {
    setGlobalError(null);

    if (newCategoryName) {
      createCategoryMutation.mutate(
        { name: newCategoryName },
        {
          onSuccess: (createdCategory) => {
            createTaskMutation.mutate({
              title: data.title,
              description: data.description,
              categoryId: createdCategory.id,
            });
          },
        }
      );
    } else {
      createTaskMutation.mutate({
        title: data.title,
        description: data.description,
        categoryId: data.categoryId === null ? undefined : data.categoryId,
      });
    }
  };

  // Combina os estados de loading
  const isLoading = createTaskMutation.isPending || createCategoryMutation.isPending || categoriesQuery.isLoading;

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-24">
      <h1 className="mb-6 text-3xl font-bold">Criar Nova Tarefa</h1>

      {/* Renderiza o componente TaskForm */}
      <TaskForm
        onSubmit={handleFormSubmit}
        isLoading={isLoading}
        submitButtonText="Criar Tarefa"
        availableCategories={categoriesQuery.data ?? []}
        isCategoryLoading={categoriesQuery.isLoading}
        categoryError={categoriesQuery.error?.message}
      />

      {/* Exibição de Erros Globais (não do formulário interno) */}
      {globalError && (
        <p className="mt-4 text-sm text-red-600">{globalError}</p>
      )}
    </main>
  );
}
