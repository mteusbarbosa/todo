"use client";

import { useState, useEffect } from 'react';
import { api } from '~/trpc/react'; // Para usar a mutação de criar categoria

// Tipo para os dados da tarefa que o formulário manipula
export interface TaskFormData {
    title: string;
    description: string;
    categoryId?: number | null; // ID da categoria selecionada
}

// Tipo para uma categoria individual (para o select)
interface Category {
    id: number;
    name: string;
}

// Props esperadas pelo componente TaskForm
interface TaskFormProps {
    initialData?: TaskFormData; // Dados iniciais para preencher (modo edição)
    onSubmit: (data: TaskFormData, newCategoryName?: string) => void; // Função chamada no submit
    isLoading: boolean; // Indica se alguma operação (submit, etc.) está em andamento
    submitButtonText: string; // Texto do botão de submit (ex: "Criar Tarefa", "Salvar Alterações")
    availableCategories: Category[]; // Lista de categorias existentes
    isCategoryLoading: boolean; // Indica se as categorias estão carregando
    categoryError?: string | null; // Mensagem de erro ao carregar categorias
    // Opcional: Se quiser que o TaskForm crie a categoria diretamente
    // onCategoryCreate?: (name: string) => Promise<Category | null>;
}

// Valor especial para a opção de criar categoria no select
const CREATE_NEW_CATEGORY_VALUE = "__CREATE_NEW__";

// Helper function para normalizar o nome da categoria
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
}: TaskFormProps) {
    // Estados internos do formulário
    const [title, setTitle] = useState(initialData?.title ?? "");
    const [description, setDescription] = useState(initialData?.description ?? "");
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(
        initialData?.categoryId ? Number(initialData.categoryId) : undefined
    );
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [formError, setFormError] = useState<string | null>(null);

    // Efeito para resetar o formulário se initialData mudar (útil em edição)
    useEffect(() => {
        setTitle(initialData?.title ?? "");
        setDescription(initialData?.description ?? "");
        setSelectedCategoryId(initialData?.categoryId ? Number(initialData.categoryId) : undefined);
        setShowNewCategoryInput(false); // Reseta a criação de categoria
        setNewCategoryName("");
        setFormError(null); // Limpa erros ao carregar novos dados
    }, [initialData]); // Executa quando initialData muda

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
        setFormError(null); // Limpa erro ao mudar seleção
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setFormError(null); // Limpa erros anteriores

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
            // Passa o nome normalizado para o componente pai lidar com a criação
            onSubmit({ title: finalTitle, description: finalDescription }, categoryNameToCreate);
        } else {
            // Passa os dados normais e o ID selecionado (ou undefined)
            onSubmit({ title: finalTitle, description: finalDescription, categoryId: selectedCategoryId });
        }
    };

    // Define se o botão de submit pode ser habilitado
    const canSubmit = title.trim() && description.trim() && !isLoading && (!showNewCategoryInput || newCategoryName.trim());

    return (
        // Mantendo a estrutura e classes do form original
        <form onSubmit={handleSubmit} className="w-full max-w-lg flex flex-col gap-4">

            {/* Campo Título */}
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Título <span className="text-red-500">*</span>
                </label>
                <input
                    id="title"
                    type="text"
                    placeholder="Ex: Comprar leite"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-70"
                    disabled={isLoading}
                    required
                />
            </div>

            {/* Campo Descrição */}
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição <span className="text-red-500">*</span>
                </label>
                <textarea
                    id="description"
                    placeholder="Ex: Ir ao mercado e comprar leite integral."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-70"
                    rows={4}
                    disabled={isLoading}
                    required
                />
            </div>

            {/* Campo Categoria (Select) */}
            <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                </label>
                {/* Feedback de carregamento/erro */}
                {isCategoryLoading && <p className="text-sm text-gray-500">Carregando categorias...</p>}
                {categoryError && <p className="text-sm text-red-500">Erro ao buscar categorias: {categoryError}</p>}

                {/* Renderiza o select apenas se não estiver carregando e não houver erro */}
                {!isCategoryLoading && !categoryError && (
                    <select
                        id="category"
                        value={showNewCategoryInput ? CREATE_NEW_CATEGORY_VALUE : (selectedCategoryId ?? "")}
                        onChange={handleCategoryChange}
                        className="w-full rounded border border-gray-300 px-3 py-2 text-black bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-70"
                        disabled={isLoading}
                    >
                        <option value="">-- Nenhuma --</option>
                        {availableCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                        <option value={CREATE_NEW_CATEGORY_VALUE}>
                            -- Criar nova categoria --
                        </option>
                    </select>
                )}
                {/* Mensagem se não houver categorias */}
                {!isCategoryLoading && !categoryError && availableCategories.length === 0 && !showNewCategoryInput && (
                    <p className="text-sm text-gray-500 mt-1">Nenhuma categoria encontrada.</p>
                )}
            </div>

            {/* Input para nova categoria (condicional) */}
            {showNewCategoryInput && (
                <div>
                    <label htmlFor="newCategoryName" className="block text-sm font-medium text-gray-700 mb-1">
                        Nome da Nova Categoria <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="newCategoryName"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        required={showNewCategoryInput}
                        className="w-full rounded border border-gray-300 px-3 py-2 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-70"
                        placeholder="Digite o nome da nova categoria"
                        disabled={isLoading}
                    />
                </div>
            )}

            {/* Exibição de Erros do Formulário */}
            {formError && (
                <p className="mt-2 text-sm text-red-600">{formError}</p>
            )}

            {/* Botão de Submissão */}
            <button
                type="submit"
                className="mt-2 rounded bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!canSubmit || isLoading}
            >
                {isLoading ? 'Salvando...' : submitButtonText}
            </button>
        </form>
    );
}