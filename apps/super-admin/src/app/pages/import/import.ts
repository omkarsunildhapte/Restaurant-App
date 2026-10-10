import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LeadStore } from '@app/core/lead.store';
import { RESTAURANT_TYPES, SOURCES, SOURCE_LABEL, type RestaurantType } from '@app/core/crm';

/** CSV header (lower-cased, spaces and punctuation removed) -> lead field. */
const HEADER_FIELD: Record<string, string> = {
  name: 'restaurantName',
  restaurant: 'restaurantName',
  restaurantname: 'restaurantName',
  business: 'restaurantName',
  businessname: 'restaurantName',
  title: 'restaurantName',
  owner: 'ownerName',
  ownername: 'ownerName',
  contactperson: 'ownerName',
  phone: 'phone',
  mobile: 'phone',
  phonenumber: 'phone',
  contact: 'phone',
  whatsapp: 'whatsapp',
  email: 'email',
  area: 'area',
  locality: 'area',
  neighbourhood: 'area',
  neighborhood: 'area',
  city: 'city',
  address: 'address',
  fulladdress: 'address',
  maps: 'mapsUrl',
  mapsurl: 'mapsUrl',
  googlemaps: 'mapsUrl',
  mapslink: 'mapsUrl',
  link: 'mapsUrl',
  url: 'mapsUrl',
  type: 'restaurantType',
  category: 'restaurantType',
  seats: 'seats',
  notes: 'notes',
  rating: 'notes',
};

/** Free-text categories from Google Maps exports, mapped onto our types. */
function guessType(value: string): RestaurantType {
  const v = value.toLowerCase();
  if ((RESTAURANT_TYPES as readonly string[]).includes(v)) return v as RestaurantType;
  if (/caf[eé]|coffee|tea/.test(v)) return 'cafe';
  if (/bak(e|ery)|cake|patisserie/.test(v)) return 'bakery';
  if (/bar|pub|lounge|brew/.test(v)) return 'bar';
  if (/cloud|delivery/.test(v)) return 'cloud_kitchen';
  if (/fast|burger|pizza|momo|roll|chaat|snack|qsr/.test(v)) return 'qsr';
  if (/restaurant|dhaba|family|dining/.test(v)) return 'family_restaurant';
  return 'other';
}

/** RFC 4180 CSV: quoted fields, doubled quotes, commas and newlines inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

@Component({
  selector: 'app-import',
  imports: [FormsModule, RouterLink],
  templateUrl: './import.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Import {
  private readonly store = inject(LeadStore);

  protected readonly sources = SOURCES;
  protected readonly sourceLabel = SOURCE_LABEL;

  protected readonly fileName = signal<string | null>(null);
  protected readonly table = signal<string[][]>([]);
  protected readonly source = signal<string>('import');
  protected readonly defaultArea = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly result = signal<{ created: number; skipped: { row: number; reason: string }[] } | null>(null);

  protected readonly headers = computed(() => this.table()[0] ?? []);

  /** Which lead field each column feeds, or null when the column is ignored. */
  protected readonly mapping = computed(() =>
    this.headers().map((h) => HEADER_FIELD[h.toLowerCase().replace(/[^a-z]/g, '')] ?? null),
  );

  protected readonly rows = computed(() => {
    const mapping = this.mapping();
    const area = this.defaultArea().trim();
    return this.table()
      .slice(1)
      .map((cells) => {
        const row: Record<string, unknown> = {};
        mapping.forEach((field, i) => {
          const value = (cells[i] ?? '').trim();
          if (!field || !value) return;
          if (field === 'restaurantType') row[field] = guessType(value);
          else if (field === 'seats') row[field] = Number(value.replace(/\D/g, '')) || null;
          else if (field === 'notes' && row['notes']) row['notes'] += '\n' + value;
          else if (field === 'notes' && this.headers()[i]!.toLowerCase().includes('rating')) row['notes'] = 'Google rating ' + value;
          else if (!(field in row)) row[field] = value;
        });
        if (area && !row['area']) row['area'] = area;
        return row;
      });
  });

  protected readonly hasName = computed(() => this.mapping().includes('restaurantName'));

  protected onFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.result.set(null);
    this.error.set(null);
    if (!file) return;
    this.fileName.set(file.name);
    file.text().then(
      (text) => this.table.set(parseCsv(text.replace(/^﻿/, ''))),
      () => this.error.set('Could not read that file'),
    );
  }

  protected submit(): void {
    const rows = this.rows();
    if (!rows.length || !this.hasName()) return;
    this.busy.set(true);
    this.error.set(null);
    this.store.import(rows, this.source()).subscribe({
      next: (result) => {
        this.result.set(result);
        this.busy.set(false);
      },
      error: (e: Error) => {
        this.error.set(e.message);
        this.busy.set(false);
      },
    });
  }
}
