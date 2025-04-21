"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from "~/trpc/react";
import type { api as serverApi } from "~/trpc/server";
import { TaskItem } from './TaskItem';

type Task = Awaited<ReturnType<typeof serverApi.task.getAll>>[number];

interface TaskListWithSearchProps {
  initialTasks: Task[];
}

export function TaskListWithSearch({ initialTasks }: TaskListWithSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const utils = api.useUtils();

  const tasksQuery = api.task.getAll.useQuery(
    undefined,
    {
      initialData: initialTasks,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
    }
  );

  const currentTasks = tasksQuery.data ?? [];
  const [orderedTasks, setOrderedTasks] = useState<Task[]>(() => currentTasks);


  useEffect(() => {
    if (JSON.stringify(currentTasks) !== JSON.stringify(orderedTasks)) {
      setOrderedTasks(currentTasks);
    }
  }, [currentTasks, orderedTasks]);

  const filteredTasks = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase().trim();
    if (!lowerCaseQuery) {
      return orderedTasks;
    }

    return orderedTasks.filter(task =>
      task.title.toLowerCase().includes(lowerCaseQuery)
    );
  }, [orderedTasks, searchQuery]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateOrderMutation = api.task.updateOrder.useMutation({
    onMutate: async ({ orderedIds }) => {
      await utils.task.getAll.cancel();
      const previousTasks = utils.task.getAll.getData();

      utils.task.getAll.setData(undefined, (oldData) => {
        if (!oldData) return [];
        const taskMap = new Map(oldData.map(task => [task.id, task]));
        return orderedIds.map(id => taskMap.get(id)).filter(Boolean) as Task[];
      });

      return { previousTasks };
    },
    onError: (err, variables, context) => {
      console.error("Failed to update order:", err);
      toast.error("Falha ao salvar a nova ordem.");
      if (context?.previousTasks) {
        utils.task.getAll.setData(undefined, context.previousTasks);
        setOrderedTasks(context.previousTasks);
      }
    },
    onSettled: async () => {
      await utils.task.getAll.invalidate();
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      console.log("Drag ended: No move or invalid target.");
      return;
    }

    const oldIndex = orderedTasks.findIndex((item) => item.id === active.id);
    const newIndex = orderedTasks.findIndex((item) => item.id === over.id);
    const newOrderedItems = arrayMove(orderedTasks, oldIndex, newIndex);

    setOrderedTasks(newOrderedItems);

    const orderedIds = newOrderedItems.map(item => item.id);
    updateOrderMutation.mutate({ orderedIds });
  }
  const hasTasks = currentTasks.length > 0;

  let listContent;
  if (tasksQuery.isLoading && !tasksQuery.data) {
    listContent = <p className="text-center">Carregando tarefas...</p>;
  } else if (!hasTasks && !searchQuery) {
    listContent = <p className="text-center">Nenhuma tarefa cadastrada. Cadastre sua primeira Tarefa</p>;
  } else if (filteredTasks.length === 0 && searchQuery) {
    listContent = <p className="text-center text-muted-foreground">Nenhuma tarefa corresponde à busca.</p>;
  } else if (filteredTasks.length > 0) {
    listContent = (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filteredTasks.map(task => task.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="list-none p-0">
            {filteredTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <div className={`mb-6 flex flex-col sm:flex-row ${hasTasks ? 'justify-between' : 'justify-center'} items-center gap-4`}>
        <Link href="/createtask">
          <button className="w-full sm:w-auto rounded bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 whitespace-nowrap">
            Criar Nova Tarefa
          </button>
        </Link>

        {hasTasks && (
          <input
            type="text"
            placeholder="Pesquisar tarefa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-auto flex-grow rounded border border-gray-300 px-3 py-2 text-black dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        )}
      </div>

      {/* <h2 className="mb-4 text-2xl font-semibold text-center text-gray-800 dark:text-slate-100">Tarefas</h2> */}
      {tasksQuery.error && <p className="text-center text-red-500">Erro ao carregar tarefas: {tasksQuery.error.message}</p>}
      
      {listContent}

    </div>
  );
}
