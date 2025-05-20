'use client';

import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Provider } from 'react-redux';
import KanbanBoard from './components/KanbanBoard';
import ThemeToggle from './components/ThemeToggle';
import { store } from './store';

export default function Home() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDarkMode =
        localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  return (
    <Provider store={store}>
      <div className="min-h-screen overflow-hidden bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
        <Toaster position="top-right" />
        <header className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="container mx-auto px-4 py-5 flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white">
                TodoBoard
              </h1>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="container mx-auto px-4 py-10">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  Tasks
                </h3>
              </div>
              <div className="p-6">
                <KanbanBoard />
              </div>
            </div>
          </div>
        </main>
      </div>
    </Provider>
  );
}
