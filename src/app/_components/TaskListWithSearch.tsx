// src/app/_components/TaskListWithSearch.tsx
"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { api } from "~/trpc/react";
import type { api as serverApi } from "~/trpc/server";
import { TaskItem } from './TaskItem';
import {
  DndContext,
  closestCenter, // Estratégia de detecção de colisão
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent, // Tipo do evento onDragEnd
} from '@dnd-kit/core';
import {
  arrayMove, // Função utilitária para reordenar arrays
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy, // Estratégia de layout para listas verticais
} from '@dnd-kit/sortable';
import toast from 'react-hot-toast';

// Define o tipo esperado para a prop 'initialTasks'
type Task = Awaited<ReturnType<typeof serverApi.task.getAll>>[number];

interface TaskListWithSearchProps {
  initialTasks: Task[]; // Continua recebendo a lista inicial do servidor
}

export function TaskListWithSearch({ initialTasks }: TaskListWithSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const utils = api.useUtils();

  const tasksQuery = api.task.getAll.useQuery(
    undefined, // Input da query (se houver)
    {
      initialData: initialTasks, // Usa os dados do servidor como valor inicial
      refetchOnWindowFocus: false, // Opcional: evita refetch ao focar na janela
      staleTime: 60 * 1000, // Opcional: considera os dados "frescos" por 1 minuto
    }
  );

  const currentTasks = tasksQuery.data ?? [];
  const [orderedTasks, setOrderedTasks] = useState<Task[]>(() => currentTasks);

  // Efeito para atualizar o estado local se os dados da query mudarem externamente
  useEffect(() => {
    // Compara para evitar loops desnecessários se a referência mudar mas o conteúdo não
    if (JSON.stringify(currentTasks) !== JSON.stringify(orderedTasks)) {
      setOrderedTasks(currentTasks);
    }
  }, [currentTasks, orderedTasks]); // Adiciona orderedTasks à dependência para comparação

  // Filtra as tarefas baseado na busca (agora usando currentTasks)
  const filteredTasks = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase().trim();
    if (!lowerCaseQuery) {
      return orderedTasks; // Usa o estado local ordenado
    }
    // Filtra a partir do estado local ordenado
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

  // --- Mutação para atualizar a ordem no backend ---
  const updateOrderMutation = api.task.updateOrder.useMutation({
    onMutate: async ({ orderedIds }) => {
      // Atualização Otimista
      await utils.task.getAll.cancel();
      const previousTasks = utils.task.getAll.getData();

      // Atualiza o cache com a nova ordem (baseada nos IDs)
      utils.task.getAll.setData(undefined, (oldData) => {
        if (!oldData) return [];
        // Cria um mapa para busca rápida
        const taskMap = new Map(oldData.map(task => [task.id, task]));
        // Remonta o array na nova ordem, pegando do mapa
        return orderedIds.map(id => taskMap.get(id)).filter(Boolean) as Task[];
      });

      return { previousTasks };
    },
    onError: (err, variables, context) => {
      // Rollback
      console.error("Failed to update order:", err);
      toast.error("Falha ao salvar a nova ordem."); // Exemplo com toast
      if (context?.previousTasks) {
        utils.task.getAll.setData(undefined, context.previousTasks);
        // Reverte o estado local também
        setOrderedTasks(context.previousTasks);
      }
    },
    onSettled: async () => {
      // Garante consistência final
      await utils.task.getAll.invalidate();
    },
  });

  // --- Handler para o fim do arraste (VERSÃO CORRIGIDA) ---
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      console.log("Drag ended: No move or invalid target.");
      return;
    }

    // 1. Calcula os índices antigo e novo
    const oldIndex = orderedTasks.findIndex((item) => item.id === active.id);
    const newIndex = orderedTasks.findIndex((item) => item.id === over.id);

    // 2. Calcula o novo array ordenado
    const newOrderedItems = arrayMove(orderedTasks, oldIndex, newIndex);

    // 3. Atualiza o estado local da UI PRIMEIRO
    setOrderedTasks(newOrderedItems);

    // 4. Prepara os IDs na nova ordem
    const orderedIds = newOrderedItems.map(item => item.id);

    // 5. Chama a mutação DEPOIS de atualizar o estado local
    updateOrderMutation.mutate({ orderedIds });
  }

  // Lógica de Renderização da Lista (agora baseada em currentTasks e filteredTasks)
  let listContent;
  if (tasksQuery.isLoading && !tasksQuery.data) { /* ... loading ... */ }
  else if (currentTasks.length === 0) { /* ... nenhuma tarefa ... */ }
  else if (filteredTasks.length === 0 && searchQuery) { /* ... busca sem resultado ... */ }
  else {
    listContent = (
      // --- Envolver a lista com os contextos do dnd-kit ---
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter} // Estratégia de detecção
        onDragEnd={handleDragEnd}         // Função chamada ao soltar
      >
        {/* Passa os itens (com IDs) para o SortableContext */}
        <SortableContext
          items={filteredTasks.map(task => task.id)} // Passa apenas os IDs dos itens filtrados
          strategy={verticalListSortingStrategy} // Estratégia de ordenação
        >
          <ul className="list-none p-0">
            {/* Mapeia os filteredTasks (que vêm do estado local ordenado) */}
            {filteredTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      // ----------------------------------------------------
    );
  }

  return (
    <div className="w-full max-w-2xl">
      {/* Container para Botão e Busca */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Botão Criar Tarefa */}
        <Link href="/createtask">
          <button className="w-full sm:w-auto rounded bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 whitespace-nowrap">
            Criar Nova Tarefa
          </button>
        </Link>

        {/* Input de Busca */}
        <input
          type="text"
          placeholder="Pesquisar tarefa..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-auto flex-grow rounded border border-gray-300 px-3 py-2 text-black dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      {/* Lista de Tarefas */}
      <h2 className="mb-4 text-2xl font-semibold text-center text-gray-800 dark:text-slate-100">Tarefas</h2>
      {tasksQuery.error && <p className="text-center text-red-500">Erro ao carregar tarefas: {tasksQuery.error.message}</p>}
      {listContent}
    </div>
  );
}
