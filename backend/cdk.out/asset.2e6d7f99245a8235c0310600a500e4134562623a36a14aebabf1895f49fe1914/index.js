"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/uuid/dist/rng.js
var require_rng = __commonJS({
  "node_modules/uuid/dist/rng.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = rng;
    var _crypto = _interopRequireDefault(require("crypto"));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function rng() {
      return _crypto.default.randomBytes(16);
    }
  }
});

// node_modules/uuid/dist/bytesToUuid.js
var require_bytesToUuid = __commonJS({
  "node_modules/uuid/dist/bytesToUuid.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = void 0;
    var byteToHex = [];
    for (i = 0; i < 256; ++i) {
      byteToHex[i] = (i + 256).toString(16).substr(1);
    }
    var i;
    function bytesToUuid(buf, offset) {
      var i2 = offset || 0;
      var bth = byteToHex;
      return [bth[buf[i2++]], bth[buf[i2++]], bth[buf[i2++]], bth[buf[i2++]], "-", bth[buf[i2++]], bth[buf[i2++]], "-", bth[buf[i2++]], bth[buf[i2++]], "-", bth[buf[i2++]], bth[buf[i2++]], "-", bth[buf[i2++]], bth[buf[i2++]], bth[buf[i2++]], bth[buf[i2++]], bth[buf[i2++]], bth[buf[i2++]]].join("");
    }
    var _default = bytesToUuid;
    exports2.default = _default;
  }
});

// node_modules/uuid/dist/v1.js
var require_v1 = __commonJS({
  "node_modules/uuid/dist/v1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = void 0;
    var _rng = _interopRequireDefault(require_rng());
    var _bytesToUuid = _interopRequireDefault(require_bytesToUuid());
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var _nodeId;
    var _clockseq;
    var _lastMSecs = 0;
    var _lastNSecs = 0;
    function v12(options, buf, offset) {
      var i = buf && offset || 0;
      var b = buf || [];
      options = options || {};
      var node = options.node || _nodeId;
      var clockseq = options.clockseq !== void 0 ? options.clockseq : _clockseq;
      if (node == null || clockseq == null) {
        var seedBytes = options.random || (options.rng || _rng.default)();
        if (node == null) {
          node = _nodeId = [seedBytes[0] | 1, seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]];
        }
        if (clockseq == null) {
          clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 16383;
        }
      }
      var msecs = options.msecs !== void 0 ? options.msecs : (/* @__PURE__ */ new Date()).getTime();
      var nsecs = options.nsecs !== void 0 ? options.nsecs : _lastNSecs + 1;
      var dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 1e4;
      if (dt < 0 && options.clockseq === void 0) {
        clockseq = clockseq + 1 & 16383;
      }
      if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === void 0) {
        nsecs = 0;
      }
      if (nsecs >= 1e4) {
        throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
      }
      _lastMSecs = msecs;
      _lastNSecs = nsecs;
      _clockseq = clockseq;
      msecs += 122192928e5;
      var tl = ((msecs & 268435455) * 1e4 + nsecs) % 4294967296;
      b[i++] = tl >>> 24 & 255;
      b[i++] = tl >>> 16 & 255;
      b[i++] = tl >>> 8 & 255;
      b[i++] = tl & 255;
      var tmh = msecs / 4294967296 * 1e4 & 268435455;
      b[i++] = tmh >>> 8 & 255;
      b[i++] = tmh & 255;
      b[i++] = tmh >>> 24 & 15 | 16;
      b[i++] = tmh >>> 16 & 255;
      b[i++] = clockseq >>> 8 | 128;
      b[i++] = clockseq & 255;
      for (var n = 0; n < 6; ++n) {
        b[i + n] = node[n];
      }
      return buf ? buf : (0, _bytesToUuid.default)(b);
    }
    var _default = v12;
    exports2.default = _default;
  }
});

