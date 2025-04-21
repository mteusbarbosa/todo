import { api } from "~/trpc/server";
import { TaskListWithSearch } from "./_components/TaskListWithSearch";
import { ThemeSwitcher } from "./_components/ThemeSwitcher";


export default async function Home() {
  const tasks = await api.task.getAll();

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-24">
      <div className="absolute top-6 right-6 z-10">
        <ThemeSwitcher />
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold">Todo List</h1>
      </div>

      <TaskListWithSearch initialTasks={tasks} />
    </main>
  );
}
