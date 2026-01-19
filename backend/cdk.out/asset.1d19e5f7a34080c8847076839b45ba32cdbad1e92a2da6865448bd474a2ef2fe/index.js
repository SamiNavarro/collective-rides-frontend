"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// services/ride-service/handlers/completion/complete-ride.ts
var complete_ride_exports = {};
__export(complete_ride_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(complete_ride_exports);

// shared/utils/lambda-utils.ts
function getCorsHeaders(origin) {
  const allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://collective-rides-frontend.vercel.app",
    "https://sydneycycles.com",
    "https://collectiverides.com"
  ];
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
  };
}
function createResponse(statusCode, body, origin) {
  return {
    statusCode,
    headers: getCorsHeaders(origin),
    body: JSON.stringify(body)
  };
}
function parseJSON(body) {
  if (!body) {
    throw new Error("Request body is required");
  }
  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error("Invalid JSON in request body");
  }
}

// shared/auth/jwt-utils.ts
function extractJwtClaims(authorizerContext) {
  const { claims } = authorizerContext;
  if (!claims) {
    throw new Error("No JWT claims found in authorizer context");
  }
  if (!claims.sub) {
    throw new Error("Missing required claim: sub");
  }
  if (!claims.email) {
    throw new Error("Missing required claim: email");
  }
  if (!claims.iat) {
    throw new Error("Missing required claim: iat");
  }
  if (!claims.exp) {
    throw new Error("Missing required claim: exp");
  }
  let iat;
  let exp;
  if (typeof claims.iat === "string") {
    if (/^\d+$/.test(claims.iat)) {
      iat = parseInt(claims.iat, 10);
    } else {
      iat = Math.floor(new Date(claims.iat).getTime() / 1e3);
    }
  } else {
    iat = Number(claims.iat);
  }
  if (typeof claims.exp === "string") {
    if (/^\d+$/.test(claims.exp)) {
      exp = parseInt(claims.exp, 10);
    } else {
      exp = Math.floor(new Date(claims.exp).getTime() / 1e3);
    }
  } else {
    exp = Number(claims.exp);
  }
  if (isNaN(iat) || isNaN(exp)) {
    throw new Error("Invalid timestamp claims");
  }
  const now = Math.floor(Date.now() / 1e3);
  if (exp < now) {
    throw new Error("JWT token has expired");
  }
  return {
    sub: claims.sub,
    email: claims.email,
    iat,
    exp,
    iss: claims.iss || "",
    aud: claims.aud || "",
    "custom:system_role": claims["custom:system_role"]
  };
}
function getUserIdFromClaims(claims) {
  return claims.sub;
}
function getEmailFromClaims(claims) {
  return claims.email;
}

// shared/auth/auth-context.ts
async function getAuthContext(event) {
  return createAuthContext(event.requestContext);
}
function createAuthContext(requestContext) {
  if (!requestContext.authorizer) {
    return {
      userId: "",
      email: "",
      systemRole: "User" /* USER */,
      isAuthenticated: false,
      isSiteAdmin: false
    };
  }
  try {
    const claims = extractJwtClaims(requestContext.authorizer);
    const userId = getUserIdFromClaims(claims);
    const email = getEmailFromClaims(claims);
    const systemRole = "User" /* USER */;
    return {
      userId,
      email,
      systemRole,
      isAuthenticated: true,
      isSiteAdmin: false
      // Will be updated by service layer
    };
  } catch (error) {
    throw new Error(`Failed to create auth context: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// services/ride-service/handlers/completion/complete-ride.ts
var handler = async (event) => {
  try {
    const authContext = await getAuthContext(event);
    const clubId = event.pathParameters?.clubId;
    const rideId = event.pathParameters?.rideId;
    if (!clubId || !rideId) {
      return createResponse(400, {
        success: false,
        error: "Club ID and Ride ID are required"
      });
    }
    const request = parseJSON(event.body);
    return createResponse(200, {
      success: true,
      data: {
        rideId,
        status: "completed",
        completedAt: (/* @__PURE__ */ new Date()).toISOString(),
        completedBy: authContext.userId,
        completionNotes: request.completionNotes
      }
    });
  } catch (error) {
    console.error("Complete ride error:", error);
    if (error instanceof Error) {
      return createResponse(400, {
        success: false,
        error: error.message
      });
    }
    return createResponse(500, {
      success: false,
      error: "Internal server error"
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
