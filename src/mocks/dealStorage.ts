import type {
  Deal,
  Message,
  PartnershipMeta,
  Review,
  Thread,
} from "@/types/models";
import { safeStorage } from "@/shared/lib/storage";

const KEY = "sy-deals";

interface StoredDeals {
  version: 1;
  deals: Record<string, Deal>;
  reviews: Review[];
  threads: Thread[];
  messages: Message[];
  partnerMeta: PartnershipMeta[];
}

const empty = (): StoredDeals => ({
  version: 1,
  deals: {},
  reviews: [],
  threads: [],
  messages: [],
  partnerMeta: [],
});

function read(): StoredDeals {
  try {
    const raw = safeStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as StoredDeals;
    return parsed.version === 1 ? { ...empty(), ...parsed } : empty();
  } catch {
    return empty();
  }
}

function update(fn: (data: StoredDeals) => void) {
  const data = read();
  fn(data);
  safeStorage.setItem(KEY, JSON.stringify(data));
}

/** Replays deal changes made in this browser over the generated data at start-up. */
export function applyStoredDeals(
  target: Partial<{
    deals: Deal[];
    reviews: Review[];
    threads: Thread[];
    messages: Message[];
    partnershipMeta: PartnershipMeta[];
  }>,
) {
  const data = read();
  const list = target.deals;
  if (list)
    for (const deal of Object.values(data.deals)) {
      const deals: Deal[] = list;
      const i = deals.findIndex((d) => d.id === deal.id);
      if (i >= 0) deals[i] = deal;
      else deals.push(deal);
    }
  const reviews = target.reviews;
  if (reviews)
    for (const r of data.reviews)
      if (!reviews.some((x) => x.id === r.id)) reviews.push(r);
  const threads = target.threads;
  if (threads)
    for (const t of data.threads) {
      const i = threads.findIndex((x) => x.id === t.id);
      if (i >= 0) threads[i] = t;
      else threads.push(t);
    }
  const messages = target.messages;
  if (messages)
    for (const m of data.messages)
      if (!messages.some((x) => x.id === m.id)) messages.push(m);
  const metas = target.partnershipMeta;
  if (metas)
    for (const meta of data.partnerMeta) {
      const i = metas.findIndex(
        (x) =>
          x.ownerId === meta.ownerId &&
          x.counterpartyId === meta.counterpartyId,
      );
      if (i >= 0) metas[i] = meta;
      else metas.push(meta);
    }
}

export const persistDeal = (deal: Deal) =>
  update((d) => void (d.deals[deal.id] = deal));
export const persistReview = (review: Review) =>
  update(
    (d) =>
      void (d.reviews = [
        ...d.reviews.filter((r) => r.id !== review.id),
        review,
      ]),
  );
export const persistThread = (thread: Thread, messages: Message[] = []) =>
  update((d) => {
    d.threads = [...d.threads.filter((t) => t.id !== thread.id), thread];
    d.messages = [
      ...d.messages.filter((m) => !messages.some((x) => x.id === m.id)),
      ...messages,
    ];
  });
export const persistPartnerMeta = (meta: PartnershipMeta) =>
  update(
    (d) =>
      void (d.partnerMeta = [
        ...d.partnerMeta.filter(
          (x) =>
            !(
              x.ownerId === meta.ownerId &&
              x.counterpartyId === meta.counterpartyId
            ),
        ),
        meta,
      ]),
  );
export const clearStoredDeals = () => safeStorage.removeItem(KEY);
