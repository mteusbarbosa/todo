// src/app/_components/TaskItem.tsx
"use client";

import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from "~/trpc/react";
import type { api as serverApi } from "~/trpc/server";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DeleteConfirmation from './Toast';
import router from 'next/router';

// Define o tipo esperado para a prop 'task'
type Task = Awaited<ReturnType<typeof serverApi.task.getAll>>[number];

export function TaskItem({ task }: { task: Task }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const utils = api.useUtils();
    const router = useRouter();
    const {
        attributes, // Props para aplicar ao elemento arrastável (ex: role, aria)
        listeners,  // Handlers de eventos (onPointerDown, onKeyDown) para iniciar o arraste
        setNodeRef, // Ref para conectar ao elemento DOM arrastável
        transform,  // Estilos CSS para a posição durante o arraste
        transition, // Estilos CSS para a animação ao soltar
        isDragging, // Booleano indicando se o item está sendo arrastado
    } = useSortable({ id: task.id }); // Usa o ID da tarefa como identificador único

    const style = {
        transform: CSS.Transform.toString(transform), // Converte o objeto transform em string CSS
        transition, // Aplica a transição
        opacity: isDragging ? 0.5 : 1, // Opcional: Deixa o item semi-transparente ao arrastar
        zIndex: isDragging ? 10 : 'auto', // Opcional: Garante que o item arrastado fique por cima
        position: 'relative' as const, // Necessário para zIndex funcionar corretamente
    };

    // Mutação com Atualização Otimista
    const toggleCompleteMutation = api.task.toggleComplete.useMutation({
        // --- Início da Atualização Otimista ---
        onMutate: async (variables) => {
            // 1. Cancela queries pendentes para 'getAll' para não sobrescrever a atualização otimista
            await utils.task.getAll.cancel();

            // 2. Pega os dados atuais da query antes da mutação
            const previousTasks = utils.task.getAll.getData();

            // 3. Atualiza otimisticamente o cache com o novo valor
            utils.task.getAll.setData(undefined, (oldData) => {
                if (!oldData) return []; // Se não houver dados antigos, retorna array vazio
                return oldData.map(t =>
                    t.id === variables.id ? { ...t, completed: variables.completed } : t
                );
            });

            // 4. Retorna os dados antigos para poder reverter em caso de erro
            return { previousTasks };
        },
        // --- Fim da Atualização Otimista ---

        // Em caso de erro, reverte para os dados anteriores
        onError: (err, variables, context) => {
            console.error("Falha ao atualizar tarefa:", err);
            alert(`Erro ao atualizar tarefa: ${err.message}`);
            // Reverte o cache para o estado anterior usando os dados do contexto
            if (context?.previousTasks) {
                utils.task.getAll.setData(undefined, context.previousTasks);
            }
        },

        // Após sucesso ou erro, sempre invalida a query para garantir consistência final
        onSettled: async () => {
            await utils.task.getAll.invalidate();
        },
    });

    // --- Mutação Delete com Atualização Otimista ---
    const deleteTaskMutation = api.task.delete.useMutation({
        onMutate: async (variables) => {
            // 1. Cancela queries pendentes
            await utils.task.getAll.cancel();

            // 2. Pega dados atuais
            const previousTasks = utils.task.getAll.getData();

            // 3. Atualiza otimisticamente o cache REMOVENDO o item
            utils.task.getAll.setData(undefined, (oldData) => {
                if (!oldData) return [];
                // Filtra, mantendo apenas as tarefas cujo ID NÃO é o que está sendo excluído
                return oldData.filter(t => t.id !== variables.id);
            });

            // 4. Retorna dados antigos para rollback
            return { previousTasks };
        },
        onError: (err, variables, context) => {
            // Em caso de erro, restaura os dados anteriores
            console.error("Falha ao excluir tarefa:", err);
            alert(`Erro ao excluir tarefa: ${err.message}`);
            if (context?.previousTasks) {
                utils.task.getAll.setData(undefined, context.previousTasks);
            }
        },
        onSettled: async () => {
            // Garante consistência final com o servidor
            await utils.task.getAll.invalidate();
        },
    });
    // --- Fim da Mutação Delete ---

    const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        toggleCompleteMutation.mutate({ id: task.id, completed: event.target.checked });
    };

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    const handleEditClick = () => {
        // Navega para a página de edição usando o ID da tarefa
        router.push(`/edittask/${task.id}`);
    };

    const handleDeleteClick = () => {
        // Chama toast.custom, passando o componente de confirmação
        toast.custom((t) => ( // 't' contém informações sobre o toast, como o ID (t.id)
            <DeleteConfirmation
                toastId={t.id} // Passa o ID para poder fechar o toast
                taskId={task.id}
                taskTitle={task.title}
                isMutating={deleteTaskMutation.isPending}
                onConfirm={() => {
                    // Chama a mutação real ao confirmar
                    deleteTaskMutation.mutate({ id: task.id });
                }}
                onCancel={() => {
                    // Apenas fecha o toast (já tratado no componente)
                    console.log("Exclusão cancelada");
                }}
            />
        ), {
            // Opções adicionais para o toast (duração, etc.)
            // duration: Infinity, // Para não fechar automaticamente
        });
    };

    // Define classes condicionais com base no status 'completed' da PROP 'task'
    // A atualização otimista garante que 'task' terá o valor atualizado rapidamente
    const cardBgClass = task.completed ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800';
    const titleClass = task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-100';
    const categoryClass = task.completed ? 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300' : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
    const descriptionClass = task.completed ? 'text-gray-500 dark:text-gray-400' : 'text-gray-600 dark:text-gray-300';
    const isMutating = toggleCompleteMutation.isPending || deleteTaskMutation.isPending;

    return (
        <li
            suppressHydrationWarning
            ref={setNodeRef} // Conecta o hook ao elemento
            style={style}     // Aplica os estilos de transformação e transição
            {...attributes}   // Aplica atributos de acessibilidade e role
            className={`mb-4 rounded border border-gray-300 dark:border-gray-600 p-4 shadow-sm transition-colors duration-200 ${cardBgClass}`}
        >
            <div className="flex justify-between items-center">
                {/* Container para Checkbox, Título e Categoria */}
                <div className="flex-grow mr-4 flex items-center space-x-3">
                    <div className="flex items-center space-x-3 cursor-grab" {...listeners}>
                        {/* Checkbox */}
                        <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={handleCheckboxChange}
                            disabled={toggleCompleteMutation.isPending}
                            className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer" // Adicionado cursor-pointer
                            aria-labelledby={`task-title-${task.id}`}
                            onClick={(e) => e.stopPropagation()} // Impede que clicar no checkbox inicie o arraste
                        />

                        {/* Título e Categoria */}
                        <div className="flex items-center space-x-2">
                            <h3 id={`task-title-${task.id}`} className={`text-lg font-semibold ${titleClass}`}>
                                {task.title}
                            </h3>
                            {task.category && (
                                <>
                                    <span className="text-gray-400">|</span>
                                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap ${categoryClass}`}>
                                        {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */}
                                        {task.category.name}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>



                {/* Botão de expandir/recolher (com SVG restaurado) */}
                <button
                    onClick={toggleExpand}
                    className="flex-shrink-0 rounded p-1 text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? "Recolher descrição" : "Expandir descrição"}
                >
                    {/* --- SVG Restaurado --- */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-5 w-5 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'
                            }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                    {/* --- Fim do SVG --- */}
                </button>
            </div>

            {isExpanded && (
                <div className="mt-3 border-t border-gray-200 pt-3">
                    {/* Descrição */}
                    <p className={`text-sm mb-4 ${descriptionClass}`}>
                        {task.description}
                    </p>

                    {/* --- Removida a lógica condicional interna --- */}
                    {/* Renderiza sempre os botões padrão */}
                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={handleEditClick}
                            title="Editar Tarefa"
                            className="flex items-center justify-center h-8 w-8 rounded-full bg-yellow-400 text-white hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                            disabled={isMutating}
                        >
                            <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handleDeleteClick} // Agora chama o toast
                            title="Excluir Tarefa"
                            className="flex items-center justify-center h-8 w-8 rounded-full bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                            disabled={isMutating}
                        >
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </div>
                    {/* --- Fim da remoção --- */}
                </div>
            )}
        </li>
    );
}