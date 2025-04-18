// src/app/_components/TaskListWithSearch.tsx
"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { api } from "~/trpc/react";
import type { api as serverApi } from "~/trpc/server";
import { TaskItem } from './TaskItem';

// Define o tipo esperado para a prop 'initialTasks'
type Task = Awaited<ReturnType<typeof serverApi.task.getAll>>[number];

interface TaskListWithSearchProps {
  initialTasks: Task[]; // Continua recebendo a lista inicial do servidor
}

export function TaskListWithSearch({ initialTasks }: TaskListWithSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // --- Modificação: Usar useQuery ---
  // Busca os dados no cliente, usando initialTasks como dados iniciais
  const tasksQuery = api.task.getAll.useQuery(
    undefined, // Input da query (se houver)
    {
      initialData: initialTasks, // Usa os dados do servidor como valor inicial
      refetchOnWindowFocus: false, // Opcional: evita refetch ao focar na janela
      staleTime: 60 * 1000, // Opcional: considera os dados "frescos" por 1 minuto
    }
  );
  // Usa os dados da query (tasksQuery.data) ou um array vazio se estiver carregando/erro
  const currentTasks = tasksQuery.data ?? [];
  // --- Fim da Modificação ---


  // Filtra as tarefas baseado na busca (agora usando currentTasks)
  const filteredTasks = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase().trim();
    if (!lowerCaseQuery) {
      return currentTasks; // Retorna todas se a busca estiver vazia
    }
    return currentTasks.filter(task =>
      task.title.toLowerCase().includes(lowerCaseQuery)
    );
  }, [currentTasks, searchQuery]); // Depende de currentTasks agora

  // Lógica de Renderização da Lista (agora baseada em currentTasks e filteredTasks)
  let listContent;
  if (tasksQuery.isLoading && !tasksQuery.data) { // Mostra loading inicial se não houver initialData
      listContent = <p className="text-center text-gray-500">Carregando tarefas...</p>;
  } else if (currentTasks.length === 0) {
    // Caso 1: Nenhuma tarefa cadastrada (após carregar)
    listContent = <p className="text-center text-gray-500">Nenhuma tarefa cadastrada ainda.</p>;
  } else if (filteredTasks.length === 0 && searchQuery) {
    // Caso 2: Existem tarefas, mas a busca não encontrou nenhuma
    listContent = <p className="text-center text-gray-500">{`Nenhuma tarefa encontrada para "${searchQuery}".`}</p>;
  } else {
    // Caso 3: Existem tarefas e a busca encontrou resultados (ou não houve busca)
    listContent = (
      <ul className="list-none p-0">
        {filteredTasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </ul>
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
          className="w-full sm:w-auto flex-grow rounded border border-gray-300 px-3 py-2 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      {/* Lista de Tarefas */}
      <h2 className="mb-4 text-2xl font-semibold text-gray-800">Tarefas</h2>
      {/* Renderiza o conteúdo determinado pela lógica acima */}
      {tasksQuery.error && <p className="text-center text-red-500">Erro ao carregar tarefas: {tasksQuery.error.message}</p>}
      {listContent}
    </div>
  );
}
