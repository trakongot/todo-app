'use client';

import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
  Card,
  deleteCard,
  moveCard,
  setSelectedCard,
  updateCard,
} from '../store/kanbanSlice';
import CardDetailModal from './kanban/CardDetailModal';
import KanbanCard from './kanban/KanbanCard';
import KanbanList from './kanban/KanbanList';

// Define the mapping between list IDs and status
export const LIST_STATUS_MAP: Record<
  string,
  { id: string; status: string; completed: boolean }
> = {
  '1': { id: '1', status: 'todo', completed: false },
  '2': { id: '2', status: 'in-progress', completed: false },
  '3': { id: '3', status: 'completed', completed: true },
};

// Reverse mapping: status to list ID
export const STATUS_LIST_MAP: Record<string, string> = {
  todo: '1',
  'in-progress': '2',
  completed: '3',
};

export default function KanbanBoard() {
  const dispatch = useAppDispatch();
  const { boards, currentBoard } = useAppSelector((state) => state.kanban);
  const currentBoardData = boards.find((board) => board.id === currentBoard);

  const [activeCard, setActiveCard] = useState<{
    id: string;
    listId: string;
    card: Card | null;
  } | null>(null);

  const [selectedCard, setSelectedCardState] = useState<{
    card: Card;
    listId: string;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const sourceListId = active.data.current?.sortable.containerId;

    // Get the actual card data for the overlay
    const draggedCard = currentBoardData?.lists
      .find((list) => list.id === sourceListId)
      ?.cards.find((card) => card.id === active.id);

    setActiveCard({
      id: active.id as string,
      listId: sourceListId,
      card: draggedCard || null,
    });
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over || !activeCard) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Skip if there's no change
    if (activeId === overId) return;

    const activeListId = activeCard.listId;
    const overListId = over.data.current?.sortable?.containerId || over.id;

    // Skip if we're still in the same list
    if (activeListId === overListId) return;

    // If we're over a list directly (not a card), we need to prepare for a drop
    if (!over.data.current?.sortable) {
      // We are dragging over a list
      const isList = currentBoardData?.lists.some((list) => list.id === overId);
      if (isList) {
        // Update activeCard with new list information for drop
        setActiveCard({
          ...activeCard,
          listId: overId as string,
        });
      }
    } else {
      // We are dragging over a card in a different list
      setActiveCard({
        ...activeCard,
        listId: overListId as string,
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!activeCard || !over) {
      setActiveCard(null);
      return;
    }

    const cardId = active.id as string;
    const sourceListId = activeCard.listId;

    // Determine where the card was dropped
    let destinationListId: string;
    let destinationIndex: number = 0;

    if (over.data.current?.sortable) {
      // Dropped on a card
      destinationListId = over.data.current.sortable.containerId;
      destinationIndex = over.data.current.sortable.index;
    } else {
      // Dropped directly on a list
      destinationListId = over.id as string;

      // If it's a list, place at the end
      const destinationList = currentBoardData?.lists.find(
        (list) => list.id === destinationListId,
      );
      destinationIndex = destinationList?.cards.length || 0;
    }

    // Only move if we have a valid destination and it's different from source
    if (destinationListId && sourceListId !== destinationListId) {
      // Get the card being moved
      const cardBeingMoved = currentBoardData?.lists
        .find((list) => list.id === sourceListId)
        ?.cards.find((card) => card.id === cardId);

      if (cardBeingMoved) {
        // Update the card status based on destination list
        const listStatusInfo = LIST_STATUS_MAP[destinationListId];
        if (listStatusInfo) {
          // Update card completed status based on destination list
          dispatch(
            updateCard({
              boardId: currentBoard as string,
              listId: sourceListId,
              cardId,
              updates: {
                completed: listStatusInfo.completed,
              },
            }),
          );
        }

        // Move the card to the new list
        dispatch(
          moveCard({
            boardId: currentBoard as string,
            sourceListId,
            destinationListId,
            destinationIndex,
            cardId,
          }),
        );
      }
    }

    setActiveCard(null);
  };

  const handleCardClick = (card: Card, listId: string) => {
    dispatch(setSelectedCard({ card }));
    setSelectedCardState({ card, listId });
  };

  const handleCloseCardDetail = () => {
    dispatch(setSelectedCard({ card: null }));
    setSelectedCardState(null);
  };

  const handleDeleteCard = (cardId: string, listId: string) => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      dispatch(
        deleteCard({
          boardId: currentBoard as string,
          listId,
          cardId,
        }),
      );
      if (selectedCard && selectedCard.card.id === cardId) {
        handleCloseCardDetail();
      }
    }
  };

  if (!currentBoardData) {
    return <div>No board selected</div>;
  }

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-wrap md:flex-nowrap gap-4 pb-4">
            {currentBoardData.lists.map((list) => (
              <KanbanList
                key={list.id}
                list={list}
                boardId={currentBoardData.id}
                onCardClick={handleCardClick}
                onDeleteCard={handleDeleteCard}
              />
            ))}
          </div>

          {activeCard && activeCard.card && (
            <DragOverlay>
              <div className="opacity-80 w-72">
                <KanbanCard
                  card={activeCard.card}
                  onClick={() => {}}
                  onDelete={() => {}}
                />
              </div>
            </DragOverlay>
          )}
        </DndContext>

        {selectedCard && (
          <CardDetailModal
            card={selectedCard.card}
            boardId={currentBoardData.id}
            listId={selectedCard.listId}
            onClose={handleCloseCardDetail}
            onDelete={() =>
              handleDeleteCard(selectedCard.card.id, selectedCard.listId)
            }
          />
        )}
      </div>
    </div>
  );
}
