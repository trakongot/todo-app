import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'file' | 'link';
  createdAt: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Card {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  startDate: string | null;
  completed: boolean;
  priority: 'low' | 'medium' | 'high' | null | undefined;
  labels: string[];
  checklists: Checklist[];
  comments: Comment[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface List {
  id: string;
  title: string;
  cards: Card[];
}

export interface Board {
  id: string;
  title: string;
  lists: List[];
}

// Store state interface
interface KanbanState {
  boards: Board[];
  currentBoard: string | null;
  labels: Label[];
  selectedCard: Card | null;
}

const defaultState: KanbanState = {
  boards: [
    {
      id: 'board-1',
      title: 'My Project',
      lists: [
        {
          id: '1',
          title: 'To Do',
          cards: [],
        },
        {
          id: '2',
          title: 'In Progress',
          cards: [],
        },
        {
          id: '3',
          title: 'Completed',
          cards: [],
        },
      ],
    },
  ],
  currentBoard: 'board-1',
  labels: [
    { id: '1', name: 'Research', color: '#61bd4f' },
    { id: '2', name: 'Design', color: '#f2d600' },
    { id: '3', name: 'Development', color: '#ff9f1a' },
    { id: '4', name: 'Bug', color: '#eb5a46' },
    { id: '5', name: 'Feature', color: '#c377e0' },
    { id: '6', name: 'Other', color: '#c327e0' },
  ],
  selectedCard: null,
};

// Load initial state from localStorage if available
const getInitialState = (): KanbanState => {
  try {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('kanbanState');
      if (savedState) {
        return JSON.parse(savedState);
      }
    }
  } catch (error) {
    console.error('Error getting initial state:', error);
  }
  return defaultState;
};

// Helper function to save state to localStorage
const saveState = (state: KanbanState) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kanbanState', JSON.stringify(state));
    }
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
  }
};

