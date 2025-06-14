import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Category } from '../types';

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onDeleteCategory: (categoryId: string) => void;
  onEditCategory: (categoryId: string, updated: { name: string; color: string }) => void;
  onClose: () => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  onAddCategory,
  onDeleteCategory,
  onEditCategory,
  onClose
}) => {
  const [newCategory, setNewCategory] = useState({ name: '', color: '#FFD700' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ name: string; color: string }>({ name: '', color: '#FFD700' });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.name.trim()) {
      // Save category color to localStorage
      localStorage.setItem(`category_color_${newCategory.name}`, newCategory.color);
      onAddCategory(newCategory);
      setNewCategory({ name: '', color: '#FFD700' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-dark-secondary w-full sm:rounded-xl sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-dark-secondary p-4 border-b border-dark-tertiary flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gold-primary">Gerenciar Categorias</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gold-primary rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Nova categoria"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-3 focus:ring-2 focus:ring-gold-primary focus:border-transparent text-base"
                />
              </div>
              <div className="flex gap-2">
                <div className="w-20">
                  <input
                    type="color"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full h-[46px] rounded-lg bg-dark-tertiary border-dark-tertiary p-1 cursor-pointer"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-gold-primary text-dark-primary px-4 rounded-lg hover:bg-gold-hover transition-colors"
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>
          </form>

          <div className="space-y-2 max-h-[calc(90vh-240px)] overflow-y-auto">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 rounded-lg hover:bg-dark-tertiary transition-colors"
              >
                {editingId === category.id ? (
                  <form
                    className="flex items-center gap-3 flex-1"
                    onSubmit={e => {
                      e.preventDefault();
                      localStorage.setItem(`category_color_${editValues.name}`, editValues.color);
                      onEditCategory(category.id, editValues);
                      setEditingId(null);
                    }}
                  >
                    <input
                      type="text"
                      value={editValues.name}
                      onChange={e => setEditValues(v => ({ ...v, name: e.target.value }))}
                      className="w-32 rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-2 text-base"
                      required
                    />
                    <input
                      type="color"
                      value={editValues.color}
                      onChange={e => setEditValues(v => ({ ...v, color: e.target.value }))}
                      className="w-8 h-8 rounded-lg bg-dark-tertiary border-dark-tertiary p-1 cursor-pointer"
                    />
                    <button type="submit" className="bg-gold-primary text-dark-primary px-3 py-1 rounded-lg hover:bg-gold-hover transition-colors text-sm font-semibold">Salvar</button>
                    <button type="button" onClick={() => setEditingId(null)} className="ml-1 text-gray-400 hover:text-red-400 text-sm">Cancelar</button>
                  </form>
                ) : (
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium text-gray-200 text-base">{category.name}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  {editingId !== category.id && (
                    <button
                      onClick={() => {
                        setEditingId(category.id);
                        setEditValues({ name: category.name, color: category.color });
                      }}
                      className="text-gold-primary hover:text-gold-hover p-2 rounded-lg"
                      title="Editar categoria"
                    >
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.65 4.35l3 3a1 1 0 0 1 0 1.41l-7.29 7.29a1 1 0 0 1-.7.29H5a1 1 0 0 1-1-1v-2.17a1 1 0 0 1 .29-.7l7.29-7.29a1 1 0 0 1 1.41 0z"/><path d="M15 6l-3-3"/></svg>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      localStorage.removeItem(`category_color_${category.name}`);
                      onDeleteCategory(category.id);
                    }}
                    className="text-red-400 hover:text-red-300 p-2 rounded-lg"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};