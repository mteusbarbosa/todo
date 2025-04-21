import { CheckIcon, XMarkIcon } from '@heroicons/react/16/solid';
import toast from 'react-hot-toast';

export default function DeleteConfirmation({
    taskId,
    taskTitle,
    onConfirm,
    onCancel,
    isMutating,
    toastId
}: Readonly<{
    taskId: number;
    taskTitle: string;
    onConfirm: (id: number) => void;
    onCancel: () => void;
    isMutating: boolean;
    toastId: string;
}>) {
    const handleConfirm = () => {
        onConfirm(taskId);
        toast.dismiss(toastId);
    };

    const handleCancel = () => {
        onCancel();
        toast.dismiss(toastId);
    };

    return (
        <div className="flex items-center justify-between space-x-3 rounded bg-white dark:bg-slate-800 p-4 shadow-lg border border-gray-200 ">
            <p className="text-sm text-gray-700 dark:text-white">
                {`Excluir "${taskTitle}"?`}
            </p>
            <div className="flex space-x-2">

                <button
                    onClick={handleConfirm}
                    title="Confirmar Exclusão"
                    disabled={isMutating}
                    className="flex items-center justify-center h-7 w-7 rounded-full bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors disabled:opacity-50"
                >
                    <CheckIcon className="h-4 w-4" />
                </button>

                <button
                    onClick={handleCancel}
                    title="Cancelar"
                    disabled={isMutating}
                    className="flex items-center justify-center h-7 w-7 rounded-full bg-gray-500 text-white hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 transition-colors disabled:opacity-50"
                >
                    <XMarkIcon className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}