const kanbanSlice = createSlice({
  name: 'kanban',
  initialState: getInitialState(),
  reducers: {
    // Board actions
    addBoard: (state, action: PayloadAction<{ title: string }>) => {
      const newBoard: Board = {
        id: `board-${Date.now()}`,
        title: action.payload.title,
        lists: [
          { id: '1', title: 'To Do', cards: [] },
          { id: '2', title: 'In Progress', cards: [] },
          { id: '3', title: 'Completed', cards: [] },
        ],
      };
      state.boards.push(newBoard);
      saveState(state);
    },

    setCurrentBoard: (state, action: PayloadAction<string>) => {
      state.currentBoard = action.payload;
      saveState(state);
    },

    // List actions
    addList: (
      state,
      action: PayloadAction<{ boardId: string; title: string }>,
    ) => {
      const { boardId, title } = action.payload;
      const board = state.boards.find((b) => b.id === boardId);
      if (board) {
        board.lists.push({
          id: `list-${Date.now()}`,
          title,
          cards: [],
        });
        saveState(state);
      }
    },

    // Card actions
    addCard: (
      state,
      action: PayloadAction<{ boardId: string; listId: string; title: string }>,
    ) => {
      const { boardId, listId, title } = action.payload;
      const board = state.boards.find((b) => b.id === boardId);
      if (board) {
        const list = board.lists.find((l) => l.id === listId);
        if (list) {
          const newCard: Card = {
            id: `card-${Date.now()}`,
            title,
            description: '',
            dueDate: null,
            startDate: new Date().toISOString(),
            completed: false,
            priority: null,
            labels: [],
            checklists: [],
            comments: [],
            attachments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          list.cards.push(newCard);
          saveState(state);
        }
      }
    },

    moveCard: (
      state,
      action: PayloadAction<{
        boardId: string;
        sourceListId: string;
        destinationListId: string;
        destinationIndex: number;
        cardId: string;
      }>,
    ) => {
      const {
        boardId,
        sourceListId,
        destinationListId,
        destinationIndex,
        cardId,
      } = action.payload;
      const board = state.boards.find((b) => b.id === boardId);
      if (board) {
        const sourceList = board.lists.find((l) => l.id === sourceListId);
        const destinationList = board.lists.find(
          (l) => l.id === destinationListId,
        );

        if (sourceList && destinationList) {
          // Find the card by id
          const cardToMove = sourceList.cards.find(
            (card) => card.id === cardId,
          );

          if (cardToMove) {
            // Remove from source list
            sourceList.cards = sourceList.cards.filter(
              (card) => card.id !== cardId,
            );

            // Insert at destination list
            destinationList.cards.splice(destinationIndex, 0, cardToMove);

            saveState(state);
          }
        }
      }
    },

    // Card detail management
    setSelectedCard: (
      state,
      action: PayloadAction<{
        card: Card | null;
        boardId?: string;
        listId?: string;
      }>,
    ) => {
      state.selectedCard = action.payload.card;
    },

    updateCard: (
      state,
      action: PayloadAction<{
        boardId: string;
        listId: string;
        cardId: string;
        updates: Partial<Omit<Card, 'id' | 'createdAt'>>;
      }>,
    ) => {
      const { boardId, listId, cardId, updates } = action.payload;
      const board = state.boards.find((b) => b.id === boardId);
      if (board) {
        const list = board.lists.find((l) => l.id === listId);
        if (list) {
          const card = list.cards.find((c) => c.id === cardId);
          if (card) {
            Object.assign(card, {
              ...updates,
              updatedAt: new Date().toISOString(),
            });
            saveState(state);
          }
        }
      }
    },

    // Reset state
    resetState: (state) => {
      // Create fresh default state rather than reusing the object
      const freshDefaultState = {
        boards: [
          {
            id: 'board-1',
            title: 'My Project',
            lists: [
              {
                id: '1',
                title: 'To Do',
                cards: [],
              },
              {
                id: '2',
                title: 'In Progress',
                cards: [],
              },
              {
                id: '3',
                title: 'Completed',
                cards: [],
              },
            ],
          },
        ],
        currentBoard: 'board-1',
        labels: [
          { id: '1', name: 'Research', color: '#61bd4f' },
          { id: '2', name: 'Design', color: '#f2d600' },
          { id: '3', name: 'Development', color: '#ff9f1a' },
          { id: '4', name: 'Bug', color: '#eb5a46' },
          { id: '5', name: 'Feature', color: '#c377e0' },
          { id: '6', name: 'Other', color: '#c327e0' },
        ],
        selectedCard: null,
      };

      Object.assign(state, freshDefaultState);
      saveState(state);
    },

    // Thêm một task mẫu vào Cần Làm
    addSampleCard: (state) => {
      const board = state.boards.find((b) => b.id === state.currentBoard);
      if (board) {
        const list = board.lists.find((l) => l.title === 'Cần làm');
        if (list) {
          const newCard: Card = {
            id: `card-${Date.now()}`,
            title: 'Tạo nhiệm vụ mẫu',
            description: 'Đây là nhiệm vụ mẫu để bạn làm quen với hệ thống.',
            dueDate: new Date(
              Date.now() + 3 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            startDate: new Date().toISOString(),
            completed: false,
            priority: 'medium',
            labels: ['design'],
            checklists: [
              {
                id: `checklist-${Date.now()}`,
                title: 'Các bước cần làm',
                items: [
                  {
                    id: `item-${Date.now()}-1`,
                    text: 'Kéo thẻ qua cột "Đang thực hiện"',
                    completed: false,
                  },
                  {
                    id: `item-${Date.now()}-2`,
                    text: 'Cập nhật trạng thái các mục trong danh sách',
                    completed: false,
                  },
                ],
              },
            ],
            comments: [],
            attachments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          list.cards.push(newCard);
          saveState(state);
        }
      }
    },

    // Delete card action
    deleteCard: (
      state,
      action: PayloadAction<{
        boardId: string;
        listId: string;
        cardId: string;
      }>,
    ) => {
      const { boardId, listId, cardId } = action.payload;
      const board = state.boards.find((b) => b.id === boardId);
      if (board) {
        const list = board.lists.find((l) => l.id === listId);
        if (list) {
          list.cards = list.cards.filter((card) => card.id !== cardId);
          saveState(state);
        }
      }
    },
  },
});

export const {
  addBoard,
  setCurrentBoard,
  addList,
  addCard,
  updateCard,
  moveCard,
  setSelectedCard,
  resetState,
  addSampleCard,
  deleteCard,
} = kanbanSlice.actions;

export default kanbanSlice.reducer;
