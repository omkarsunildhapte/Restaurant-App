/** Shapes shared by more than one domain. */

/** Every persisted record has an id. */
export interface Entity {
  id: string;
}

/** The `{ id, name }` stub shown in lists without a second request. */
export interface NamedRef extends Entity {
  name: string;
}

/** Visual style of an Ionic alert raised by AlertService. */
export type AlertKind = 'success' | 'error' | 'warning';

/** A routed link rendered from a constant (tabs, account menu). */
export interface NavLink {
  label: string;
  path: string;
  icon: string;
}
