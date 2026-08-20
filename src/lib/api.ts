/**
 * Client API minimaliste pour le back-office MyStreet.
 * Tous les appels passent par ce wrapper :
 *   - centralise le base URL
 *   - injecte le Bearer token
 *   - gère le refresh + logout
 *   - parse les erreurs JSON du backend
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const ACCESS_KEY = "ms_admin_access_token";
const REFRESH_KEY = "ms_admin_refresh_token";
const USER_KEY = "ms_admin_user_id";

// ---------------------------------------------------------------------------
// Token storage
// ---------------------------------------------------------------------------

export const tokenStore = {
  getAccess: () =>
    typeof window === "undefined" ? null : localStorage.getItem(ACCESS_KEY),
  getRefresh: () =>
    typeof window === "undefined" ? null : localStorage.getItem(REFRESH_KEY),
  getUserId: () =>
    typeof window === "undefined" ? null : localStorage.getItem(USER_KEY),
  set: (access: string, refresh: string, userId: string) => {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    localStorage.setItem(USER_KEY, userId);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

// ---------------------------------------------------------------------------
// Erreurs
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fieldErrors?: { field: string; message: string }[],
  ) {
    super(message);
  }
}

// ---------------------------------------------------------------------------
// Fetch wrapper
// ---------------------------------------------------------------------------

async function request<T>(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean; raw?: boolean } = { auth: true },
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (options.auth !== false) {
    const token = tokenStore.getAccess();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (options.raw) {
    if (!res.ok) await throwApiError(res);
    return res as unknown as T;
  }

  if (!res.ok) await throwApiError(res);
  if (res.status === 204) return undefined as T;
  return res.json();
}

async function throwApiError(res: Response): Promise<never> {
  let body: any = {};
  try {
    body = await res.json();
  } catch {
    // pas de JSON
  }
  throw new ApiError(
    res.status,
    body.code ?? "UNKNOWN",
    body.message ?? `HTTP ${res.status}`,
    body.fieldErrors,
  );
}

// ---------------------------------------------------------------------------
// Internal seam — Next.js Route Handlers (same-origin, cookie session)
//
// Admin screens hit `/api/admin/*` route handlers in THIS app. The handlers
// gate on `staff_members` (per request) and run the data access through the
// repository layer (`src/lib/repositories/`) with the service-role client.
// Service-role keys NEVER reach the browser; the session travels as the
// httpOnly Supabase cookie (so `credentials: 'same-origin'`, no Bearer).
// ---------------------------------------------------------------------------

async function internalRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`/api/admin${path}`, {
    ...init,
    headers,
    credentials: "same-origin",
  });
  if (!res.ok) await throwApiError(res);
  if (res.status === 204) return undefined as T;
  return res.json();
}

function toQuery(filters: Record<string, unknown>): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  });
  const s = params.toString();
  return s ? `?${s}` : "";
}

// ---------------------------------------------------------------------------
// Auth admin
// ---------------------------------------------------------------------------

export type AuthTokens = {
  userId: string;
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
};

export const authApi = {
  async login(email: string, password: string): Promise<AuthTokens> {
    const tokens = await request<AuthTokens>(
      "/admin/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      { auth: false },
    );
    tokenStore.set(tokens.accessToken, tokens.refreshToken, tokens.userId);
    return tokens;
  },

  async logout(): Promise<void> {
    const refresh = tokenStore.getRefresh();
    if (refresh) {
      try {
        await request<void>(
          "/admin/auth/logout",
          { method: "POST", body: JSON.stringify({ refreshToken: refresh }) },
          { auth: false },
        );
      } catch {
        // on ignore - le token serveur peut deja etre expire
      }
    }
    tokenStore.clear();
  },

  async refresh(): Promise<AuthTokens> {
    const refresh = tokenStore.getRefresh();
    if (!refresh) throw new ApiError(401, "NO_REFRESH", "Pas de refresh token");
    const tokens = await request<AuthTokens>(
      "/admin/auth/refresh",
      { method: "POST", body: JSON.stringify({ refreshToken: refresh }) },
      { auth: false },
    );
    tokenStore.set(tokens.accessToken, tokens.refreshToken, tokens.userId);
    return tokens;
  },
};

// ---------------------------------------------------------------------------
// Users admin
// ---------------------------------------------------------------------------

export type AdminUserListItem = {
  id: string;
  name: string;
  handle: string | null;
  email: string;
  avatarUrl: string | null;
  neighborhood: string | null;
  status: "ACTIVE" | "PENDING" | "SUSPENDED" | "BANNED";
  kyc: "UNVERIFIED" | "PENDING" | "REVIEW" | "VERIFIED" | "REJECTED";
  rating: number;
  reviewsCount: number;
  listingsCount: number;
  salesCount: number;
  gmvCents: number;
  roles: string[];
  createdAt: string;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export type UserFilters = {
  q?: string;
  status?: string;
  kyc?: string;
  neighborhood?: string;
  page?: number;
  size?: number;
  sort?: string;
};

export type UserMeta = {
  statuses: string[];
  kycStatuses: string[];
  neighborhoods: string[];
};

export type UserActionStatus = "ACTIVE" | "SUSPENDED" | "BANNED";

export const usersApi = {
  list: (filters: UserFilters = {}) =>
    internalRequest<PageResponse<AdminUserListItem>>(`/users${toQuery(filters)}`),

  meta: () => internalRequest<UserMeta>("/users/meta"),

  /** A single user with admin fields (status/kyc) for the detail moderation panel. */
  get: (userId: string) =>
    internalRequest<AdminUserListItem>(`/users/${userId}?view=admin`),

  /**
   * Suspend / ban / reactivate a user. Staff-gated, service-role write to
   * `profiles.status` + audited (SCR-004), enforced server-side in the route
   * handler — never from the browser, never off user_metadata.
   */
  setStatus: (userId: string, status: UserActionStatus, reason?: string) =>
    internalRequest<AdminUserListItem>(`/users/${userId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, reason }),
    }),

  async exportXlsx(filters: UserFilters = {}): Promise<void> {
    const res = await fetch(`/api/admin/users/export${toQuery(filters)}`, {
      credentials: "same-origin",
    });
    if (!res.ok) await throwApiError(res);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `utilisateurs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  invite: (req: {
    email: string;
    password: string;
    displayName?: string;
    roles: string[];
  }) =>
    request<AdminUserListItem>("/admin/users-management", {
      method: "POST",
      body: JSON.stringify(req),
    }),
};

