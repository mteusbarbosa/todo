"use client";

import { useEffect, useState } from 'react';
export interface TaskFormData {
    title: string;
    description: string;
    categoryId?: number | null;
}

interface Category {
    id: number;
    name: string;
}

interface TaskFormProps {
    initialData?: TaskFormData;
    onSubmit: (data: TaskFormData, newCategoryName?: string) => void;
    isLoading: boolean;
    submitButtonText: string;
    availableCategories: Category[];
    isCategoryLoading: boolean;
    categoryError?: string | null;
}

const CREATE_NEW_CATEGORY_VALUE = "__CREATE_NEW__";

const normalizeCategoryName = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return "";
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

export function TaskForm({
    initialData,
    onSubmit,
    isLoading,
    submitButtonText,
    availableCategories,
    isCategoryLoading,
    categoryError,
}: Readonly<TaskFormProps>) {

    const [title, setTitle] = useState(initialData?.title ?? "");
    const [description, setDescription] = useState(initialData?.description ?? "");
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(
        initialData?.categoryId ? Number(initialData.categoryId) : undefined
    );
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        setTitle(initialData?.title ?? "");
        setDescription(initialData?.description ?? "");
        setSelectedCategoryId(initialData?.categoryId ? Number(initialData.categoryId) : undefined);
        setShowNewCategoryInput(false);
        setNewCategoryName("");
        setFormError(null);
    }, [initialData]);

    const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;
        if (value === CREATE_NEW_CATEGORY_VALUE) {
            setSelectedCategoryId(undefined);
            setShowNewCategoryInput(true);
        } else {
            setShowNewCategoryInput(false);
            setNewCategoryName("");
            setSelectedCategoryId(value ? parseInt(value, 10) : undefined);
        }
        setFormError(null);
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setFormError(null);

        const finalTitle = title.trim();
        const finalDescription = description.trim();

        if (!finalTitle || !finalDescription) {
            setFormError("Por favor, preencha o título e a descrição.");
            return;
        }

        let categoryNameToCreate: string | undefined = undefined;

        if (showNewCategoryInput) {
            const trimmedNewCategoryName = newCategoryName.trim();
            if (!trimmedNewCategoryName) {
                setFormError("Por favor, digite o nome da nova categoria.");
                return;
            }
            const normalizedName = normalizeCategoryName(trimmedNewCategoryName);
            if (!normalizedName) {
                setFormError("Nome da categoria inválido.");
                return;
            }
            categoryNameToCreate = normalizedName;
            onSubmit({ title: finalTitle, description: finalDescription }, categoryNameToCreate);
        } else {
            onSubmit({ title: finalTitle, description: finalDescription, categoryId: selectedCategoryId });
        }
    };

    const canSubmit = title.trim() && description.trim() && !isLoading && (!showNewCategoryInput || newCategoryName.trim());

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-lg flex flex-col gap-4">
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Título <span className="text-red-500">*</span>
                </label>
                <input
                    id="title"
                    type="text"
                    placeholder="Ex: Comprar leite"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 text-black dark:text-white bg-white dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:focus:border-blue-500 dark:focus:ring-blue-500 disabled:opacity-70"
                    disabled={isLoading}
                    required
                />
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descrição <span className="text-red-500">*</span>
                </label>
                <textarea
                    id="description"
                    placeholder="Ex: Ir ao mercado e comprar leite integral."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 text-black dark:text-white bg-white dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:focus:border-blue-500 dark:focus:ring-blue-500 disabled:opacity-70"
                    rows={4}
                    disabled={isLoading}
                    required
                />
            </div>

            <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Categoria
                </label>
                {isCategoryLoading && <p className="text-sm text-gray-500 dark:text-gray-400">Carregando categorias...</p>}
                {categoryError && <p className="text-sm text-red-500 dark:text-red-400">Erro ao buscar categorias: {categoryError}</p>}

                {!isCategoryLoading && !categoryError && (
                    <select
                        id="category"
                        value={showNewCategoryInput ? CREATE_NEW_CATEGORY_VALUE : (selectedCategoryId ?? "")}
                        onChange={handleCategoryChange}
                        className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 text-black dark:text-white bg-white dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:focus:border-blue-500 dark:focus:ring-blue-500 disabled:opacity-70"
                        disabled={isLoading}
                    >
                        <option value="">Nenhuma</option>
                        {availableCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                        <option value={CREATE_NEW_CATEGORY_VALUE}>
                            Criar nova categoria
                        </option>
                    </select>
                )}
                {!isCategoryLoading && !categoryError && availableCategories.length === 0 && !showNewCategoryInput && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Nenhuma categoria encontrada.</p>
                )}
            </div>

            {showNewCategoryInput && (
                <div>
                    <label htmlFor="newCategoryName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nome da Nova Categoria <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="newCategoryName"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        required={showNewCategoryInput}
                        className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 text-black dark:text-white bg-white dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:focus:border-blue-500 dark:focus:ring-blue-500 disabled:opacity-70"
                        placeholder="Digite o nome da nova categoria"
                        disabled={isLoading}
                    />
                </div>
            )}

            {formError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{formError}</p>
            )}

            <button
                type="submit"
                className="mt-2 rounded bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 dark:hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:disabled:bg-blue-800 dark:disabled:opacity-60"
                disabled={!canSubmit || isLoading}
            >
                {isLoading ? 'Salvando...' : submitButtonText}
            </button>
        </form>
    );
}