export interface Quote {
  id: string;
  bookId?: string;
  bookTitle: string;
  author?: string;
  text: string;
  page?: number;
  tags: string[];
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}
