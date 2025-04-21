// src/app/edittask/[id]/page.tsx
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeSwitcher } from "~/app/_components/ThemeSwitcher";
import { api } from "~/trpc/react";
import { TaskForm, type TaskFormData } from "../../_components/TaskForm";

type Task = NonNullable<ReturnType<typeof api.task.getById.useQuery>['data']>;

export default function EditTaskPage() {
    const router = useRouter();
    const params = useParams();
    const utils = api.useUtils();
    const [globalError, setGlobalError] = useState<string | null>(null);
    const taskIdParam = Array.isArray(params.id) ? params.id[0] : params.id;
    const taskId = taskIdParam ? parseInt(taskIdParam, 10) : NaN;

    const taskQuery = api.task.getById.useQuery(
        { id: taskId },
        {
            enabled: !isNaN(taskId),
            refetchOnWindowFocus: false,
        }
    );

    useEffect(() => {
        if (taskQuery.error) {
            setGlobalError(taskQuery.error.message ?? "Erro ao buscar dados da tarefa.");
        }
    }, [taskQuery.error]);

    const categoriesQuery = api.category.getAll.useQuery(undefined, {
        refetchOnWindowFocus: false,
    });

    const updateTaskMutation = api.task.update.useMutation({
        onMutate: async (updatedTaskData) => {
            setGlobalError(null);

            await utils.task.getAll.cancel();
            await utils.task.getById.cancel({ id: taskId });

            const previousTask = utils.task.getById.getData({ id: taskId });
            const previousTasks = utils.task.getAll.getData();

            utils.task.getById.setData({ id: taskId }, (oldData) => {
                if (!oldData) return undefined;
                return {
                    ...oldData,
                    ...updatedTaskData,
                    categoryId: updatedTaskData.categoryId === undefined ? oldData.categoryId : updatedTaskData.categoryId,
                };
            });

            utils.task.getAll.setData(undefined, (oldData) => {
                if (!oldData) return [];
                return oldData.map(t =>
                    t.id === taskId
                        ? { ...t, ...updatedTaskData, categoryId: updatedTaskData.categoryId === undefined ? t.categoryId : updatedTaskData.categoryId }
                        : t
                );
            });

            return { previousTask, previousTasks };
        },
        onError: (err, variables, context) => {
            console.error("Falha ao atualizar tarefa:", err);
            if (context?.previousTask) {
                utils.task.getById.setData({ id: taskId }, context.previousTask);
            }
            if (context?.previousTasks) {
                utils.task.getAll.setData(undefined, context.previousTasks);
            }
            const zodError = err.data?.zodError?.fieldErrors;
            const message = zodError?.title?.[0] ?? zodError?.description?.[0] ?? err.message;
            setGlobalError(message ?? "Falha ao salvar alterações.");
        },
        onSettled: async () => {
            await utils.task.getAll.invalidate();
            await utils.task.getById.invalidate({ id: taskId });
        },
        onSuccess: () => {
            router.push("/");
        }
    });

    const createCategoryMutation = api.category.create.useMutation({
        onSuccess: async () => {
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
        if (isNaN(taskId)) {
            setGlobalError("ID da tarefa inválido.");
            return;
        }

        const submitData = {
            id: taskId,
            title: data.title,
            description: data.description,
            categoryId: data.categoryId === null ? undefined : data.categoryId,
        };

        if (newCategoryName) {
            // Cria categoria primeiro, depois atualiza tarefa com o novo ID
            createCategoryMutation.mutate(
                { name: newCategoryName },
                {
                    onSuccess: (createdCategory) => {
                        updateTaskMutation.mutate({
                            ...submitData,
                            categoryId: createdCategory.id,
                        });
                    },
                }
            );
        } else {
            updateTaskMutation.mutate(submitData);
        }
    };

    const isLoading = taskQuery.isLoading || categoriesQuery.isLoading || updateTaskMutation.isPending || createCategoryMutation.isPending;
    const isSubmitting = updateTaskMutation.isPending || createCategoryMutation.isPending;

    const initialFormData: TaskFormData | undefined = taskQuery.data
        ? {
            title: taskQuery.data.title,
            description: taskQuery.data.description,
            categoryId: taskQuery.data.categoryId,
        }
        : undefined;


    let content;
    if (taskQuery.isLoading && !taskQuery.data) {
        content = <p className="text-gray-500">Carregando dados da tarefa...</p>;
    } else if (taskQuery.isError) {
        content = (
            <div className="text-center text-red-600">
                <p>Erro ao carregar a tarefa.</p>
                <p>{globalError ?? taskQuery.error?.message}</p>
                <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
                    Voltar para a lista
                </Link>
            </div>
        );
    } else if (taskQuery.data && initialFormData) {
        content = (
            <>
                <TaskForm
                    initialData={initialFormData}
                    onSubmit={handleFormSubmit}
                    isLoading={isSubmitting}
                    submitButtonText="Salvar Alterações"
                    availableCategories={categoriesQuery.data ?? []}
                    isCategoryLoading={categoriesQuery.isLoading}
                    categoryError={categoriesQuery.error?.message}
                />
                {globalError && !updateTaskMutation.error && !createCategoryMutation.error && (
                    <p className="mt-4 text-sm text-red-600">{globalError}</p>
                )}
            </>
        );
    } else {
        content = <p className="text-gray-500">Verificando tarefa...</p>;
    }

    return (
        <main className="flex min-h-screen flex-col items-center p-6 md:p-24">
            <div className="absolute top-6 right-6 z-10">
                <ThemeSwitcher />
            </div>
            <h1 className="mb-6 text-3xl font-bold">Editar Tarefa</h1>
            {content}
        </main>
    );
}
