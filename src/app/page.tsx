
import { api } from "~/trpc/server";

import { TaskListWithSearch } from "./_components/TaskListWithSearch";

export default async function Home() {
  // Busca os dados no servidor (lista completa)
  const tasks = await api.task.getAll();

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-24">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold">Todo List</h1>
        <p className="text-xl">Suas tarefas pendentes e concluídas</p>
      </div>

      {/* Renderiza o componente cliente passando as tarefas iniciais */}
      <TaskListWithSearch initialTasks={tasks} />
    </main>
  );
}
