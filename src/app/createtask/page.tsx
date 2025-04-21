"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";
import { TaskForm, type TaskFormData } from "../_components/TaskForm"; // Importa o formulário e o tipo
import { ThemeSwitcher } from "../_components/ThemeSwitcher";

export default function CreateTaskPage() {
  const router = useRouter();
  const utils = api.useUtils();
  const [globalError, setGlobalError] = useState<string | null>(null); // Para erros não relacionados ao form

  const categoriesQuery = api.category.getAll.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const createTaskMutation = api.task.create.useMutation({
    onSuccess: async () => {
      setGlobalError(null);
      await utils.task.getAll.invalidate();
      router.push("/");
    },
    onError: (error) => {
      const zodError = error.data?.zodError?.fieldErrors;
      const message = zodError?.title?.[0] ?? zodError?.description?.[0] ?? error.message;
      setGlobalError(message ?? "Falha ao criar a tarefa.");
      console.error("Erro ao criar tarefa:", error);
    },
  });

  const createCategoryMutation = api.category.create.useMutation({
    onSuccess: async (newCategory) => {
      console.log("Categoria criada:", newCategory);
      await utils.category.getAll.invalidate();
      setGlobalError(null);
    },
    onError: (error) => {
      setGlobalError(error.message ?? "Falha ao criar a categoria.");
      console.error("Erro ao criar categoria:", error);
    },
  });

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

  const isLoading = createTaskMutation.isPending || createCategoryMutation.isPending || categoriesQuery.isLoading;

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-24 ">
      <div className="absolute top-6 right-6 z-10">
        <ThemeSwitcher />
      </div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
        Criar Nova Tarefa
      </h1>

      <TaskForm
        onSubmit={handleFormSubmit}
        isLoading={isLoading}
        submitButtonText="Criar Tarefa"
        availableCategories={categoriesQuery.data ?? []}
        isCategoryLoading={categoriesQuery.isLoading}
        categoryError={categoriesQuery.error?.message}
      />

      {globalError && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{globalError}</p>
      )}
    </main>
  );
}
