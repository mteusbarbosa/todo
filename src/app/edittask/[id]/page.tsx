// src/app/edittask/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation"; 
import { api } from "~/trpc/react";
import { TaskForm, type TaskFormData } from "../../_components/TaskForm"; 
import Link from "next/link";
type Task = NonNullable<ReturnType<typeof api.task.getById.useQuery>['data']>;
export default function EditTaskPage() {
    const router = useRouter();
    const params = useParams(); 
    const utils = api.useUtils();
    const [globalError, setGlobalError] = useState<string | null>(null);

    // Extrai o ID da tarefa dos parâmetros da URL
    // params.id pode ser string ou string[], então garantimos que seja string e convertemos para número
    const taskIdParam = Array.isArray(params.id) ? params.id[0] : params.id;
    const taskId = taskIdParam ? parseInt(taskIdParam, 10) : NaN;

    // Query para buscar os dados da tarefa específica a ser editada
    const taskQuery = api.task.getById.useQuery(
        { id: taskId },
        {
            enabled: !isNaN(taskId), // Só executa a query se taskId for um número válido
            refetchOnWindowFocus: false,
            // onError removido das opções da query
        }
    );

    // --- Novo useEffect para tratar erros da taskQuery ---
    useEffect(() => {
        // Se a query retornou um erro, atualiza o estado globalError
        if (taskQuery.error) {
            setGlobalError(taskQuery.error.message ?? "Erro ao buscar dados da tarefa.");
        }
        // Opcional: Limpar o erro se a query for bem-sucedida posteriormente
        // else if (taskQuery.isSuccess) {
        //     setGlobalError(null); // Cuidado para não limpar erros de outras fontes
        // }
    }, [taskQuery.error]); // O efeito depende do objeto de erro da query
    // --- Fim do useEffect ---

    // Query para buscar categorias existentes (igual à página de criação)
    const categoriesQuery = api.category.getAll.useQuery(undefined, {
        refetchOnWindowFocus: false,
    });

    // --- Modificação: Mutação para ATUALIZAR com Otimismo ---
    const updateTaskMutation = api.task.update.useMutation({
        onMutate: async (updatedTaskData) => {
            setGlobalError(null); // Limpa erros anteriores ao tentar mutação

            // 1. Cancela queries pendentes para evitar sobrescrita
            await utils.task.getAll.cancel();
            await utils.task.getById.cancel({ id: taskId });

            // 2. Pega os dados atuais do cache
            const previousTask = utils.task.getById.getData({ id: taskId });
            const previousTasks = utils.task.getAll.getData();

            // 3. Atualiza otimisticamente o cache
            // Atualiza o cache da query getById
            utils.task.getById.setData({ id: taskId }, (oldData) => {
                if (!oldData) return undefined; // Não faz nada se não houver dados antigos
                // Retorna os dados antigos mesclados com os novos dados da mutação
                // Importante: Mantenha campos não editáveis como 'completed', 'createdAt'
                return {
                    ...oldData,
                    ...updatedTaskData,
                    // Se categoryId for undefined na mutação, mantenha o antigo
                    categoryId: updatedTaskData.categoryId === undefined ? oldData.categoryId : updatedTaskData.categoryId,
                    // Se a categoria foi alterada, precisamos atualizar o objeto 'category' também
                    // (Isso pode ficar complexo se você não buscar a categoria junto)
                    // Uma simplificação é invalidar no onSettled
                };
            });

            // Atualiza o cache da query getAll
            utils.task.getAll.setData(undefined, (oldData) => {
                if (!oldData) return [];
                return oldData.map(t =>
                    t.id === taskId
                        ? { ...t, ...updatedTaskData, categoryId: updatedTaskData.categoryId === undefined ? t.categoryId : updatedTaskData.categoryId }
                        : t
                );
            });

            // 4. Retorna o contexto com os dados antigos para rollback
            return { previousTask, previousTasks };
        },
        onError: (err, variables, context) => {
            // Rollback em caso de erro
            console.error("Falha ao atualizar tarefa:", err);
            if (context?.previousTask) {
                utils.task.getById.setData({ id: taskId }, context.previousTask);
            }
            if (context?.previousTasks) {
                utils.task.getAll.setData(undefined, context.previousTasks);
            }
            // Define o erro global
            const zodError = err.data?.zodError?.fieldErrors;
            const message = zodError?.title?.[0] ?? zodError?.description?.[0] ?? err.message;
            setGlobalError(message ?? "Falha ao salvar alterações.");
        },
        onSettled: async () => {
            // Sempre invalida no final para garantir consistência com o servidor
            await utils.task.getAll.invalidate();
            await utils.task.getById.invalidate({ id: taskId });
            // Não redireciona aqui, pois pode ter havido erro
        },
        onSuccess: () => {
            // Redireciona apenas se a mutação for bem-sucedida
            router.push("/");
        }
    });

    // Mutação para criar a categoria (igual à página de criação)
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

    // Função passada para o TaskForm como onSubmit
    const handleFormSubmit = (data: TaskFormData, newCategoryName?: string) => {
        setGlobalError(null);
        if (isNaN(taskId)) {
            setGlobalError("ID da tarefa inválido.");
            return;
        }

        const submitData = {
            id: taskId, // Inclui o ID da tarefa
            title: data.title,
            description: data.description,
            // Converte null para undefined se necessário (depende do schema de update)
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
                            categoryId: createdCategory.id, // Usa o ID da nova categoria
                        });
                    },
                }
            );
        } else {
            // Atualiza tarefa diretamente
            updateTaskMutation.mutate(submitData);
        }
    };

    // Combina os estados de loading
    const isLoading = taskQuery.isLoading || categoriesQuery.isLoading || updateTaskMutation.isPending || createCategoryMutation.isPending;
    const isSubmitting = updateTaskMutation.isPending || createCategoryMutation.isPending;

    // Prepara os dados iniciais para o formulário
    const initialFormData: TaskFormData | undefined = taskQuery.data
        ? {
            title: taskQuery.data.title,
            description: taskQuery.data.description,
            categoryId: taskQuery.data.categoryId, // Passa null ou number
        }
        : undefined;

    // Conteúdo a ser renderizado
    let content;
    if (taskQuery.isLoading && !taskQuery.data) { // Loading inicial
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
    } else if (taskQuery.data && initialFormData) { // Sucesso e dados prontos
        content = (
            <>
                <TaskForm
                    initialData={initialFormData} // Passa os dados carregados
                    onSubmit={handleFormSubmit}
                    isLoading={isSubmitting} // Passa apenas o loading das mutações
                    submitButtonText="Salvar Alterações"
                    availableCategories={categoriesQuery.data ?? []}
                    isCategoryLoading={categoriesQuery.isLoading}
                    categoryError={categoriesQuery.error?.message}
                />
                {/* Exibição de Erros Globais */}
                {globalError && !updateTaskMutation.error && !createCategoryMutation.error && (
                    <p className="mt-4 text-sm text-red-600">{globalError}</p>
                )}
            </>
        );
    } else {
        // Estado fallback (pode ocorrer brevemente ou se ID for inválido inicialmente)
        content = <p className="text-gray-500">Verificando tarefa...</p>;
    }

return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-24">
        <h1 className="mb-6 text-3xl font-bold">Editar Tarefa</h1>
        {content}
    </main>
);
}