// ---------------------------------------------------------------------------
// Analytics (WEB-014) — read-only server-side aggregations
//
// Same-origin admin route handlers (cookie session), like usersApi/reportsApi —
// NOT the external `request()` base. Every aggregation runs in the staff-gated
// route handler against the SERVICE-ROLE client; service-role keys never reach
// the browser. All reads accept an optional `{ from, to }` date range (ISO date
// strings, inclusive) that scopes the queries on `created_at`.
// ---------------------------------------------------------------------------

export type AnalyticsRange = { from?: string; to?: string };

export type DistItem = { label: string; count: number };
export type TrendPoint = { date: string; count: number };

export type UsersSummary = {
  total: number;
  active: number;
  pending: number;
  suspended: number;
  banned: number;
  kycVerified: number;
  kycPending: number;
  /** Rolling 30-day signups (range-independent KPI). */
  signupsLast30Days: number;
  /** Signups within the selected range. */
  signupsInRange: number;
  totalGmvCents: number;
  averageRating: number;
};

export type ListingsSummary = {
  total: number;
  byType: DistItem[];
  byStatus: DistItem[];
  topCategories: DistItem[];
  totalViews: number;
  totalFavorites: number;
};

export type MarketplaceSummary = {
  totalUsers: number;
  activeUsers: number;
  totalListings: number;
  totalOrders: number;
  completedOrders: number;
  gmvCents: number;
  feesCents: number;
  ordersByStatus: DistItem[];
  gmvTrend: TrendPoint[];
};

