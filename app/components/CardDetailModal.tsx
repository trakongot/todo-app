'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { Card, updateCard } from '../store/kanbanSlice';
import { formatDate } from '../utils/helper';

interface CardDetailModalProps {
  card: Card;
  boardId: string;
  listId: string;
  onClose: () => void;
}

export default function CardDetailModal({
  card,
  boardId,
  listId,
  onClose,
}: CardDetailModalProps) {
  const dispatch = useAppDispatch();
  const labels = useAppSelector((state) => state.kanban.labels);

  const [description, setDescription] = useState(card.description);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [dueDate, setDueDate] = useState(card.dueDate || '');
  const [startDate, setStartDate] = useState(card.startDate || '');
  const [priority, setPriority] = useState<
    'low' | 'medium' | 'high' | '' | null
  >(card.priority || '');

  const handleSaveDescription = () => {
    dispatch(
      updateCard({
        boardId,
        listId,
        cardId: card.id,
        updates: { description },
      }),
    );
    setIsEditingDescription(false);
  };

  const handleSaveDates = () => {
    dispatch(
      updateCard({
        boardId,
        listId,
        cardId: card.id,
        updates: {
          dueDate: dueDate || null,
          startDate: startDate || null,
        },
      }),
    );
  };

  const handleSavePriority = () => {
    dispatch(
      updateCard({
        boardId,
        listId,
        cardId: card.id,
        updates: {
          priority: priority as 'low' | 'medium' | 'high' | null,
        },
      }),
    );
  };

  const handleToggleComplete = () => {
    dispatch(
      updateCard({
        boardId,
        listId,
        cardId: card.id,
        updates: { completed: !card.completed },
      }),
    );
  };

  const cardLabels = card.labels
    .map((id) => labels.find((label) => label.id === id))
    .filter(Boolean);

  // Calculate checklist progress
  const calculateProgress = () => {
    const allItems = card.checklists.flatMap((cl) => cl.items);
    if (allItems.length === 0) return null;

    const completedItems = allItems.filter((item) => item.completed).length;
    return {
      percentage: Math.round((completedItems / allItems.length) * 100),
      completed: completedItems,
      total: allItems.length,
    };
  };

  const progress = calculateProgress();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 w-full max-w-xl h-full p-6 overflow-y-auto animate-slide-in-right">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {card.title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
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

        <div className="mb-6">
          <div className="flex space-x-3 mb-2">
            <button
              onClick={handleToggleComplete}
              className={`px-3 py-1 rounded text-sm font-medium ${
                card.completed
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {card.completed ? 'Đã hoàn thành' : 'Đang thực hiện'}
            </button>

            <div className="flex items-center">
              <select
                value={priority || ''}
                onChange={(e) => {
                  setPriority(
                    e.target.value === ''
                      ? null
                      : (e.target.value as 'low' | 'medium' | 'high'),
                  );
                  handleSavePriority();
                }}
                className="p-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm"
              >
                <option value="">Mức độ ưu tiên</option>
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
              </select>
            </div>
          </div>

          {cardLabels.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {cardLabels.map(
                (label) =>
                  label && (
                    <span
                      key={label.id}
                      className="px-2 py-1 rounded-full text-xs text-white"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.name}
                    </span>
                  ),
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                value={startDate ? startDate.split('T')[0] : ''}
                onChange={(e) => {
                  setStartDate(
                    e.target.value
                      ? new Date(e.target.value).toISOString()
                      : '',
                  );
                  handleSaveDates();
                }}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hạn hoàn thành
              </label>
              <input
                type="date"
                value={dueDate ? dueDate.split('T')[0] : ''}
                onChange={(e) => {
                  setDueDate(
                    e.target.value
                      ? new Date(e.target.value).toISOString()
                      : '',
                  );
                  handleSaveDates();
                }}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Mô tả
          </h3>
          {isEditingDescription ? (
            <div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 min-h-[100px]"
                placeholder="Thêm mô tả chi tiết..."
              />
              <div className="flex mt-2">
                <button
                  onClick={handleSaveDescription}
                  className="px-3 py-1 bg-blue-600 text-white rounded mr-2"
                >
                  Lưu
                </button>
                <button
                  onClick={() => {
                    setDescription(card.description);
                    setIsEditingDescription(false);
                  }}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setIsEditingDescription(true)}
              className="p-3 bg-gray-50 dark:bg-gray-700 rounded min-h-[60px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              {card.description ? (
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {card.description}
                </p>
              ) : (
                <p className="text-gray-400 dark:text-gray-500">
                  Thêm mô tả chi tiết...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Checklists summary */}
        {card.checklists.length > 0 && progress && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Danh sách kiểm tra
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
              <div className="mb-2">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>Tiến độ chung</span>
                  <span>
                    {progress.completed}/{progress.total} ({progress.percentage}
                    %)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>

              {card.checklists.map((checklist) => (
                <div key={checklist.id} className="mt-3">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">
                    {checklist.title}
                  </h4>
                  <ul className="mt-1 space-y-1">
                    {checklist.items.map((item) => (
                      <li key={item.id} className="flex items-center">
                        <span
                          className={`text-sm ${
                            item.completed
                              ? 'line-through text-gray-400 dark:text-gray-500'
                              : 'text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          {item.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments summary */}
        {card.comments.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Bình luận ({card.comments.length})
            </h3>
            <div className="space-y-3">
              {card.comments.slice(0, 3).map((comment) => (
                <div
                  key={comment.id}
                  className="bg-gray-50 dark:bg-gray-700 p-3 rounded"
                >
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span>Bạn</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(comment.createdAt)}
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    {comment.text}
                  </p>
                </div>
              ))}
              {card.comments.length > 3 && (
                <p className="text-center text-sm text-blue-600 dark:text-blue-400">
                  + {card.comments.length - 3} bình luận khác
                </p>
              )}
            </div>
          </div>
        )}

        {/* Attachments summary */}
        {card.attachments.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Tệp đính kèm ({card.attachments.length})
            </h3>
            <div className="space-y-2">
              {card.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center p-2 bg-gray-50 dark:bg-gray-700 rounded"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-700 dark:text-gray-300">
                      {attachment.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(attachment.createdAt)}
                    </div>
                  </div>
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Mở
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tạo lúc: {formatDate(card.createdAt)}
            {card.updatedAt && card.updatedAt !== card.createdAt && (
              <span> | Cập nhật lúc: {formatDate(card.updatedAt)}</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
