"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from "~/trpc/react";
import type { api as serverApi } from "~/trpc/server";
import DeleteConfirmation from './Toast';

type Task = Awaited<ReturnType<typeof serverApi.task.getAll>>[number];

export function TaskItem({ task }: Readonly<{ task: Task }>) {
    const [isExpanded, setIsExpanded] = useState(false);
    const utils = api.useUtils();
    const router = useRouter();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 'auto',
        position: 'relative' as const,
    };

    const toggleCompleteMutation = api.task.toggleComplete.useMutation({
        onMutate: async (variables) => {
            await utils.task.getAll.cancel();

            const previousTasks = utils.task.getAll.getData();

            utils.task.getAll.setData(undefined, (oldData) => {
                if (!oldData) return [];
                return oldData.map(t =>
                    t.id === variables.id ? { ...t, completed: variables.completed } : t
                );
            });

            return { previousTasks };
        },

        onError: (err, variables, context) => {
            console.error("Falha ao atualizar tarefa:", err);
            alert(`Erro ao atualizar tarefa: ${err.message}`);
            if (context?.previousTasks) {
                utils.task.getAll.setData(undefined, context.previousTasks);
            }
        },

        onSettled: async () => {
            await utils.task.getAll.invalidate();
        },
    });

    const deleteTaskMutation = api.task.delete.useMutation({
        onMutate: async (variables) => {
            await utils.task.getAll.cancel();

            const previousTasks = utils.task.getAll.getData();

            utils.task.getAll.setData(undefined, (oldData) => {
                if (!oldData) return [];
                return oldData.filter(t => t.id !== variables.id);
            });

            return { previousTasks };
        },
        onError: (err, variables, context) => {
            console.error("Falha ao excluir tarefa:", err);
            alert(`Erro ao excluir tarefa: ${err.message}`);
            if (context?.previousTasks) {
                utils.task.getAll.setData(undefined, context.previousTasks);
            }
        },
        onSettled: async () => {
            await utils.task.getAll.invalidate();
        },
    });

    const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        toggleCompleteMutation.mutate({ id: task.id, completed: event.target.checked });
    };

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    const handleEditClick = () => {
        router.push(`/edittask/${task.id}`);
    };

    const handleDeleteClick = () => {
        toast.custom((t) => (
            <DeleteConfirmation
                toastId={t.id}
                taskId={task.id}
                taskTitle={task.title}
                isMutating={deleteTaskMutation.isPending}
                onConfirm={() => {
                    deleteTaskMutation.mutate({ id: task.id });
                }}
                onCancel={() => {
                    console.log("Exclusão cancelada");
                }}
            />
        ));
    };

    const cardBgClass = task.completed ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800';
    const titleClass = task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-100';
    const categoryClass = task.completed ? 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300' : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
    const descriptionClass = task.completed ? 'text-gray-500 dark:text-gray-400' : 'text-gray-600 dark:text-gray-300';
    const isMutating = toggleCompleteMutation.isPending || deleteTaskMutation.isPending;

    return (
        <li
            suppressHydrationWarning
            ref={setNodeRef}
            style={style}
            className={`mb-4 rounded border border-gray-300 dark:border-gray-600 p-4 shadow-sm transition-colors duration-200 ${cardBgClass}`}
        >
            <div className="flex justify-between items-center">
                <div className="flex-grow mr-4 flex items-center space-x-3">

                    <div
                        {...listeners}
                        {...attributes}
                        className="cursor-grab p-1"
                        title="Arrastar tarefa"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                        </svg>
                    </div>

                    <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={handleCheckboxChange}
                        disabled={toggleCompleteMutation.isPending}
                        className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
                        aria-labelledby={`task-title-${task.id}`}
                        onClick={(e) => e.stopPropagation()}
                    />

                    <div className="flex items-center space-x-2">
                        <h3 id={`task-title-${task.id}`} className={`text-lg font-semibold ${titleClass}`}>
                            {task.title}
                        </h3>
                        {task.category && (
                            <>
                                <span className="text-gray-400">|</span>
                                <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap ${categoryClass}`}>
                                    {task.category.name}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                <button
                    onClick={toggleExpand}
                    className="flex-shrink-0 rounded p-1 text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? "Recolher descrição" : "Expandir descrição"}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-5 w-5 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {isExpanded && (
                <div className="mt-3 border-t border-gray-200 pt-3">
                    <p className={`text-sm mb-4 ${descriptionClass}`}>
                        {task.description}
                    </p>

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
                            onClick={handleDeleteClick}
                            title="Excluir Tarefa"
                            className="flex items-center justify-center h-8 w-8 rounded-full bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                            disabled={isMutating}
                        >
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </li>
    );
}