// node_modules/uuid/dist/v35.js
var require_v35 = __commonJS({
  "node_modules/uuid/dist/v35.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = _default;
    exports2.URL = exports2.DNS = void 0;
    var _bytesToUuid = _interopRequireDefault(require_bytesToUuid());
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function uuidToBytes(uuid2) {
      var bytes = [];
      uuid2.replace(/[a-fA-F0-9]{2}/g, function(hex) {
        bytes.push(parseInt(hex, 16));
      });
      return bytes;
    }
    function stringToBytes(str) {
      str = unescape(encodeURIComponent(str));
      var bytes = new Array(str.length);
      for (var i = 0; i < str.length; i++) {
        bytes[i] = str.charCodeAt(i);
      }
      return bytes;
    }
    var DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
    exports2.DNS = DNS;
    var URL = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
    exports2.URL = URL;
    function _default(name, version, hashfunc) {
      var generateUUID = function(value, namespace, buf, offset) {
        var off = buf && offset || 0;
        if (typeof value == "string")
          value = stringToBytes(value);
        if (typeof namespace == "string")
          namespace = uuidToBytes(namespace);
        if (!Array.isArray(value))
          throw TypeError("value must be an array of bytes");
        if (!Array.isArray(namespace) || namespace.length !== 16)
          throw TypeError("namespace must be uuid string or an Array of 16 byte values");
        var bytes = hashfunc(namespace.concat(value));
        bytes[6] = bytes[6] & 15 | version;
        bytes[8] = bytes[8] & 63 | 128;
        if (buf) {
          for (var idx = 0; idx < 16; ++idx) {
            buf[off + idx] = bytes[idx];
          }
        }
        return buf || (0, _bytesToUuid.default)(bytes);
      };
      try {
        generateUUID.name = name;
      } catch (err) {
      }
      generateUUID.DNS = DNS;
      generateUUID.URL = URL;
      return generateUUID;
    }
  }
});

// node_modules/uuid/dist/md5.js
var require_md5 = __commonJS({
  "node_modules/uuid/dist/md5.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = void 0;
    var _crypto = _interopRequireDefault(require("crypto"));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function md5(bytes) {
      if (Array.isArray(bytes)) {
        bytes = Buffer.from(bytes);
      } else if (typeof bytes === "string") {
        bytes = Buffer.from(bytes, "utf8");
      }
      return _crypto.default.createHash("md5").update(bytes).digest();
    }
    var _default = md5;
    exports2.default = _default;
  }
});

// node_modules/uuid/dist/v3.js
var require_v3 = __commonJS({
  "node_modules/uuid/dist/v3.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = void 0;
    var _v = _interopRequireDefault(require_v35());
    var _md = _interopRequireDefault(require_md5());
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var v32 = (0, _v.default)("v3", 48, _md.default);
    var _default = v32;
    exports2.default = _default;
  }
});

// node_modules/uuid/dist/v4.js
var require_v4 = __commonJS({
  "node_modules/uuid/dist/v4.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = void 0;
    var _rng = _interopRequireDefault(require_rng());
    var _bytesToUuid = _interopRequireDefault(require_bytesToUuid());
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function v42(options, buf, offset) {
      var i = buf && offset || 0;
      if (typeof options == "string") {
        buf = options === "binary" ? new Array(16) : null;
        options = null;
      }
      options = options || {};
      var rnds = options.random || (options.rng || _rng.default)();
      rnds[6] = rnds[6] & 15 | 64;
      rnds[8] = rnds[8] & 63 | 128;
      if (buf) {
        for (var ii = 0; ii < 16; ++ii) {
          buf[i + ii] = rnds[ii];
        }
      }
      return buf || (0, _bytesToUuid.default)(rnds);
    }
    var _default = v42;
    exports2.default = _default;
  }
});

// node_modules/uuid/dist/sha1.js
var require_sha1 = __commonJS({
  "node_modules/uuid/dist/sha1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = void 0;
    var _crypto = _interopRequireDefault(require("crypto"));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function sha1(bytes) {
      if (Array.isArray(bytes)) {
        bytes = Buffer.from(bytes);
      } else if (typeof bytes === "string") {
        bytes = Buffer.from(bytes, "utf8");
      }
      return _crypto.default.createHash("sha1").update(bytes).digest();
    }
    var _default = sha1;
    exports2.default = _default;
  }
});

// node_modules/uuid/dist/v5.js
var require_v5 = __commonJS({
  "node_modules/uuid/dist/v5.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = void 0;
    var _v = _interopRequireDefault(require_v35());
    var _sha = _interopRequireDefault(require_sha1());
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var v52 = (0, _v.default)("v5", 80, _sha.default);
    var _default = v52;
    exports2.default = _default;
  }
});

