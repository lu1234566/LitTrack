export interface ReadingSession {
  id: string;
  bookId: string;
  bookTitle: string;
  pagesRead: number;
  minutesRead: number;
  note?: string;
  mood?: string;
  createdAt: number;
  updatedAt: number;
}
