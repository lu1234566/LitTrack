import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Quote } from '@/types/quote';
import { loadQuotes, saveQuotes } from '@/services/quoteStorage';

type QuoteInput = Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>;

type QuoteContextValue = {
  quotes: Quote[];
  loadingQuotes: boolean;
  addQuote: (quote: QuoteInput) => Promise<void>;
  updateQuote: (quoteId: string, patch: Partial<Quote>) => Promise<void>;
  deleteQuote: (quoteId: string) => Promise<void>;
  setQuoteList: (nextQuotes: Quote[]) => Promise<void>;
  toggleFavoriteQuote: (quoteId: string) => Promise<void>;
};

const QuoteContext = createContext<QuoteContextValue>({
  quotes: [],
  loadingQuotes: true,
  addQuote: async () => {},
  updateQuote: async () => {},
  deleteQuote: async () => {},
  setQuoteList: async () => {},
  toggleFavoriteQuote: async () => {}
});

export function QuoteProvider({ children }: { children: React.ReactNode }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(true);

  useEffect(() => {
    loadQuotes().then(setQuotes).finally(() => setLoadingQuotes(false));
  }, []);

  async function persist(nextQuotes: Quote[]) {
    setQuotes(nextQuotes);
    await saveQuotes(nextQuotes);
  }

  async function setQuoteList(nextQuotes: Quote[]) {
    await persist(nextQuotes);
  }

  async function addQuote(input: QuoteInput) {
    const now = Date.now();
    await persist([{ ...input, id: 'quote-' + String(now), createdAt: now, updatedAt: now }, ...quotes]);
  }

  async function updateQuote(quoteId: string, patch: Partial<Quote>) {
    await persist(quotes.map((quote) => quote.id === quoteId ? { ...quote, ...patch, updatedAt: Date.now() } : quote));
  }

  async function deleteQuote(quoteId: string) {
    await persist(quotes.filter((quote) => quote.id !== quoteId));
  }

  async function toggleFavoriteQuote(quoteId: string) {
    await persist(quotes.map((quote) => quote.id === quoteId ? { ...quote, favorite: !quote.favorite, updatedAt: Date.now() } : quote));
  }

  const value = useMemo(() => ({ quotes, loadingQuotes, addQuote, updateQuote, deleteQuote, setQuoteList, toggleFavoriteQuote }), [quotes, loadingQuotes]);
  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>;
}

export function useQuotes() {
  return useContext(QuoteContext);
}
