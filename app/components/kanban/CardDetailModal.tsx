'use client';

import { formatDate } from '@/app/utils/helper';
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { Card, Label, moveCard, updateCard } from '../../store/kanbanSlice';

interface CardDetailModalProps {
  card: Card;
  boardId: string;
  listId: string;
  onClose: () => void;
  onDelete: () => void;
}

export default function CardDetailModal({
  card: initialCard,
  boardId,
  listId,
  onClose,
}: CardDetailModalProps) {
  const [card, setCard] = useState<Card>({ ...initialCard });

  const dispatch = useAppDispatch();
  const labels = useAppSelector((state) => state.kanban.labels);
  const allLabels = useAppSelector((state) => state.kanban.labels);
  const currentBoard = useAppSelector((state) =>
    state.kanban.boards.find((board) => board.id === boardId),
  );

  // State for form fields
  const [description, setDescription] = useState(card.description);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [dueDate, setDueDate] = useState(card.dueDate || '');
  const [startDate, setStartDate] = useState(card.startDate || '');
  const [priority, setPriority] = useState<
    'low' | 'medium' | 'high' | '' | null
  >(card.priority || '');
  const [selectedLabels, setSelectedLabels] = useState<string[]>(
    card.labels || [],
  );
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isAddingAttachment, setIsAddingAttachment] = useState(false);
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [isManagingLabels, setIsManagingLabels] = useState(false);
  const [taskStatuses] = useState([
    { id: '1', label: 'To Do', color: 'blue' },
    { id: '2', label: 'In Progress', color: 'green' },
    { id: '3', label: 'Completed', color: 'green' },
  ]);

  const getInitialStatus = () => {
    if (card.completed) return '3';

    if (['1', '2', '3'].includes(listId)) {
      return listId;
    }

    return '3';
  };

  const [currentStatus, setCurrentStatus] = useState(getInitialStatus());

  useEffect(() => {
    setCard({ ...initialCard });
    setDescription(initialCard.description);
    setDueDate(initialCard.dueDate || '');
    setStartDate(initialCard.startDate || '');
    setPriority(initialCard.priority || '');
    setSelectedLabels(initialCard.labels || []);

    if (initialCard.completed) {
      setCurrentStatus('3');
    } else if (currentStatus === '3') {
      setCurrentStatus('3');
    }
  }, [currentStatus, initialCard]);

  const handleSaveDescription = () => {
    const updatedCard = { ...card, description };
    setCard(updatedCard);

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
    const updates = {
      dueDate: dueDate || null,
      startDate: startDate || null,
    };

    const updatedCard = {
      ...card,
      ...updates,
    };
    setCard(updatedCard);

    dispatch(
      updateCard({
        boardId,
        listId,
        cardId: card.id,
        updates,
      }),
    );
  };

  const handleSavePriority = (
    newPriority: 'low' | 'medium' | 'high' | null,
  ) => {
    const updatedCard = { ...card, priority: newPriority };
    setCard(updatedCard);
    setPriority(newPriority);

    dispatch(
      updateCard({
        boardId,
        listId,
        cardId: card.id,
        updates: {
          priority: newPriority,
        },
      }),
    );
  };

  const handleChangeStatus = (statusId: string) => {
    setCurrentStatus(statusId);
    const isCompleted = statusId === '3'; // ID 3 is "Completed"

    // Update local state first
    const updatedCard = { ...card, completed: isCompleted };
    setCard(updatedCard);

    // First dispatch the status update to Redux
    dispatch(
      updateCard({
        boardId,
        listId,
        cardId: card.id,
        updates: { completed: isCompleted },
      }),
    );

    // Move card to appropriate list based on status
    if (currentBoard) {
      // Determine the destination list ID directly from statusId
      // Since our list IDs match our status IDs (1, 2, 3), we can use the statusId directly
      const destinationListId = statusId;

      // Only move if destination list is different from current list and valid
      if (destinationListId && destinationListId !== listId) {
        // Get the destination list
        const destList = currentBoard.lists.find(
          (list) => list.id === destinationListId,
        );

        // Move to the end of destination list
        if (destList) {
          dispatch(
            moveCard({
              boardId,
              sourceListId: listId,
              destinationListId,
              destinationIndex: destList.cards.length,
              cardId: card.id,
            }),
          );

          // Close the modal after moving the card
          onClose();
        }
      }
    }
  };

  const handleToggleLabel = (labelId: string) => {
    const newLabels = selectedLabels.includes(labelId)
      ? selectedLabels.filter((id) => id !== labelId)
      : [...selectedLabels, labelId];

    setSelectedLabels(newLabels);

    const updatedCard = { ...card, labels: newLabels };
    setCard(updatedCard);

    dispatch(
      updateCard({
        boardId,
        listId,
        cardId: card.id,
        updates: {
          labels: newLabels,
        },
      }),
    );
  };

  const handleAddComment = () => {
    if (commentText.trim()) {
      const newComment = {
        id: `comment-${Date.now()}`,
        text: commentText.trim(),
        createdAt: new Date().toISOString(),
      };

      const updatedComments = [...card.comments, newComment];

      const updatedCard = { ...card, comments: updatedComments };
      setCard(updatedCard);

      dispatch(
        updateCard({
          boardId,
          listId,
          cardId: card.id,
          updates: {
            comments: updatedComments,
          },
        }),
      );

      setCommentText('');
      setIsAddingComment(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    const updatedComments = card.comments.filter(
      (comment) => comment.id !== commentId,
    );

    const updatedCard = { ...card, comments: updatedComments };
    setCard(updatedCard);

    dispatch(
      updateCard({
        boardId,
        listId,
        cardId: card.id,
        updates: {
          comments: updatedComments,
        },
      }),
    );
  };

  const handleAddAttachment = () => {
    if (attachmentName.trim() && attachmentUrl.trim()) {
      const newAttachment = {
        id: `attachment-${Date.now()}`,
        name: attachmentName.trim(),
        url: attachmentUrl.trim(),
        type: attachmentUrl.match(/\.(jpg|jpeg|png|gif)$/i)
          ? ('image' as const)
          : ('link' as const),
        createdAt: new Date().toISOString(),
      };

      const updatedAttachments = [...card.attachments, newAttachment];

      const updatedCard = { ...card, attachments: updatedAttachments };
      setCard(updatedCard);

      dispatch(
        updateCard({
          boardId,
          listId,
          cardId: card.id,
          updates: {
            attachments: updatedAttachments,
          },
        }),
      );

      setAttachmentName('');
      setAttachmentUrl('');
      setIsAddingAttachment(false);
    }
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    const updatedAttachments = card.attachments.filter(
      (attachment) => attachment.id !== attachmentId,
    );

    const updatedCard = { ...card, attachments: updatedAttachments };
    setCard(updatedCard);

    dispatch(
      updateCard({
        boardId,
        listId,
        cardId: card.id,
        updates: {
          attachments: updatedAttachments,
        },
      }),
    );
  };

  const handleToggleChecklistItem = (
    checklistId: string,
    itemId: string,
    completed: boolean,
  ) => {
    const updatedChecklists = card.checklists.map((checklist) => {
      if (checklist.id === checklistId) {
        return {
          ...checklist,
          items: checklist.items.map((item) => {
            if (item.id === itemId) {
              return { ...item, completed: !completed };
            }
            return item;
          }),
        };
      }
      return checklist;
    });

    const updatedCard = { ...card, checklists: updatedChecklists };
    setCard(updatedCard);

    dispatch(
      updateCard({
        boardId,
        listId,
        cardId: card.id,
        updates: {
          checklists: updatedChecklists,
        },
      }),
    );
  };

  const cardLabels = card.labels
    .map((id) => labels.find((label) => label.id === id))
    .filter((label): label is Label => Boolean(label));

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
          <div className="flex flex-wrap gap-2 mb-3">
            <div className="flex flex-col space-y-1 w-full">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {taskStatuses.map((status) => (
                  <button
                    key={status.id}
                    onClick={() => handleChangeStatus(status.id)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      currentStatus === status.id
                        ? `bg-${status.color}-100 dark:bg-${status.color}-900/30 text-${status.color}-800 dark:text-${status.color}-300 ring-2 ring-${status.color}-500`
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center w-full mt-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                Priority:
              </label>
              <select
                value={priority || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  handleSavePriority(
                    value === '' ? null : (value as 'low' | 'medium' | 'high'),
                  );
                }}
                className="p-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm"
              >
                <option value="">None</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <button
              onClick={() => setIsManagingLabels(!isManagingLabels)}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-sm rounded w-full mt-2"
            >
              {isManagingLabels ? 'Close Labels' : 'Manage Labels'}
            </button>
          </div>

          {isManagingLabels && (
            <div className="mb-4 bg-gray-50 dark:bg-gray-700/50 p-3 rounded">
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                Labels
              </h4>
              <div className="flex flex-wrap gap-2">
                {allLabels.map((label) => (
                  <button
                    key={label.id}
                    onClick={() => handleToggleLabel(label.id)}
                    className={`px-2 py-1 rounded-full text-xs text-white flex items-center ${
                      selectedLabels.includes(label.id)
                        ? 'ring-2 ring-offset-2 ring-blue-500'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                    {selectedLabels.includes(label.id) && (
                      <svg
                        className="h-3 w-3 ml-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {cardLabels.length > 0 && !isManagingLabels && (
            <div className="flex flex-wrap gap-2 mb-4">
              {cardLabels.map((label) => (
                <span
                  key={label.id}
                  className="px-2 py-1 rounded-full text-xs text-white"
                  style={{ backgroundColor: label.color }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
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
                }}
                onBlur={handleSaveDates}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date
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
                }}
                onBlur={handleSaveDates}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Description
          </h3>
          {isEditingDescription ? (
            <div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 min-h-[100px]"
                placeholder="Add detailed description..."
              />
              <div className="flex mt-2">
                <button
                  onClick={handleSaveDescription}
                  className="px-3 py-1 bg-blue-600 text-white rounded mr-2"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setDescription(card.description);
                    setIsEditingDescription(false);
                  }}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setIsEditingDescription(true)}
              className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded min-h-[100px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {description ? (
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {description}
                </p>
              ) : (
                <p className="text-gray-400 dark:text-gray-500">
                  Add a detailed description...
                </p>
              )}
            </div>
          )}
        </div>

        {card.checklists.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Checklists
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded">
              {progress && (
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Progress: {progress.percentage}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {progress.completed}/{progress.total} items
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {card.checklists.map((checklist) => (
                <div key={checklist.id} className="mt-3">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {checklist.title}
                  </h4>
                  <ul className="space-y-2">
                    {checklist.items.map((item) => (
                      <li key={item.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() =>
                            handleToggleChecklistItem(
                              checklist.id,
                              item.id,
                              item.completed,
                            )
                          }
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-2"
                        />
                        <span
                          className={`text-sm ${
                            item.completed
                              ? 'line-through text-gray-400 dark:text-gray-500'
                              : 'text-gray-700 dark:text-gray-300'
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

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              Attachments ({card.attachments.length})
            </h3>
            <button
              onClick={() => setIsAddingAttachment(!isAddingAttachment)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {isAddingAttachment ? 'Cancel' : 'Add'}
            </button>
          </div>

          {isAddingAttachment && (
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded mb-3">
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  placeholder="Document name"
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL
                </label>
                <input
                  type="text"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  placeholder="https://..."
                />
              </div>
              <button
                onClick={handleAddAttachment}
                disabled={!attachmentName.trim() || !attachmentUrl.trim()}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded disabled:opacity-50"
              >
                Add Attachment
              </button>
            </div>
          )}

          {card.attachments.length > 0 && (
            <div className="space-y-2">
              {card.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-700 dark:text-gray-300">
                      {attachment.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(attachment.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
                    >
                      Open
                    </a>
                    <button
                      onClick={() => handleDeleteAttachment(attachment.id)}
                      className="text-red-500 hover:text-red-700 p-1"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              Comments ({card.comments.length})
            </h3>
            <button
              onClick={() => setIsAddingComment(!isAddingComment)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {isAddingComment ? 'Cancel' : 'Add Comment'}
            </button>
          </div>

          {isAddingComment && (
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded mb-3">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 min-h-[80px]"
                placeholder="Write a comment..."
              />
              <div className="mt-2">
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded disabled:opacity-50"
                >
                  Add Comment
                </button>
              </div>
            </div>
          )}

          {card.comments.length > 0 && (
            <div className="space-y-3">
              {card.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded relative group"
                >
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(comment.createdAt)}
                    </div>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                    {comment.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Created: {formatDate(card.createdAt)}
            {card.updatedAt && card.updatedAt !== card.createdAt && (
              <span> | Updated: {formatDate(card.updatedAt)}</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
