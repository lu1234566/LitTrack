export interface Shelf {
  id: string;
  name: string;
  description?: string;
  color?: string;
  bookIds: string[];
  createdAt: number;
  updatedAt: number;
}
