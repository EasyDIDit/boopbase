/**
 * Owner-only removal of ONE mailing-list entry (Subscriber) by id.
 * Never touches customers, orders, devices or profiles: the only write is Subscriber.deleteOne({ _id }).
 * CSRF: the session cookie is SameSite=Lax (not sent on cross-site DELETE), and we also require a same-origin request.
 */
export type DeleteDeps = {
  username: string | null;
  isOwner: (u: string | null) => boolean;
  /** Origin / Sec-Fetch-Site headers and the request's own origin. */
  origin: string | null;
  fetchSite: string | null;
  selfOrigin: string;
  remove: (id: string) => Promise<{ email: string } | null>;
};

export type DeleteResult = { status: number; body: { ok?: true; email?: string; error?: string } };

const OBJECT_ID = /^[a-f0-9]{24}$/i;

export function sameOrigin(origin: string | null, fetchSite: string | null, selfOrigin: string): boolean {
  if (fetchSite && fetchSite !== 'same-origin') return false;
  if (origin) return origin === selfOrigin;
  return fetchSite === 'same-origin';
}

export async function deleteSubscriber(id: unknown, deps: DeleteDeps): Promise<DeleteResult> {
  if (!deps.username) return { status: 401, body: { error: 'Sign in first' } };
  if (!deps.isOwner(deps.username)) return { status: 403, body: { error: 'Not allowed' } };
  if (!sameOrigin(deps.origin, deps.fetchSite, deps.selfOrigin)) return { status: 403, body: { error: 'Bad origin' } };
  if (typeof id !== 'string' || !OBJECT_ID.test(id)) return { status: 400, body: { error: 'Invalid id' } };
  const removed = await deps.remove(id);
  if (!removed) return { status: 404, body: { error: 'Not found' } };
  return { status: 200, body: { ok: true, email: removed.email } };
}