export type EngagementSummary = {
  messages: number;
  threads: number;
  offers: number;
  favorites: number;
  savedSearches: number;
  signupsTrend: TrendPoint[];
  messagesTrend: TrendPoint[];
};

export type GeoSummary = {
  usersByNeighborhood: DistItem[];
  listingsByNeighborhood: DistItem[];
};

export type ReportsAnalyticsSummary = {
  total: number;
  open: number;
  byStatus: DistItem[];
  byTargetType: DistItem[];
  trend: TrendPoint[];
};

function rangeQuery(range: AnalyticsRange = {}): string {
  return toQuery({ from: range.from, to: range.to });
}

export const analyticsApi = {
  // --- Users
  summary: (range: AnalyticsRange = {}) =>
    internalRequest<UsersSummary>(`/analytics/users/summary${rangeQuery(range)}`),
  byStatus: (range: AnalyticsRange = {}) =>
    internalRequest<DistItem[]>(`/analytics/users/by-status${rangeQuery(range)}`),
  byKyc: (range: AnalyticsRange = {}) =>
    internalRequest<DistItem[]>(`/analytics/users/by-kyc${rangeQuery(range)}`),
  byNeighborhood: (range: AnalyticsRange = {}) =>
    internalRequest<DistItem[]>(`/analytics/users/by-neighborhood${rangeQuery(range)}`),
  signupsTrend: (range: AnalyticsRange = {}) =>
    internalRequest<TrendPoint[]>(`/analytics/users/signups-trend${rangeQuery(range)}`),

  // --- Listings
  listings: (range: AnalyticsRange = {}) =>
    internalRequest<ListingsSummary>(`/analytics/listings${rangeQuery(range)}`),

  // --- Marketplace
  marketplace: (range: AnalyticsRange = {}) =>
    internalRequest<MarketplaceSummary>(`/analytics/marketplace${rangeQuery(range)}`),

  // --- Engagement
  engagement: (range: AnalyticsRange = {}) =>
    internalRequest<EngagementSummary>(`/analytics/engagement${rangeQuery(range)}`),

  // --- Geo
  geo: (range: AnalyticsRange = {}) =>
    internalRequest<GeoSummary>(`/analytics/geo${rangeQuery(range)}`),

  // --- Reports
  reports: (range: AnalyticsRange = {}) =>
    internalRequest<ReportsAnalyticsSummary>(`/analytics/reports${rangeQuery(range)}`),
};

// ---------------------------------------------------------------------------
// Categories admin — same-origin `/api/admin/categories*` route handlers
// (internal seam, service-role read/write), NOT the external `request()` base.
// The `categories` table (SCR-001) has no `active`/`label_en` columns — there
// is no soft-deactivate; `remove()` is a real delete, blocked server-side if
// the category has subcategories or listings still pointing at it.
// ---------------------------------------------------------------------------

export type ListingType = "VENTE" | "LOCATION" | "SERVICE";

export type Category = {
  id: string;
  slug: string;
  label: string;
  subtitle: string | null;
  parentId: string | null;
  type: ListingType;
  glyph: string | null;
  sortOrder: number;
  /** Derived server-side: true when no other category has this as parentId. */
  isLeaf: boolean;
};

export type CategoryFilters = {
  type?: ListingType;
  label?: string;
  page?: number;
  size?: number;
};

export type CreateCategoryRequest = {
  slug: string;
  label: string;
  subtitle?: string;
  parentId?: string;
  type: ListingType;
  glyph?: string;
  sortOrder?: number;
};

export type UpdateCategoryRequest = {
  label?: string;
  subtitle?: string;
  parentId?: string;
  glyph?: string;
  sortOrder?: number;
};

