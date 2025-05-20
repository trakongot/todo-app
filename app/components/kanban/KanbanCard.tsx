'use client';

import { formatDate } from '@/app/utils/helper';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAppSelector } from '../../hooks/redux';
import { Card, Label } from '../../store/kanbanSlice';

interface KanbanCardProps {
  card: Card;
  onClick: () => void;
  onDelete: () => void;
}

export default function KanbanCard({
  card,
  onClick,
  onDelete,
}: KanbanCardProps) {
  const labels = useAppSelector((state) => state.kanban.labels);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Calculate completion percentage for checklists
  const calculateProgress = () => {
    const allItems = card.checklists.flatMap((cl) => cl.items);
    if (allItems.length === 0) return null;

    const completedItems = allItems.filter((item) => item.completed).length;
    return Math.round((completedItems / allItems.length) * 100);
  };

  const progress = calculateProgress();

  const cardLabels = card.labels
    .map((id) => labels.find((label) => label.id === id))
    .filter((label): label is Label => Boolean(label));

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  // Check if card is overdue
  const isOverdue =
    card.dueDate && !card.completed && new Date(card.dueDate) < new Date();

  // Check if card is due soon (within 2 days)
  const isDueSoon =
    card.dueDate &&
    !card.completed &&
    !isOverdue &&
    new Date(card.dueDate) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

  // Card content preview (first 60 characters of description)
  const descriptionPreview =
    card.description && card.description.length > 0
      ? card.description.slice(0, 60) +
        (card.description.length > 60 ? '...' : '')
      : null;

  // Get the priority badge color
  const getPriorityBadge = () => {
    if (!card.priority) return null;

    const priorityColors = {
      low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      medium:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };

    const priorityLabels = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
    };

    return (
      <div
        className={`text-xs rounded px-2 py-1 font-medium ${
          priorityColors[card.priority]
        }`}
      >
        {priorityLabels[card.priority]}
      </div>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`group bg-white dark:bg-gray-800 rounded-md shadow p-3 mb-2 cursor-pointer hover:shadow-md transition-all relative ${
        card.completed
          ? 'border-l-4 border-green-500'
          : isOverdue
          ? 'border-l-4 border-red-500'
          : isDueSoon
          ? 'border-l-4 border-yellow-500'
          : ''
      }`}
    >
      <button
        onClick={handleDeleteClick}
        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
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

      {/* Status badge */}
      <div className="flex justify-between items-start mb-2">
        {cardLabels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {cardLabels.map((label) => (
              <span
                key={label.id}
                className="inline-block h-2 w-6 rounded-sm"
                style={{ backgroundColor: label.color }}
                title={label.name}
              />
            ))}
          </div>
        )}

        {card.completed && (
          <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs rounded-full px-2 py-0.5 font-medium ml-auto">
            Completed
          </span>
        )}
      </div>

      <h3 className="font-medium text-gray-800 dark:text-white mb-2 pr-6">
        {card.title}
      </h3>

      {descriptionPreview && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
          {descriptionPreview}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mt-2">
        {getPriorityBadge()}

        {card.dueDate && (
          <div
            className={`flex items-center text-xs ${
              card.completed
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                : isOverdue
                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                : isDueSoon
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                : 'bg-gray-100 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300'
            } rounded px-2 py-1`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {formatDate(card.dueDate)}
          </div>
        )}
      </div>

      {progress !== null && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${
                progress === 100
                  ? 'bg-green-500'
                  : progress > 50
                  ? 'bg-blue-500'
                  : 'bg-yellow-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-3 mt-3 text-gray-500 dark:text-gray-400 text-xs">
        {card.comments.length > 0 && (
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            {card.comments.length}
          </div>
        )}

        {card.attachments.length > 0 && (
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
            {card.attachments.length}
          </div>
        )}

        {card.checklists.length > 0 && (
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            {
              card.checklists
                .flatMap((cl) => cl.items)
                .filter((item) => item.completed).length
            }
            /{card.checklists.flatMap((cl) => cl.items).length}
          </div>
        )}
      </div>
    </div>
  );
}
