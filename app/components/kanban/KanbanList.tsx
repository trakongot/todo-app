'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useState } from 'react';
import { useAppDispatch } from '../../hooks/redux';
import { Card, List, addCard } from '../../store/kanbanSlice';
import KanbanCard from './KanbanCard';

interface KanbanListProps {
  list: List;
  boardId: string;
  onCardClick: (card: Card, listId: string) => void;
  onDeleteCard: (cardId: string, listId: string) => void;
}

export default function KanbanList({
  list,
  boardId,
  onCardClick,
  onDeleteCard,
}: KanbanListProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const dispatch = useAppDispatch();

  const { setNodeRef } = useDroppable({
    id: list.id,
  });

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      dispatch(
        addCard({
          boardId,
          listId: list.id,
          title: newCardTitle.trim(),
        }),
      );
      setNewCardTitle('');
      setIsAddingCard(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCard();
    } else if (e.key === 'Escape') {
      setIsAddingCard(false);
      setNewCardTitle('');
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-md shadow p-3 min-w-[280px] w-full md:w-auto flex flex-col max-h-[calc(100vh-150px)]">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200">
          {list.title}
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-0.5">
          {list.cards.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto min-h-[200px] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
      >
        <SortableContext
          items={list.cards.map((card) => card.id)}
          strategy={verticalListSortingStrategy}
        >
          {list.cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              onClick={() => onCardClick(card, list.id)}
              onDelete={() => onDeleteCard(card.id, list.id)}
            />
          ))}
        </SortableContext>
      </div>

      {isAddingCard ? (
        <div className="mt-2">
          <textarea
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter card title..."
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            autoFocus
          />
          <div className="flex items-center mt-2">
            <button
              onClick={handleAddCard}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded mr-2"
              disabled={!newCardTitle.trim()}
            >
              Add Card
            </button>
            <button
              onClick={() => {
                setIsAddingCard(false);
                setNewCardTitle('');
              }}
              className="text-gray-500 dark:text-gray-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingCard(true)}
          className="mt-2 flex items-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 p-2 rounded w-full"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Card
        </button>
      )}
    </div>
  );
}