export const categoriesApi = {
  list: (filters: CategoryFilters = {}) =>
    internalRequest<PageResponse<Category>>(`/categories${toQuery(filters)}`),

  create: (req: CreateCategoryRequest) =>
    internalRequest<Category>("/categories", {
      method: "POST",
      body: JSON.stringify(req),
    }),

  update: (id: string, req: UpdateCategoryRequest) =>
    internalRequest<Category>(`/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(req),
    }),

  /** Real delete — blocked (409 IN_USE) if the category has subcategories or
   * listings still referencing it. */
  remove: (id: string) =>
    internalRequest<void>(`/categories/${id}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// Public user (consulte une fiche user depuis annonce / signalement / etc.)
// ---------------------------------------------------------------------------

export type PublicProfile = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  age: number | null;
  profession: string | null;
  neighborhood: string | null;
  city: string | null;
  rating: number | null;
  reviewsCount: number | null;
  listingsCount: number | null;
  salesCount: number | null;
  createdAt: string;
};

export const publicUsersApi = {
  // Admin context: a staff member viewing any user's profile. Goes through the
  // staff-gated route handler (service-role read) so non-public fields the admin
  // is allowed to see resolve, rather than the anon public view.
  get: (userId: string) =>
    internalRequest<PublicProfile>(`/users/${userId}`),
};

// ---------------------------------------------------------------------------
// Listings (admin)
// ---------------------------------------------------------------------------

export type ListingStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "SOLD" | "ARCHIVED";

export type OwnerInfo = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  rating: number | null;
  reviewsCount: number | null;
  neighborhood: string | null;
};

