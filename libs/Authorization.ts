/**
 * Role-Based Access Control Middleware
 * Ensures proper authorization on all protected routes
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/libs/Auth";
import { hasAccess } from "@/libs/Permission";

export interface AuthContext {
  userId: string;
  username: string;
  role: string;
  permissions: string[];
}

/**
 * Verify session and return auth context
 */
export async function verifyAuth(
  request: NextRequest,
): Promise<AuthContext | null> {
  try {
    const session = await getSession();

    if (!session || !session.user) {
      return null;
    }

    return {
      userId: session.user.id,
      username: session.user.username,
      role: session.user.Role?.name || "guest",
      permissions: session.user.Role?.permission
        ? JSON.parse(session.user.Role.permission)
        : [],
    };
  } catch (error) {
    console.error("[AUTH] Session verification failed:", error);
    return null;
  }
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(
  request: NextRequest,
): Promise<NextResponse | null> {
  const auth = await verifyAuth(request);

  if (!auth) {
    return NextResponse.json(
      {
        success: false,
        status: 401,
        message: "Unauthorized - Please login",
      },
      { status: 401 },
    );
  }

  return null; // No error, continue
}

/**
 * Middleware to check specific permission
 */
export async function requirePermission(
  request: NextRequest,
  requiredPath: string,
  requiredAction: "read" | "write" | "update" | "delete",
): Promise<NextResponse | null> {
  // First check auth
  const authError = await requireAuth(request);
  if (authError) return authError;

  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, status: 401, message: "Unauthorized" },
      { status: 401 },
    );
  }

  // Check permission
  const hasPermission = hasAccess(
    session.user.Role,
    requiredPath,
    requiredAction,
  );

  if (!hasPermission) {
    return NextResponse.json(
      {
        success: false,
        status: 403,
        message: `Forbidden - You don't have permission to ${requiredAction} ${requiredPath}`,
      },
      { status: 403 },
    );
  }

  return null; // Has permission, continue
}

/**
 * Middleware to check specific role
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: string[],
): Promise<NextResponse | null> {
  // First check auth
  const authError = await requireAuth(request);
  if (authError) return authError;

  const session = await getSession();
  if (!session?.user?.Role) {
    return NextResponse.json(
      { success: false, status: 403, message: "Forbidden" },
      { status: 403 },
    );
  }

  const userRole = session.user.Role.name;

  if (!allowedRoles.includes(userRole)) {
    return NextResponse.json(
      {
        success: false,
        status: 403,
        message: `Forbidden - Only ${allowedRoles.join(", ")} can access this resource`,
      },
      { status: 403 },
    );
  }

  return null; // Has role, continue
}

/**
 * Extract auth context into request locals
 * Usage in API route:
 * const auth = (request as any).auth;
 */
export async function attachAuthContext(request: NextRequest) {
  const auth = await verifyAuth(request);
  (request as any).auth = auth;
  return request;
}

/**
 * Log audit trail
 */
export async function logAuditTrail(
  userId: string,
  action: string,
  resource: string,
  details?: Record<string, any>,
) {
  try {
    // TODO: Implement audit logging to database
    console.log(`[AUDIT] ${userId} - ${action} on ${resource}`, details);
  } catch (error) {
    console.error("[AUDIT_LOG_ERROR]", error);
  }
}
