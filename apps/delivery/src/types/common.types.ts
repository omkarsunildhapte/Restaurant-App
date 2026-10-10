/** Base for every row that has a primary key (Supabase uuid). */
export interface Entity {
  id: string;
}

/** A failed validation or lookup, shown to the rider as text. */
export interface UserMessage {
  message: string;
}