export type Listing = {
  id: string;
  ownerId: string;
  owner: OwnerInfo | null;
  listingType: ListingType;
  title: string;
  description: string | null;
  priceCents: number | null;
  pricePerDayCents: number | null;
  pricePerWeekCents: number | null;
  depositCents: number | null;
  hourlyRateCents: number | null;
  flatRateCents: number | null;
  serviceRadiusKm: number | null;
  condition: string | null;
  categoryId: string | null;
  categoryLabel: string | null;
  neighborhood: string | null;
  lat: number | null;
  lng: number | null;
  photos: string[];
  status: ListingStatus;
  viewCount: number | null;
  favoritesCount: number | null;
  distanceMeters: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ListingFilters = {
  q?: string;
  listingType?: ListingType;
  status?: ListingStatus;
  categoryId?: string;
  ownerId?: string;
  neighborhood?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  page?: number;
  size?: number;
  sort?: string;
};

export type ModerationListing = Listing & { reportsCount: number };

export const listingsApi = {
  list: (filters: ListingFilters = {}) =>
    internalRequest<PageResponse<Listing>>(`/listings${toQuery(filters)}`),
  get: (id: string) => internalRequest<Listing>(`/listings/${id}`),
  /** Moderation queue: listings needing staff attention (flagged once WEB-008). */
  moderationQueue: (
    filters: { status?: ListingStatus; page?: number; size?: number } = {},
  ) =>
    internalRequest<PageResponse<ModerationListing>>(
      `/listings/moderation${toQuery(filters)}`,
    ),
  // Staff moderation: pause / archive / restore / soft-hide. Service-role write
  // + audited (SCR-004) in the route handler. `reason` is optional context.
  setStatus: (id: string, status: ListingStatus, reason?: string) =>
    internalRequest<Listing>(`/listings/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, reason }),
    }),
  archive: (id: string) =>
    internalRequest<void>(`/listings/${id}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// Orders (admin)
// ---------------------------------------------------------------------------

export type OrderStatus =
  | "AWAITING_PICKUP"
  | "HANDOFF_PENDING"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED"
  | "DISPUTED";

export type AdminOrder = {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  listingTitleSnapshot: string | null;
  listingThumbSnapshot: string | null;
  listingType: ListingType;
  amountCents: number;
  feeCents: number;
  depositCents: number | null;
  status: OrderStatus;
  buyerConfirmed: boolean;
  sellerConfirmed: boolean;
  paymentIntentId: string | null;
  paymentStatus: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
};

export type OrderFilters = {
  status?: OrderStatus;
  buyerId?: string;
  sellerId?: string;
  page?: number;
  size?: number;
};

export const ordersApi = {
  // WEB-013: wired to the same-origin admin routes (cookie session, staff-gated)
  // backed by OrdersRepository on the service-role client — every order in scope,
  // not just the admin's own. Replaces the old external `/me/orders` shim.
  list: (filters: OrderFilters = {}) =>
    internalRequest<PageResponse<AdminOrder>>(`/orders${toQuery(filters as Record<string, unknown>)}`),
  get: (id: string) => internalRequest<AdminOrder>(`/orders/${id}`),

  /**
   * Issue an idempotent Stripe refund for an order (finance role only). The
   * Stripe webhook remains the source of truth that flips the order to REFUNDED;
   * this call only initiates the refund.
   */
  refund: (id: string, amountCents?: number) =>
    internalRequest<AdminOrder>(`/orders/${id}`, {
      method: "POST",
      body: JSON.stringify({ action: "refund", amountCents }),
    }),
};

// ---------------------------------------------------------------------------
// Reports (moderation)
// ---------------------------------------------------------------------------

export type ReportStatus = "OPEN" | "REVIEWING" | "ACTIONED" | "DISMISSED";
export type ReportTargetType = "LISTING" | "USER" | "THREAD" | "MESSAGE";

export type Report = {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  createdAt: string;
};

export type ReportFilters = {
  status?: ReportStatus;
  targetType?: ReportTargetType;
  page?: number;
  size?: number;
};

export const reportsApi = {
  // Same-origin admin route handlers (cookie session), like usersApi/listingsApi
  // — NOT the external `request()` base. Wired to WEB-011's /api/admin/reports*.
  list: (filters: ReportFilters = {}) =>
    internalRequest<PageResponse<Report>>(`/reports${toQuery(filters)}`),
  get: (id: string) => internalRequest<Report>(`/reports/${id}`),
  setStatus: (id: string, status: ReportStatus, moderatorNote?: string) =>
    internalRequest<Report>(`/reports/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, moderatorNote }),
    }),
};

// ---------------------------------------------------------------------------
// KYC (admin)
// ---------------------------------------------------------------------------

export type KycStatus = "UNVERIFIED" | "PENDING" | "REVIEW" | "VERIFIED" | "REJECTED";

export type KycListItem = AdminUserListItem & {
  /** Stripe Connect account ID (null if no Connect account exists) */
  stripeAccountId: string | null;
  /** Whether payouts are enabled in Stripe Connect */
  payoutsEnabled: boolean;
  /** Whether KYC details have been submitted to Stripe */
  detailsSubmitted: boolean;
  /** Stripe Connect onboarding status */
  onboardingStatus: "PENDING" | "ENABLED" | "RESTRICTED" | "DISABLED" | null;
  /** Source of the KYC status ('connect' | 'profile' | 'none') */
  source: "connect" | "profile" | "none";
};

export type KycDetail = KycListItem & {
  /** Stripe account requirements (currently due) */
  currentlyDue: string[];
  /** Stripe account requirements (past due) */
  pastDue: string[];
  /** Pending verification requirements */
  pendingVerification: string[];
  /** Timestamp when the Connect account was created */
  connectCreatedAt: string | null;
  /** Timestamp when the Connect account was last updated */
  connectUpdatedAt: string | null;
};

export type KycFilters = {
  q?: string;
  status?: KycStatus;
  source?: "connect" | "profile" | "none";
  page?: number;
  size?: number;
  sort?: string;
};

export const kycApi = {
  /**
   * List sellers with their KYC/Connect status.
   * Uses internal admin API (same-origin, cookie session).
   */
  list: (filters: KycFilters = {}) =>
    internalRequest<PageResponse<KycListItem>>(`/kyc${toQuery(filters)}`),

  /**
   * Get detailed KYC info for a single user.
   * Uses internal admin API (same-origin, cookie session).
   */
  get: (userId: string) =>
    internalRequest<KycDetail>(`/kyc/${userId}`),

  /**
   * Refresh KYC status from Stripe.
   * Calls the Edge Function to fetch fresh data.
   */
  refresh: (userId: string) =>
    internalRequest<KycDetail>(`/kyc/${userId}`, {
      method: "POST",
      body: JSON.stringify({ action: "refresh" }),
    }),

  /**
   * Resend onboarding link for incomplete Connect accounts.
   * Calls the connect-onboarding Edge Function.
   */
  resendOnboarding: (userId: string) =>
    internalRequest<{ url: string | null; accountId: string; onboardingStatus: string }>(`/kyc/${userId}`, {
      method: "POST",
      body: JSON.stringify({ action: "resend-onboarding" }),
    }),

  // Legacy methods for backward compatibility
  pending: (page = 0, size = 20) =>
    internalRequest<PageResponse<AdminUserListItem>>(
      `/kyc?status=PENDING&page=${page}&size=${size}`,
    ),
  verified: (page = 0, size = 20) =>
    internalRequest<PageResponse<AdminUserListItem>>(
      `/kyc?status=VERIFIED&page=${page}&size=${size}`,
    ),
};

// ---------------------------------------------------------------------------
// Finance (admin)
// ---------------------------------------------------------------------------
//
// WEB-013: the summary is aggregated in the database (OrdersRepository.summary)
// behind the same-origin admin route, replacing the old client-side sum that
// capped at 200 orders.

export type FinanceSummary = {
  totalGmvCents: number;
  totalFeesCents: number;
  completedOrders: number;
  pendingOrders: number;
  refundedOrders: number;
};

export const financeApi = {
  summary: () => internalRequest<FinanceSummary>(`/finance/summary`),
  refunds: (page = 0, size = 20) =>
    ordersApi.list({ status: "REFUNDED", page, size }),
};

// ---------------------------------------------------------------------------
// Marketing (PUBLIC — no auth, no /admin prefix)
// ---------------------------------------------------------------------------
//
// The public marketing surface is the ONLY non-admin part of the app. Unlike
// `request()` above (which talks to the Spring back-office at API_BASE with a
// Bearer token), the marketing seam hits this Next app's OWN public route
// handler at `/api/marketing/*` via a same-origin relative `fetch`. No token,
// no cookies, no API_BASE. Screens never fetch directly — they go through
// `marketingApi` so the data-access seam stays in one place.

export type WaitlistSource = "homepage" | "footer" | "referral" | "app" | string;

export type JoinWaitlistRequest = {
  email: string;
  referralCode?: string;
  /** Which marketing surface the signup came from (for attribution). */
  source?: WaitlistSource;
};

export type JoinWaitlistResponse = {
  ok: true;
  /** `true` when this email had already been seen in the same request batch. */
  duplicate: boolean;
  email: string;
  referralCode: string | null;
};

export const marketingApi = {
  /**
   * Join the pre-launch waitlist (optionally with a referral code).
   *
   * Talks to the PUBLIC Next route handler `POST /api/marketing/waitlist` —
   * NOT the admin backend. Throws an {@link ApiError} on a 4xx/5xx so callers
   * (the waitlist form) can show validation/retry messaging.
   */
  async joinWaitlist(req: JoinWaitlistRequest): Promise<JoinWaitlistResponse> {
    const res = await fetch("/api/marketing/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: req.email,
        referralCode: req.referralCode,
        source: req.source,
      }),
    });
    if (!res.ok) await throwApiError(res);
    return res.json();
  },
};