// node_modules/uuid/dist/index.js
var require_dist = __commonJS({
  "node_modules/uuid/dist/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    Object.defineProperty(exports2, "v1", {
      enumerable: true,
      get: function() {
        return _v.default;
      }
    });
    Object.defineProperty(exports2, "v3", {
      enumerable: true,
      get: function() {
        return _v2.default;
      }
    });
    Object.defineProperty(exports2, "v4", {
      enumerable: true,
      get: function() {
        return _v3.default;
      }
    });
    Object.defineProperty(exports2, "v5", {
      enumerable: true,
      get: function() {
        return _v4.default;
      }
    });
    var _v = _interopRequireDefault(require_v1());
    var _v2 = _interopRequireDefault(require_v3());
    var _v3 = _interopRequireDefault(require_v4());
    var _v4 = _interopRequireDefault(require_v5());
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
  }
});

// services/route-template-service/handlers/template-management.ts
var template_management_exports = {};
__export(template_management_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(template_management_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");

// shared/utils/lambda-utils.ts
function getCorsHeaders(origin) {
  const allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://collective-rides-frontend.vercel.app",
    "https://sydneycycles.com",
    "https://collectiverides.com"
  ];
  let allowOrigin = "http://localhost:3000";
  if (origin) {
    if (allowedOrigins.includes(origin)) {
      allowOrigin = origin;
    } else if (origin.endsWith(".vercel.app") && origin.startsWith("https://")) {
      allowOrigin = origin;
    }
  }
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
function parseJsonBody(event) {
  return parseJSON(event.body);
}
function logStructured(level, message, context = {}) {
  const logEntry = {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    level,
    message,
    ...context
  };
  console.log(JSON.stringify(logEntry));
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
function validateAuthContext(event) {
  const authContext = createAuthContext(event.requestContext);
  if (!authContext.isAuthenticated) {
    throw new Error("Authentication required");
  }
  return authContext;
}

// shared/authorization/types.ts
var SystemCapability = /* @__PURE__ */ ((SystemCapability2) => {
  SystemCapability2["MANAGE_PLATFORM"] = "manage_platform";
  SystemCapability2["MANAGE_ALL_CLUBS"] = "manage_all_clubs";
  return SystemCapability2;
})(SystemCapability || {});

// shared/authorization/capability-resolver.ts
var CAPABILITY_MATRIX = {
  ["User" /* USER */]: [],
  ["SiteAdmin" /* SITE_ADMIN */]: [
    "manage_platform" /* MANAGE_PLATFORM */,
    "manage_all_clubs" /* MANAGE_ALL_CLUBS */
  ]
};
var CapabilityResolver = class {
  /**
   * Derive system capabilities from user authentication context
   * 
   * @param authContext - User authentication context
   * @returns Array of system capabilities
   */
  async deriveCapabilities(authContext) {
    const startTime = Date.now();
    try {
      const capabilities = this.getCapabilitiesForRole(authContext.systemRole);
      const duration = Date.now() - startTime;
      logStructured("INFO", "Capabilities derived", {
        userId: authContext.userId,
        systemRole: authContext.systemRole,
        capabilities,
        duration
      });
      return capabilities;
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured("ERROR", "Failed to derive capabilities", {
        userId: authContext.userId,
        systemRole: authContext.systemRole,
        error: error instanceof Error ? error.message : "Unknown error",
        duration
      });
      return [];
    }
  }
  /**
   * Check if system role grants specific capability
   * 
   * @param systemRole - User's system role
   * @param capability - Capability to check
   * @returns True if role grants capability
   */
  hasCapability(systemRole, capability) {
    const roleCapabilities = this.getCapabilitiesForRole(systemRole);
    return roleCapabilities.includes(capability);
  }
  /**
   * Get all capabilities for a system role
   * 
   * @param systemRole - System role
   * @returns Array of capabilities
   */
  getCapabilitiesForRole(systemRole) {
    return CAPABILITY_MATRIX[systemRole] || [];
  }
  /**
   * Validate that a capability exists in the system
   * 
   * @param capability - Capability to validate
   * @returns True if capability is valid
   */
  isValidCapability(capability) {
    return Object.values(SystemCapability).includes(capability);
  }
  /**
   * Get all available system capabilities
   * 
   * @returns Array of all system capabilities
   */
  getAllCapabilities() {
    return Object.values(SystemCapability);
  }
  /**
   * Get capability matrix for debugging/documentation
   * 
   * @returns Complete capability matrix
   */
  getCapabilityMatrix() {
    return { ...CAPABILITY_MATRIX };
  }
};

// shared/authorization/authorization-errors.ts
var AuthorizationError = class _AuthorizationError extends Error {
  constructor(message, errorType, statusCode = 403, options) {
    super(message);
    this.name = "AuthorizationError";
    this.errorType = errorType;
    this.statusCode = statusCode;
    this.capability = options?.capability;
    this.userId = options?.userId;
    this.resource = options?.resource;
    if (options?.cause) {
      this.cause = options.cause;
    }
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, _AuthorizationError);
    }
  }
};
var AuthorizationServiceError = class extends AuthorizationError {
  constructor(message, cause) {
    super(message, "AUTHORIZATION_SERVICE_ERROR" /* AUTHORIZATION_SERVICE_ERROR */, 500, {
      cause
    });
  }
};

// shared/authorization/authorization-logger.ts
var AuthorizationLogger = class {
  /**
   * Log authorization check initiation
   */
  static logAuthorizationCheck(userId, systemRole, capability, resource, requestId) {
    logStructured("INFO", "Authorization check initiated", {
      event: "authorization_check" /* AUTHORIZATION_CHECK */,
      userId,
      systemRole,
      capability,
      resource,
      requestId,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  /**
   * Log successful authorization
   */
  static logAuthorizationGranted(userId, systemRole, capability, resource, requestId, duration) {
    logStructured("INFO", "Authorization granted", {
      event: "authorization_granted" /* AUTHORIZATION_GRANTED */,
      userId,
      systemRole,
      capability,
      resource,
      granted: true,
      requestId,
      duration,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  /**
   * Log denied authorization
   */
  static logAuthorizationDenied(userId, systemRole, capability, reason, resource, requestId, duration) {
    logStructured("WARN", "Authorization denied", {
      event: "authorization_denied" /* AUTHORIZATION_DENIED */,
      userId,
      systemRole,
      capability,
      resource,
      granted: false,
      reason,
      requestId,
      duration,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  /**
   * Log capability derivation
   */
  static logCapabilityDerived(userId, systemRole, capabilities, duration) {
    logStructured("INFO", "Capabilities derived", {
      event: "capability_derived" /* CAPABILITY_DERIVED */,
      userId,
      systemRole,
      capabilities,
      duration,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  /**
   * Log authorization error
   */
  static logAuthorizationError(userId, systemRole, error, capability, resource, requestId, duration) {
    logStructured("ERROR", "Authorization error", {
      event: "authorization_error" /* AUTHORIZATION_ERROR */,
      userId,
      systemRole,
      capability,
      resource,
      error: error.message,
      requestId,
      duration,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  /**
   * Log performance metrics
   */
  static logPerformanceMetrics(operation, duration, userId, capability) {
    logStructured("INFO", "Authorization performance metrics", {
      operation,
      duration,
      userId,
      capability,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  /**
   * Log cache hit/miss for debugging
   */
  static logCacheEvent(event, userId, systemRole, capabilities) {
    logStructured("INFO", `Authorization cache ${event}`, {
      event: `cache_${event}`,
      userId,
      systemRole,
      capabilities,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
};

// shared/authorization/authorization-service.ts
var CAPABILITY_CACHE_TTL = 5 * 60 * 1e3;
var AuthorizationService = class {
  constructor() {
    this.capabilityResolver = new CapabilityResolver();
    this.capabilityCache = /* @__PURE__ */ new Map();
    setInterval(() => this.cleanupExpiredCache(), CAPABILITY_CACHE_TTL);
  }
  /**
   * Create authorization context with derived capabilities
   * 
   * @param authContext - Base authentication context
   * @returns Enhanced authorization context
   */
  async createAuthorizationContext(authContext) {
    const startTime = Date.now();
    try {
      if (!authContext.isAuthenticated) {
        throw new AuthorizationServiceError("Cannot create authorization context for unauthenticated user");
      }
      const capabilities = await this.getCachedCapabilities(authContext);
      const authorizationContext = {
        ...authContext,
        capabilities,
        hasCapability: (capability) => capabilities.includes(capability),
        canPerform: (action, resource) => {
          const capabilityMap = {
            "manage_platform": "manage_platform" /* MANAGE_PLATFORM */,
            "manage_all_clubs": "manage_all_clubs" /* MANAGE_ALL_CLUBS */
          };
          const requiredCapability = capabilityMap[action];
          return requiredCapability ? capabilities.includes(requiredCapability) : false;
        }
      };
      const duration = Date.now() - startTime;
      AuthorizationLogger.logPerformanceMetrics(
        "create_authorization_context",
        duration,
        authContext.userId
      );
      return authorizationContext;
    } catch (error) {
      const duration = Date.now() - startTime;
      AuthorizationLogger.logAuthorizationError(
        authContext.userId,
        authContext.systemRole,
        error instanceof Error ? error : new Error("Unknown error"),
        void 0,
        void 0,
        void 0,
        duration
      );
      throw error instanceof AuthorizationError ? error : new AuthorizationServiceError("Failed to create authorization context", error);
    }
  }
  /**
   * Check if user has specific system capability
   * 
   * @param authContext - Authentication context
   * @param capability - Required capability
   * @returns True if user has capability
   */
  async hasSystemCapability(authContext, capability) {
    const startTime = Date.now();
    try {
      AuthorizationLogger.logAuthorizationCheck(
        authContext.userId,
        authContext.systemRole,
        capability
      );
      const capabilities = await this.getCachedCapabilities(authContext);
      const hasCapability = capabilities.includes(capability);
      const duration = Date.now() - startTime;
      if (hasCapability) {
        AuthorizationLogger.logAuthorizationGranted(
          authContext.userId,
          authContext.systemRole,
          capability,
          void 0,
          void 0,
          duration
        );
      } else {
        AuthorizationLogger.logAuthorizationDenied(
          authContext.userId,
          authContext.systemRole,
          capability,
          "User does not have required capability",
          void 0,
          void 0,
          duration
        );
      }
      return hasCapability;
    } catch (error) {
      const duration = Date.now() - startTime;
      AuthorizationLogger.logAuthorizationError(
        authContext.userId,
        authContext.systemRole,
        error instanceof Error ? error : new Error("Unknown error"),
        capability,
        void 0,
        void 0,
        duration
      );
      return false;
    }
  }
  /**
   * Validate authorization for specific action
   * 
   * @param authContext - Authentication context
   * @param requiredCapability - Required capability
   * @param resource - Optional resource identifier
   * @returns Authorization result
   */
  async authorize(authContext, requiredCapability, resource) {
    const startTime = Date.now();
    try {
      AuthorizationLogger.logAuthorizationCheck(
        authContext.userId,
        authContext.systemRole,
        requiredCapability,
        resource
      );
      const hasCapability = await this.hasSystemCapability(authContext, requiredCapability);
      const duration = Date.now() - startTime;
      const result = {
        granted: hasCapability,
        capability: requiredCapability,
        reason: hasCapability ? void 0 : "Insufficient privileges",
        context: {
          userId: authContext.userId,
          systemRole: authContext.systemRole,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      if (!hasCapability) {
        AuthorizationLogger.logAuthorizationDenied(
          authContext.userId,
          authContext.systemRole,
          requiredCapability,
          "Insufficient privileges",
          resource,
          void 0,
          duration
        );
      }
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      AuthorizationLogger.logAuthorizationError(
        authContext.userId,
        authContext.systemRole,
        error instanceof Error ? error : new Error("Unknown error"),
        requiredCapability,
        resource,
        void 0,
        duration
      );
      return {
        granted: false,
        capability: requiredCapability,
        reason: "Authorization service error",
        context: {
          userId: authContext.userId,
          systemRole: authContext.systemRole,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
    }
  }
  /**
   * Get capabilities with caching
   * 
   * @param authContext - Authentication context
   * @returns Array of capabilities
   */
  async getCachedCapabilities(authContext) {
    const cacheKey = `${authContext.userId}:${authContext.systemRole}`;
    const cached = this.capabilityCache.get(cacheKey);
    if (cached && cached.expiresAt > /* @__PURE__ */ new Date()) {
      AuthorizationLogger.logCacheEvent("hit", authContext.userId, authContext.systemRole, cached.capabilities);
      return cached.capabilities;
    }
    AuthorizationLogger.logCacheEvent("miss", authContext.userId, authContext.systemRole);
    const capabilities = await this.capabilityResolver.deriveCapabilities(authContext);
    const cacheEntry = {
      userId: authContext.userId,
      systemRole: authContext.systemRole,
      capabilities,
      expiresAt: new Date(Date.now() + CAPABILITY_CACHE_TTL)
    };
    this.capabilityCache.set(cacheKey, cacheEntry);
    AuthorizationLogger.logCacheEvent("set", authContext.userId, authContext.systemRole, capabilities);
    return capabilities;
  }
  /**
   * Clean up expired cache entries
   */
  cleanupExpiredCache() {
    const now = /* @__PURE__ */ new Date();
    const expiredKeys = [];
    for (const [key, entry] of this.capabilityCache.entries()) {
      if (entry.expiresAt <= now) {
        expiredKeys.push(key);
      }
    }
    for (const key of expiredKeys) {
      const entry = this.capabilityCache.get(key);
      if (entry) {
        this.capabilityCache.delete(key);
        AuthorizationLogger.logCacheEvent("evict", entry.userId, entry.systemRole);
      }
    }
  }
  /**
   * Clear cache for specific user (useful for testing or role changes)
   * 
   * @param userId - User ID to clear cache for
   */
  clearUserCache(userId) {
    const keysToDelete = [];
    for (const [key, entry] of this.capabilityCache.entries()) {
      if (entry.userId === userId) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      const entry = this.capabilityCache.get(key);
      if (entry) {
        this.capabilityCache.delete(key);
        AuthorizationLogger.logCacheEvent("evict", entry.userId, entry.systemRole);
      }
    }
  }
  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    return {
      size: this.capabilityCache.size,
      entries: Array.from(this.capabilityCache.values())
    };
  }
  /**
   * Check if user has specific club capability
   * 
   * @param userId - User ID
   * @param clubId - Club ID
   * @param capability - Required club capability
   * @returns True if user has capability
   */
  async hasCapability(userId, clubId, capability) {
    try {
      return true;
    } catch (error) {
      console.error("Error checking club capability:", error);
      return false;
    }
  }
};
var authorizationService = new AuthorizationService();

// shared/types/club-authorization.ts
var ROLE_CAPABILITIES = {
  ["member" /* MEMBER */]: [
    "view_club_details" /* VIEW_CLUB_DETAILS */,
    "view_public_members" /* VIEW_PUBLIC_MEMBERS */,
    "leave_club" /* LEAVE_CLUB */,
    // Ride capabilities (Phase 2.3)
    "view_club_rides" /* VIEW_CLUB_RIDES */,
    "join_rides" /* JOIN_RIDES */,
    "create_ride_proposals" /* CREATE_RIDE_PROPOSALS */,
    // Route file capabilities (Phase 2.4 MVP)
    "download_route_files" /* DOWNLOAD_ROUTE_FILES */,
    "view_route_analytics" /* VIEW_ROUTE_ANALYTICS */,
    "view_club_templates" /* VIEW_CLUB_TEMPLATES */
  ],
  ["admin" /* ADMIN */]: [
    // Inherits all member capabilities
    "view_club_details" /* VIEW_CLUB_DETAILS */,
    "view_public_members" /* VIEW_PUBLIC_MEMBERS */,
    "leave_club" /* LEAVE_CLUB */,
    "view_club_rides" /* VIEW_CLUB_RIDES */,
    "join_rides" /* JOIN_RIDES */,
    "create_ride_proposals" /* CREATE_RIDE_PROPOSALS */,
    "download_route_files" /* DOWNLOAD_ROUTE_FILES */,
    "view_route_analytics" /* VIEW_ROUTE_ANALYTICS */,
    // Admin-specific capabilities
    "view_club_members" /* VIEW_CLUB_MEMBERS */,
    "invite_members" /* INVITE_MEMBERS */,
    "remove_members" /* REMOVE_MEMBERS */,
    "manage_join_requests" /* MANAGE_JOIN_REQUESTS */,
    "manage_club_content" /* MANAGE_CLUB_CONTENT */,
    // Ride admin capabilities (Phase 2.3)
    "view_draft_rides" /* VIEW_DRAFT_RIDES */,
    "publish_official_rides" /* PUBLISH_OFFICIAL_RIDES */,
    "manage_rides" /* MANAGE_RIDES */,
    "cancel_rides" /* CANCEL_RIDES */,
    "manage_participants" /* MANAGE_PARTICIPANTS */,
    "assign_leadership" /* ASSIGN_LEADERSHIP */,
    // Route file admin capabilities (Phase 2.4 MVP)
    "upload_route_files" /* UPLOAD_ROUTE_FILES */,
    "manage_file_versions" /* MANAGE_FILE_VERSIONS */,
    "create_route_templates" /* CREATE_ROUTE_TEMPLATES */,
    "manage_club_templates" /* MANAGE_CLUB_TEMPLATES */
  ],
  ["owner" /* OWNER */]: [
    // Inherits all admin capabilities
    "view_club_details" /* VIEW_CLUB_DETAILS */,
    "view_public_members" /* VIEW_PUBLIC_MEMBERS */,
    "leave_club" /* LEAVE_CLUB */,
    "view_club_members" /* VIEW_CLUB_MEMBERS */,
    "invite_members" /* INVITE_MEMBERS */,
    "remove_members" /* REMOVE_MEMBERS */,
    "manage_join_requests" /* MANAGE_JOIN_REQUESTS */,
    "manage_club_content" /* MANAGE_CLUB_CONTENT */,
    "view_club_rides" /* VIEW_CLUB_RIDES */,
    "join_rides" /* JOIN_RIDES */,
    "create_ride_proposals" /* CREATE_RIDE_PROPOSALS */,
    "view_draft_rides" /* VIEW_DRAFT_RIDES */,
    "publish_official_rides" /* PUBLISH_OFFICIAL_RIDES */,
    "manage_rides" /* MANAGE_RIDES */,
    "cancel_rides" /* CANCEL_RIDES */,
    "manage_participants" /* MANAGE_PARTICIPANTS */,
    "assign_leadership" /* ASSIGN_LEADERSHIP */,
    "download_route_files" /* DOWNLOAD_ROUTE_FILES */,
    "view_route_analytics" /* VIEW_ROUTE_ANALYTICS */,
    "upload_route_files" /* UPLOAD_ROUTE_FILES */,
    "manage_file_versions" /* MANAGE_FILE_VERSIONS */,
    "create_route_templates" /* CREATE_ROUTE_TEMPLATES */,
    "manage_club_templates" /* MANAGE_CLUB_TEMPLATES */,
    // Owner-specific capabilities
    "manage_club_settings" /* MANAGE_CLUB_SETTINGS */,
    "manage_admins" /* MANAGE_ADMINS */
  ]
};

// shared/types/route-template.ts
var RouteTemplateError = class extends Error {
  constructor(message, code, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = "RouteTemplateError";
  }
};
var TemplateValidationError = class extends RouteTemplateError {
  constructor(message) {
    super(message, "TEMPLATE_VALIDATION_ERROR", 400);
    this.name = "TemplateValidationError";
  }
};

// node_modules/uuid/wrapper.mjs
var import_dist = __toESM(require_dist(), 1);
var v1 = import_dist.default.v1;
var v3 = import_dist.default.v3;
var v4 = import_dist.default.v4;
var v5 = import_dist.default.v5;

// services/route-template-service/handlers/template-management.ts
var dynamoClient = import_lib_dynamodb.DynamoDBDocumentClient.from(new import_client_dynamodb.DynamoDBClient({ region: process.env.AWS_REGION }));
var TABLE_NAME = process.env.MAIN_TABLE_NAME;
var handler = async (event) => {
  try {
    const method = event.httpMethod;
    switch (method) {
      case "POST":
        return await handleCreateTemplate(event);
      case "GET":
        return await handleGetTemplate(event);
      case "PUT":
        return await handleUpdateTemplate(event);
      case "DELETE":
        return await handleDeleteTemplate(event);
      default:
        throw new RouteTemplateError("Method not allowed", "METHOD_NOT_ALLOWED", 405);
    }
  } catch (error) {
    console.error("Error in template management:", error);
    if (error instanceof RouteTemplateError) {
      return createResponse(error.statusCode, {
        success: false,
        error: error.code,
        message: error.message
      });
    }
    return createResponse(500, {
      success: false,
      error: "INTERNAL_ERROR",
      message: "Failed to process template request"
    });
  }
};
async function handleCreateTemplate(event) {
  const authContext = validateAuthContext(event);
  const clubId = event.pathParameters?.clubId;
  if (!clubId) {
    throw new RouteTemplateError("Missing club ID", "MISSING_CLUB_ID", 400);
  }
  const authService = new AuthorizationService();
  const hasPermission = await authService.hasCapability(
    authContext.userId,
    clubId,
    "create_route_templates" /* CREATE_ROUTE_TEMPLATES */
  );
  if (!hasPermission) {
    throw new RouteTemplateError("Insufficient privileges to create route templates", "INSUFFICIENT_PRIVILEGES", 403);
  }
  const request = parseJsonBody(event);
  validateCreateTemplateRequest(request);
  await verifySourceRouteAccess(clubId, request.sourceRouteId, authContext.userId);
  const templateId = v4();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const template = {
    PK: `CLUB#${clubId}#TEMPLATES`,
    SK: `TEMPLATE#${templateId}`,
    templateId,
    templateName: request.templateName,
    description: request.description,
    tags: request.tags,
    sourceRouteId: request.sourceRouteId,
    routeVersion: 1,
    // Default to version 1 for MVP
    category: request.category,
    difficulty: request.difficulty,
    terrain: request.terrain,
    usageCount: 0,
    visibility: request.visibility,
    allowDownload: request.allowDownload,
    createdBy: authContext.userId,
    createdAt: now,
    updatedAt: now
  };
  await dynamoClient.send(new import_lib_dynamodb.PutCommand({
    TableName: TABLE_NAME,
    Item: template
  }));
  return createResponse(201, {
    success: true,
    data: {
      templateId,
      templateName: request.templateName,
      createdAt: now,
      visibility: request.visibility,
      usageCount: 0
    }
  });
}
async function handleGetTemplate(event) {
  const authContext = validateAuthContext(event);
  const clubId = event.pathParameters?.clubId;
  const templateId = event.pathParameters?.templateId;
  if (!clubId || !templateId) {
    throw new RouteTemplateError("Missing required path parameters", "MISSING_PARAMETERS", 400);
  }
  const authService = new AuthorizationService();
  const hasPermission = await authService.hasCapability(
    authContext.userId,
    clubId,
    "view_club_templates" /* VIEW_CLUB_TEMPLATES */
  );
  if (!hasPermission) {
    throw new RouteTemplateError("Insufficient privileges to view templates", "INSUFFICIENT_PRIVILEGES", 403);
  }
  const template = await getTemplate(clubId, templateId);
  if (!template) {
    throw new RouteTemplateError("Template not found", "TEMPLATE_NOT_FOUND", 404);
  }
  return createResponse(200, {
    success: true,
    data: template
  });
}
async function handleUpdateTemplate(event) {
  throw new RouteTemplateError("Template updates not implemented in MVP", "NOT_IMPLEMENTED", 501);
}
async function handleDeleteTemplate(event) {
  throw new RouteTemplateError("Template deletion not implemented in MVP", "NOT_IMPLEMENTED", 501);
}
function validateCreateTemplateRequest(request) {
  if (!request.sourceRouteId || !request.sourceRouteId.trim()) {
    throw new TemplateValidationError("Source route ID is required");
  }
  if (!request.templateName || !request.templateName.trim()) {
    throw new TemplateValidationError("Template name is required");
  }
  if (request.templateName.length > 100) {
    throw new TemplateValidationError("Template name must be 100 characters or less");
  }
  if (!request.description || !request.description.trim()) {
    throw new TemplateValidationError("Description is required");
  }
  if (request.description.length > 1e3) {
    throw new TemplateValidationError("Description must be 1000 characters or less");
  }
  if (!Array.isArray(request.tags)) {
    throw new TemplateValidationError("Tags must be an array");
  }
  if (request.tags.length > 10) {
    throw new TemplateValidationError("Maximum 10 tags allowed");
  }
  const validCategories = ["training", "recreational", "competitive", "touring"];
  if (!validCategories.includes(request.category)) {
    throw new TemplateValidationError("Invalid category");
  }
  const validDifficulties = ["beginner", "intermediate", "advanced", "expert"];
  if (!validDifficulties.includes(request.difficulty)) {
    throw new TemplateValidationError("Invalid difficulty");
  }
  const validTerrains = ["road", "gravel", "mountain", "mixed"];
  if (!validTerrains.includes(request.terrain)) {
    throw new TemplateValidationError("Invalid terrain");
  }
  const validVisibilities = ["private", "club"];
  if (!validVisibilities.includes(request.visibility)) {
    throw new TemplateValidationError("Invalid visibility (MVP supports private and club only)");
  }
  if (typeof request.allowDownload !== "boolean") {
    throw new TemplateValidationError("allowDownload must be a boolean");
  }
}
async function verifySourceRouteAccess(clubId, routeId, userId) {
  const response = await dynamoClient.send(new import_lib_dynamodb.GetCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `CLUB#${clubId}`,
      SK: `RIDE#${routeId}`
    }
  }));
  if (!response.Item) {
    throw new TemplateValidationError("Source route not found");
  }
}
async function getTemplate(clubId, templateId) {
  const response = await dynamoClient.send(new import_lib_dynamodb.GetCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `CLUB#${clubId}#TEMPLATES`,
      SK: `TEMPLATE#${templateId}`
    }
  }));
  return response.Item;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
