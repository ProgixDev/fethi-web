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
// Analytics users
// ---------------------------------------------------------------------------

export type UsersSummary = {
  total: number;
  active: number;
  pending: number;
  suspended: number;
  banned: number;
  kycVerified: number;
  kycPending: number;
  signupsLast30Days: number;
  totalGmvCents: number;
  averageRating: number;
};

export type DistItem = { label: string; count: number };
export type TrendPoint = { date: string; count: number };

export const analyticsApi = {
  summary: () =>
    request<UsersSummary>("/admin/analytics/users/summary"),
  byStatus: () =>
    request<DistItem[]>("/admin/analytics/users/by-status"),
  byKyc: () =>
    request<DistItem[]>("/admin/analytics/users/by-kyc"),
  byNeighborhood: () =>
    request<DistItem[]>("/admin/analytics/users/by-neighborhood"),
  signupsTrend: () =>
    request<TrendPoint[]>("/admin/analytics/users/signups-trend"),
};

// ---------------------------------------------------------------------------
// Categories admin
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
  isLeaf: boolean;
};

export type CategoryFilters = {
  type?: ListingType;
  active?: boolean;
  isLeaf?: boolean;
  parentId?: string;
  label?: string;
  page?: number;
  size?: number;
  sort?: string;
};

export type CreateCategoryRequest = {
  slug: string;
  label: string;
  labelEn?: string;
  subtitle?: string;
  parentId?: string;
  type: ListingType;
  glyph?: string;
  sortOrder?: number;
};

export type UpdateCategoryRequest = {
  label?: string;
  labelEn?: string;
  subtitle?: string;
  parentId?: string;
  glyph?: string;
  sortOrder?: number;
  active?: boolean;
};

export const categoriesApi = {
  list: (filters: CategoryFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
    });
    return request<PageResponse<Category>>(`/admin/categories?${params}`);
  },

  create: (req: CreateCategoryRequest) =>
    request<Category>("/admin/categories", {
      method: "POST",
      body: JSON.stringify(req),
    }),

  update: (id: string, req: UpdateCategoryRequest) =>
    request<Category>(`/admin/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(req),
    }),

  deactivate: (id: string) =>
    request<void>(`/admin/categories/${id}`, { method: "DELETE" }),
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
  // V1 : le backend n'a pas encore /admin/orders dedie ; on utilise la
  // route /me/orders (qui retourne celles ou l'admin est buyer ou seller).
  // A remplacer par /admin/orders quand AdminOrderController existera.
  list: (filters: OrderFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
    });
    return request<PageResponse<AdminOrder>>(`/me/orders?${params}`);
  },
  get: (id: string) => request<AdminOrder>(`/me/orders/${id}`),
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

export const kycApi = {
  pending: (page = 0, size = 20) =>
    request<PageResponse<AdminUserListItem>>(
      `/admin/users?kyc=PENDING&page=${page}&size=${size}`,
    ),
  verified: (page = 0, size = 20) =>
    request<PageResponse<AdminUserListItem>>(
      `/admin/users?kyc=VERIFIED&page=${page}&size=${size}`,
    ),
  setStatus: (userId: string, kycStatus: KycStatus) =>
    request<AdminUserListItem>(`/admin/users/${userId}/kyc`, {
      method: "PATCH",
      body: JSON.stringify({ kycStatus }),
    }),
};

// ---------------------------------------------------------------------------
// Finance (admin)
// ---------------------------------------------------------------------------
//
// Agrege une vue rapide cote client en attendant un endpoint backend
// /admin/analytics/finance/* dedie.

export type FinanceSummary = {
  totalGmvCents: number;
  totalFeesCents: number;
  completedOrders: number;
  pendingOrders: number;
  refundedOrders: number;
};

export const financeApi = {
  async summary(): Promise<FinanceSummary> {
    const res = await ordersApi.list({ size: 200 });
    const orders = res.content;
    const completed = orders.filter((o) => o.status === "COMPLETED");
    const pending = orders.filter((o) => o.status === "AWAITING_PICKUP" || o.status === "HANDOFF_PENDING");
    const refunded = orders.filter((o) => o.status === "REFUNDED");
    return {
      totalGmvCents: completed.reduce((acc, o) => acc + (o.amountCents ?? 0), 0),
      totalFeesCents: completed.reduce((acc, o) => acc + (o.feeCents ?? 0), 0),
      completedOrders: completed.length,
      pendingOrders: pending.length,
      refundedOrders: refunded.length,
    };
  },
  refunds: (page = 0, size = 20) =>
    ordersApi.list({ status: "REFUNDED", page, size }),
};
