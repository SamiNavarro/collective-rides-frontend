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

// services/club-service/handlers/list-clubs.ts
var list_clubs_exports = {};
__export(list_clubs_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(list_clubs_exports);

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
function createSuccessResponse(data, statusCode = 200 /* OK */, origin) {
  const response = {
    success: true,
    data,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  return {
    statusCode,
    headers: getCorsHeaders(origin),
    body: JSON.stringify(response)
  };
}
function createErrorResponse(error, message, statusCode, requestId, origin) {
  const response = {
    error,
    message,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    requestId
  };
  return {
    statusCode,
    headers: getCorsHeaders(origin),
    body: JSON.stringify(response)
  };
}
function createValidationErrorResponse(message, requestId) {
  return createErrorResponse(
    "VALIDATION_ERROR" /* VALIDATION_ERROR */,
    message,
    400 /* BAD_REQUEST */,
    requestId
  );
}
function createUnauthorizedResponse(message = "Unauthorized", requestId) {
  return createErrorResponse(
    "UNAUTHORIZED" /* UNAUTHORIZED */,
    message,
    401 /* UNAUTHORIZED */,
    requestId
  );
}
function createForbiddenResponse(message = "Forbidden", requestId) {
  return createErrorResponse(
    "FORBIDDEN" /* FORBIDDEN */,
    message,
    403 /* FORBIDDEN */,
    requestId
  );
}
function createNotFoundResponse(message = "Not found", requestId) {
  return createErrorResponse(
    "NOT_FOUND" /* NOT_FOUND */,
    message,
    404 /* NOT_FOUND */,
    requestId
  );
}
function createInternalErrorResponse(message = "Internal server error", requestId) {
  return createErrorResponse(
    "INTERNAL_ERROR" /* INTERNAL_ERROR */,
    message,
    500 /* INTERNAL_SERVER_ERROR */,
    requestId
  );
}
function handleLambdaError(error, requestId) {
  console.error("Lambda error:", error, { requestId });
  if (error instanceof Error) {
    const message = error.message;
    if (message.includes("Authentication required") || message.includes("JWT")) {
      return createUnauthorizedResponse(message, requestId);
    }
    if (message.includes("privileges required") || message.includes("Forbidden")) {
      return createForbiddenResponse(message, requestId);
    }
    if (message.includes("not found") || message.includes("Not found")) {
      return createNotFoundResponse(message, requestId);
    }
    if (message.includes("validation") || message.includes("Invalid")) {
      return createValidationErrorResponse(message, requestId);
    }
  }
  return createInternalErrorResponse("An unexpected error occurred", requestId);
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

// shared/utils/errors.ts
var AppError = class extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
};
var NotFoundError = class extends AppError {
  constructor(message = "Resource not found") {
    super(message);
    this.statusCode = 404;
    this.errorType = "NOT_FOUND";
  }
};
var ValidationError = class extends AppError {
  constructor(message) {
    super(message);
    this.statusCode = 400;
    this.errorType = "VALIDATION_ERROR";
  }
};
var ConflictError = class extends AppError {
  constructor(message = "Resource conflict") {
    super(message);
    this.statusCode = 409;
    this.errorType = "CONFLICT";
  }
};

// shared/types/club.ts
var ClubStatus = /* @__PURE__ */ ((ClubStatus3) => {
  ClubStatus3["ACTIVE"] = "active";
  ClubStatus3["SUSPENDED"] = "suspended";
  ClubStatus3["ARCHIVED"] = "archived";
  return ClubStatus3;
})(ClubStatus || {});
var CLUB_CONSTRAINTS = {
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  CITY_MAX_LENGTH: 50,
  DEFAULT_LIST_LIMIT: 20,
  MAX_LIST_LIMIT: 100
};

// services/club-service/infrastructure/dynamodb-club-repository.ts
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");

// services/club-service/domain/club.ts
var ClubEntity = class _ClubEntity {
  constructor(club) {
    this.club = club;
  }
  /**
   * Get the club data
   */
  get data() {
    return { ...this.club };
  }
  /**
   * Get club ID
   */
  get id() {
    return this.club.id;
  }
  /**
   * Get club name
   */
  get name() {
    return this.club.name;
  }
  /**
   * Get club status
   */
  get status() {
    return this.club.status;
  }
  /**
   * Check if club is active
   */
  get isActive() {
    return this.club.status === "active" /* ACTIVE */;
  }
  /**
   * Check if club is suspended
   */
  get isSuspended() {
    return this.club.status === "suspended" /* SUSPENDED */;
  }
  /**
   * Check if club is archived
   */
  get isArchived() {
    return this.club.status === "archived" /* ARCHIVED */;
  }
  /**
   * Update club with new data
   */
  update(input) {
    const updatedClub = {
      ...this.club,
      ...input,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    validateClubData(updatedClub);
    return new _ClubEntity(updatedClub);
  }
  /**
   * Activate the club
   */
  activate() {
    return this.update({ status: "active" /* ACTIVE */ });
  }
  /**
   * Suspend the club
   */
  suspend() {
    return this.update({ status: "suspended" /* SUSPENDED */ });
  }
  /**
   * Archive the club
   */
  archive() {
    return this.update({ status: "archived" /* ARCHIVED */ });
  }
  /**
   * Check if club can be updated
   */
  canUpdate() {
    return this.club.status !== "archived" /* ARCHIVED */;
  }
  /**
   * Check if club is visible in public listings
   */
  isPubliclyVisible() {
    return this.club.status === "active" /* ACTIVE */;
  }
  /**
   * Get normalized name for indexing
   */
  get nameLower() {
    return this.club.name.toLowerCase().trim();
  }
};
function createClub(input) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const clubId = generateClubId();
  const club = {
    id: clubId,
    name: input.name.trim(),
    description: input.description?.trim(),
    status: "active" /* ACTIVE */,
    city: input.city?.trim(),
    logoUrl: input.logoUrl?.trim(),
    createdAt: now,
    updatedAt: now
  };
  validateClubData(club);
  return new ClubEntity(club);
}
function fromClubData(club) {
  validateClubData(club);
  return new ClubEntity(club);
}
function validateClubData(club) {
  if (club.name !== void 0) {
    if (!club.name || typeof club.name !== "string") {
      throw new ValidationError("Club name is required");
    }
    const trimmedName = club.name.trim();
    if (trimmedName.length < CLUB_CONSTRAINTS.NAME_MIN_LENGTH) {
      throw new ValidationError("Club name is too short");
    }
    if (trimmedName.length > CLUB_CONSTRAINTS.NAME_MAX_LENGTH) {
      throw new ValidationError("Club name is too long");
    }
  }
  if (club.description !== void 0 && club.description !== null) {
    if (typeof club.description !== "string") {
      throw new ValidationError("Club description must be a string");
    }
    if (club.description.length > CLUB_CONSTRAINTS.DESCRIPTION_MAX_LENGTH) {
      throw new ValidationError("Club description is too long");
    }
  }
  if (club.city !== void 0 && club.city !== null) {
    if (typeof club.city !== "string") {
      throw new ValidationError("Club city must be a string");
    }
    if (club.city.length > CLUB_CONSTRAINTS.CITY_MAX_LENGTH) {
      throw new ValidationError("Club city name is too long");
    }
  }
  if (club.logoUrl !== void 0 && club.logoUrl !== null) {
    if (typeof club.logoUrl !== "string") {
      throw new ValidationError("Club logo URL must be a string");
    }
    try {
      new URL(club.logoUrl);
    } catch {
      throw new ValidationError("Club logo URL is not valid");
    }
  }
  if (club.status !== void 0) {
    if (!Object.values(ClubStatus).includes(club.status)) {
      throw new ValidationError("Invalid club status");
    }
  }
}
function validateCreateClubInput(input) {
  if (!input || typeof input !== "object") {
    throw new ValidationError("Invalid club data");
  }
  if (!input.name) {
    throw new ValidationError("Club name is required");
  }
  validateClubData({
    name: input.name,
    description: input.description,
    city: input.city,
    logoUrl: input.logoUrl
  });
}
function validateUpdateClubInput(input) {
  if (!input || typeof input !== "object") {
    throw new ValidationError("Invalid club update data");
  }
  const hasUpdates = Object.keys(input).length > 0;
  if (!hasUpdates) {
    throw new ValidationError("At least one field must be updated");
  }
  validateClubData(input);
}
function generateClubId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `club_${timestamp}_${random}`;
}
function normalizeClubName(name) {
  return name.toLowerCase().trim();
}
var CLUB_STATUS_TRANSITIONS = {
  ["active" /* ACTIVE */]: ["suspended" /* SUSPENDED */, "archived" /* ARCHIVED */],
  ["suspended" /* SUSPENDED */]: ["active" /* ACTIVE */, "archived" /* ARCHIVED */],
  ["archived" /* ARCHIVED */]: []
  // Archived clubs cannot transition to other states
};
function isValidStatusTransition(from, to) {
  return CLUB_STATUS_TRANSITIONS[from].includes(to);
}

// services/club-service/infrastructure/dynamodb-club-repository.ts
var DynamoDBClubRepository = class {
  constructor(tableName, dynamoClient) {
    this.tableName = tableName;
    const client = dynamoClient || new import_client_dynamodb.DynamoDBClient({});
    this.docClient = import_lib_dynamodb.DynamoDBDocumentClient.from(client);
  }
  /**
   * Get club by ID
   */
  async getClubById(id) {
    const startTime = Date.now();
    try {
      const command = new import_lib_dynamodb.GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `CLUB#${id}`,
          SK: "METADATA"
        }
      });
      const result = await this.docClient.send(command);
      const duration = Date.now() - startTime;
      if (!result.Item) {
        logStructured("INFO", "Club not found", {
          clubId: id,
          duration
        });
        return null;
      }
      const club = this.mapDynamoItemToClub(result.Item);
      logStructured("INFO", "Club retrieved successfully", {
        clubId: id,
        duration
      });
      return club;
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured("ERROR", "Failed to get club by ID", {
        clubId: id,
        error: error instanceof Error ? error.message : "Unknown error",
        duration
      });
      throw error;
    }
  }
  /**
   * List clubs with pagination and filtering
   */
  async listClubs(options) {
    const startTime = Date.now();
    const limit = options.limit || CLUB_CONSTRAINTS.DEFAULT_LIST_LIMIT;
    try {
      const queryParams = {
        TableName: this.tableName,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk",
        ExpressionAttributeValues: {
          ":pk": "INDEX#CLUB"
        },
        Limit: limit + 1,
        // Get one extra to determine if there are more results
        ScanIndexForward: true
        // Sort by GSI1SK (name-based)
      };
      if (options.status) {
        queryParams.FilterExpression = "#status = :status";
        queryParams.ExpressionAttributeNames = {
          "#status": "status"
        };
        queryParams.ExpressionAttributeValues[":status"] = options.status;
      }
      if (options.cursor) {
        const cursor = this.decodeCursor(options.cursor);
        queryParams.ExclusiveStartKey = {
          GSI1PK: "INDEX#CLUB",
          GSI1SK: `NAME#${cursor.nameLower}#ID#${cursor.clubId}`,
          PK: "INDEX#CLUB",
          SK: `NAME#${cursor.nameLower}#ID#${cursor.clubId}`
        };
      }
      const command = new import_lib_dynamodb.QueryCommand(queryParams);
      const result = await this.docClient.send(command);
      const duration = Date.now() - startTime;
      const items = result.Items || [];
      const hasMore = items.length > limit;
      const clubs = items.slice(0, limit).map((item) => this.indexItemToClub(item));
      let nextCursor;
      if (hasMore) {
        const lastClub = clubs[clubs.length - 1];
        nextCursor = this.encodeCursor({
          nameLower: normalizeClubName(lastClub.name),
          clubId: lastClub.id
        });
      }
      logStructured("INFO", "Clubs listed successfully", {
        count: clubs.length,
        hasMore,
        duration,
        status: options.status
      });
      return {
        clubs,
        nextCursor
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured("ERROR", "Failed to list clubs", {
        error: error instanceof Error ? error.message : "Unknown error",
        duration,
        options
      });
      throw error;
    }
  }
  /**
   * Create a new club
   */
  async createClub(input) {
    const startTime = Date.now();
    try {
      const clubEntity = createClub(input);
      const club = clubEntity.data;
      const clubItem = {
        PK: `CLUB#${club.id}`,
        SK: "METADATA",
        entityType: "CLUB",
        id: club.id,
        name: club.name,
        nameLower: normalizeClubName(club.name),
        description: club.description,
        city: club.city,
        logoUrl: club.logoUrl,
        status: club.status,
        createdAt: club.createdAt,
        updatedAt: club.updatedAt
      };
      const indexItem = {
        PK: "INDEX#CLUB",
        SK: `NAME#${clubItem.nameLower}#ID#${club.id}`,
        GSI1PK: "INDEX#CLUB",
        GSI1SK: `NAME#${clubItem.nameLower}#ID#${club.id}`,
        entityType: "CLUB_INDEX",
        clubId: club.id,
        name: club.name,
        nameLower: clubItem.nameLower,
        status: club.status,
        city: club.city,
        createdAt: club.createdAt,
        updatedAt: club.updatedAt
      };
      const transactParams = {
        TransactItems: [
          {
            Put: {
              TableName: this.tableName,
              Item: clubItem,
              ConditionExpression: "attribute_not_exists(PK)"
              // Ensure club doesn't already exist
            }
          },
          {
            Put: {
              TableName: this.tableName,
              Item: indexItem
            }
          }
        ]
      };
      const command = new import_lib_dynamodb.TransactWriteCommand(transactParams);
      await this.docClient.send(command);
      const duration = Date.now() - startTime;
      logStructured("INFO", "Club created successfully", {
        clubId: club.id,
        clubName: club.name,
        duration
      });
      return club;
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured("ERROR", "Failed to create club", {
        clubName: input.name,
        error: error instanceof Error ? error.message : "Unknown error",
        duration
      });
      throw error;
    }
  }
  /**
   * Update an existing club
   */
  async updateClub(id, input) {
    const startTime = Date.now();
    try {
      const existingClub = await this.getClubById(id);
      if (!existingClub) {
        throw new NotFoundError("Club not found");
      }
      const updatedClub = {
        ...existingClub,
        ...input,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      const transactItems = [];
      const clubItem = {
        PK: `CLUB#${id}`,
        SK: "METADATA",
        entityType: "CLUB",
        id: updatedClub.id,
        name: updatedClub.name,
        nameLower: normalizeClubName(updatedClub.name),
        description: updatedClub.description,
        city: updatedClub.city,
        logoUrl: updatedClub.logoUrl,
        status: updatedClub.status,
        createdAt: updatedClub.createdAt,
        updatedAt: updatedClub.updatedAt
      };
      transactItems.push({
        Put: {
          TableName: this.tableName,
          Item: clubItem
        }
      });
      const nameChanged = normalizeClubName(updatedClub.name) !== normalizeClubName(existingClub.name);
      if (nameChanged) {
        transactItems.push({
          Delete: {
            TableName: this.tableName,
            Key: {
              PK: "INDEX#CLUB",
              SK: `NAME#${normalizeClubName(existingClub.name)}#ID#${id}`
            }
          }
        });
        const newIndexItem = {
          PK: "INDEX#CLUB",
          SK: `NAME#${clubItem.nameLower}#ID#${id}`,
          GSI1PK: "INDEX#CLUB",
          GSI1SK: `NAME#${clubItem.nameLower}#ID#${id}`,
          entityType: "CLUB_INDEX",
          clubId: id,
          name: updatedClub.name,
          nameLower: clubItem.nameLower,
          status: updatedClub.status,
          city: updatedClub.city,
          createdAt: updatedClub.createdAt,
          updatedAt: updatedClub.updatedAt
        };
        transactItems.push({
          Put: {
            TableName: this.tableName,
            Item: newIndexItem
          }
        });
      } else {
        const indexItem = {
          PK: "INDEX#CLUB",
          SK: `NAME#${clubItem.nameLower}#ID#${id}`,
          GSI1PK: "INDEX#CLUB",
          GSI1SK: `NAME#${clubItem.nameLower}#ID#${id}`,
          entityType: "CLUB_INDEX",
          clubId: id,
          name: updatedClub.name,
          nameLower: clubItem.nameLower,
          status: updatedClub.status,
          city: updatedClub.city,
          createdAt: updatedClub.createdAt,
          updatedAt: updatedClub.updatedAt
        };
        transactItems.push({
          Put: {
            TableName: this.tableName,
            Item: indexItem
          }
        });
      }
      const transactParams = {
        TransactItems: transactItems
      };
      const command = new import_lib_dynamodb.TransactWriteCommand(transactParams);
      await this.docClient.send(command);
      const duration = Date.now() - startTime;
      logStructured("INFO", "Club updated successfully", {
        clubId: id,
        clubName: updatedClub.name,
        nameChanged,
        duration
      });
      return updatedClub;
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured("ERROR", "Failed to update club", {
        clubId: id,
        error: error instanceof Error ? error.message : "Unknown error",
        duration
      });
      throw error;
    }
  }
  /**
   * Check if club exists
   */
  async clubExists(id) {
    const club = await this.getClubById(id);
    return club !== null;
  }
  /**
   * Check if club name is unique
   */
  async isClubNameUnique(name, excludeId) {
    const startTime = Date.now();
    try {
      const nameLower = normalizeClubName(name);
      const command = new import_lib_dynamodb.QueryCommand({
        TableName: this.tableName,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk AND begins_with(GSI1SK, :namePrefix)",
        ExpressionAttributeValues: {
          ":pk": "INDEX#CLUB",
          ":namePrefix": `NAME#${nameLower}#`
        },
        Limit: 10
        // Should be very few matches for exact name
      });
      const result = await this.docClient.send(command);
      const duration = Date.now() - startTime;
      const items = result.Items || [];
      const conflictingClub = items.find((item) => {
        const indexItem = item;
        return indexItem.nameLower === nameLower && (!excludeId || indexItem.clubId !== excludeId);
      });
      const isUnique = !conflictingClub;
      logStructured("INFO", "Club name uniqueness check completed", {
        name,
        isUnique,
        excludeId,
        duration
      });
      return isUnique;
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured("ERROR", "Failed to check club name uniqueness", {
        name,
        error: error instanceof Error ? error.message : "Unknown error",
        duration
      });
      throw error;
    }
  }
  /**
   * Get clubs by status
   */
  async getClubsByStatus(status, limit) {
    const result = await this.listClubs({
      status,
      limit: limit || CLUB_CONSTRAINTS.DEFAULT_LIST_LIMIT
    });
    return result.clubs;
  }
  /**
   * Search clubs by name
   */
  async searchClubsByName(nameQuery, limit) {
    const result = await this.listClubs({
      limit: limit || CLUB_CONSTRAINTS.DEFAULT_LIST_LIMIT
    });
    const query = nameQuery.toLowerCase();
    return result.clubs.filter(
      (club) => club.name.toLowerCase().includes(query)
    );
  }
  /**
   * Map DynamoDB item to Club
   */
  mapDynamoItemToClub(item) {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      status: item.status,
      city: item.city,
      logoUrl: item.logoUrl,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }
  /**
   * Map index item to Club (minimal data)
   */
  indexItemToClub(item) {
    return {
      id: item.clubId,
      name: item.name,
      status: item.status,
      city: item.city,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
      // Note: description and logoUrl are not in index items
      // They would need to be fetched separately if needed
    };
  }
  /**
   * Encode cursor for pagination
   */
  encodeCursor(cursor) {
    const cursorData = JSON.stringify(cursor);
    return Buffer.from(cursorData).toString("base64");
  }
  /**
   * Decode cursor for pagination
   */
  decodeCursor(cursor) {
    try {
      const cursorData = Buffer.from(cursor, "base64").toString("utf-8");
      return JSON.parse(cursorData);
    } catch (error) {
      throw new Error("Invalid pagination cursor");
    }
  }
};

// services/club-service/domain/club-service.ts
var ClubService = class {
  constructor(clubRepository2) {
    this.clubRepository = clubRepository2;
  }
  /**
   * Get club by ID
   * 
   * @param id - Club ID
   * @returns Club if found
   * @throws NotFoundError if club doesn't exist
   */
  async getClubById(id) {
    if (!id || typeof id !== "string") {
      throw new ValidationError("Club ID is required");
    }
    const club = await this.clubRepository.getClubById(id);
    if (!club) {
      throw new NotFoundError("Club not found");
    }
    return club;
  }
  /**
   * List clubs with pagination and filtering
   * 
   * @param options - List options
   * @returns Paginated list of clubs
   */
  async listClubs(options = {}) {
    const validatedOptions = this.validateListOptions(options);
    logStructured("INFO", "Listing clubs", {
      limit: validatedOptions.limit,
      status: validatedOptions.status,
      hasCursor: !!validatedOptions.cursor
    });
    const result = await this.clubRepository.listClubs(validatedOptions);
    logStructured("INFO", "Clubs listed successfully", {
      count: result.clubs.length,
      hasNextCursor: !!result.nextCursor
    });
    return result;
  }
  /**
   * Create a new club
   * 
   * @param input - Club creation data
   * @returns Created club
   * @throws ValidationError if input is invalid
   * @throws ConflictError if club name already exists
   */
  async createClub(input) {
    validateCreateClubInput(input);
    const isNameUnique = await this.clubRepository.isClubNameUnique(input.name);
    if (!isNameUnique) {
      throw new ConflictError("Club name already exists");
    }
    const clubEntity = createClub(input);
    logStructured("INFO", "Creating club", {
      clubName: input.name,
      city: input.city
    });
    const createdClub = await this.clubRepository.createClub(input);
    logStructured("INFO", "Club created successfully", {
      clubId: createdClub.id,
      clubName: createdClub.name
    });
    return createdClub;
  }
  /**
   * Update an existing club
   * 
   * @param id - Club ID
   * @param input - Club update data
   * @returns Updated club
   * @throws NotFoundError if club doesn't exist
   * @throws ValidationError if input is invalid
   * @throws ConflictError if name conflicts with existing club
   */
  async updateClub(id, input) {
    if (!id || typeof id !== "string") {
      throw new ValidationError("Club ID is required");
    }
    validateUpdateClubInput(input);
    const existingClub = await this.getClubById(id);
    const clubEntity = fromClubData(existingClub);
    if (!clubEntity.canUpdate()) {
      throw new ValidationError("Archived clubs cannot be updated");
    }
    if (input.status && input.status !== existingClub.status) {
      if (!isValidStatusTransition(existingClub.status, input.status)) {
        throw new ValidationError(`Cannot transition from ${existingClub.status} to ${input.status}`);
      }
    }
    if (input.name && normalizeClubName(input.name) !== normalizeClubName(existingClub.name)) {
      const isNameUnique = await this.clubRepository.isClubNameUnique(input.name, id);
      if (!isNameUnique) {
        throw new ConflictError("Club name already exists");
      }
    }
    logStructured("INFO", "Updating club", {
      clubId: id,
      updateFields: Object.keys(input)
    });
    const updatedClub = await this.clubRepository.updateClub(id, input);
    logStructured("INFO", "Club updated successfully", {
      clubId: id,
      clubName: updatedClub.name,
      status: updatedClub.status
    });
    return updatedClub;
  }
  /**
   * Check if club exists
   * 
   * @param id - Club ID
   * @returns True if club exists
   */
  async clubExists(id) {
    if (!id || typeof id !== "string") {
      return false;
    }
    return await this.clubRepository.clubExists(id);
  }
  /**
   * Get clubs by status
   * 
   * @param status - Club status
   * @param limit - Maximum number of clubs
   * @returns List of clubs
   */
  async getClubsByStatus(status, limit) {
    if (!Object.values(ClubStatus).includes(status)) {
      throw new ValidationError("Invalid club status");
    }
    return await this.clubRepository.getClubsByStatus(status, limit);
  }
  /**
   * Search clubs by name
   * 
   * @param nameQuery - Name search query
   * @param limit - Maximum number of results
   * @returns List of matching clubs
   */
  async searchClubsByName(nameQuery, limit) {
    if (!nameQuery || typeof nameQuery !== "string") {
      throw new ValidationError("Search query is required");
    }
    const trimmedQuery = nameQuery.trim();
    if (trimmedQuery.length === 0) {
      throw new ValidationError("Search query cannot be empty");
    }
    return await this.clubRepository.searchClubsByName(trimmedQuery, limit);
  }
  /**
   * Validate list options
   * 
   * @param options - List options to validate
   * @returns Validated options with defaults
   */
  validateListOptions(options) {
    const validated = { ...options };
    if (validated.limit === void 0) {
      validated.limit = CLUB_CONSTRAINTS.DEFAULT_LIST_LIMIT;
    } else {
      if (typeof validated.limit !== "number" || validated.limit < 1) {
        throw new ValidationError("Limit must be a positive number");
      }
      if (validated.limit > CLUB_CONSTRAINTS.MAX_LIST_LIMIT) {
        validated.limit = CLUB_CONSTRAINTS.MAX_LIST_LIMIT;
      }
    }
    if (validated.status !== void 0) {
      if (!Object.values(ClubStatus).includes(validated.status)) {
        throw new ValidationError("Invalid status filter");
      }
    } else {
      validated.status = "active" /* ACTIVE */;
    }
    if (validated.cursor !== void 0) {
      if (typeof validated.cursor !== "string" || validated.cursor.trim().length === 0) {
        throw new ValidationError("Invalid pagination cursor");
      }
    }
    return validated;
  }
};

// services/club-service/handlers/list-clubs.ts
var TABLE_NAME = process.env.TABLE_NAME;
var clubRepository = new DynamoDBClubRepository(TABLE_NAME);
var clubService = new ClubService(clubRepository);
async function handler(event) {
  const requestId = event.requestContext.requestId;
  const origin = event.headers.origin || event.headers.Origin;
  logStructured("INFO", "Processing list clubs request", {
    requestId,
    httpMethod: event.httpMethod,
    path: event.path,
    queryParams: event.queryStringParameters,
    origin
  });
  try {
    const queryParams = event.queryStringParameters || {};
    const limit = parseLimit(queryParams.limit);
    const cursor = queryParams.cursor;
    const status = parseStatus(queryParams.status);
    logStructured("INFO", "Parsed query parameters", {
      requestId,
      limit,
      status,
      hasCursor: !!cursor
    });
    const result = await clubService.listClubs({
      limit,
      cursor,
      status
    });
    const response = {
      success: true,
      data: result.clubs,
      pagination: {
        limit,
        ...result.nextCursor && { nextCursor: result.nextCursor }
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    logStructured("INFO", "Clubs listed successfully", {
      requestId,
      count: result.clubs.length,
      hasNextCursor: !!result.nextCursor
    });
    return createSuccessResponse(response, void 0, origin);
  } catch (error) {
    logStructured("ERROR", "Error processing list clubs request", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return handleLambdaError(error, requestId);
  }
}
function parseLimit(limitParam) {
  if (!limitParam) {
    return CLUB_CONSTRAINTS.DEFAULT_LIST_LIMIT;
  }
  const limit = parseInt(limitParam, 10);
  if (isNaN(limit) || limit < 1) {
    throw new ValidationError("Limit must be a positive number");
  }
  if (limit > CLUB_CONSTRAINTS.MAX_LIST_LIMIT) {
    return CLUB_CONSTRAINTS.MAX_LIST_LIMIT;
  }
  return limit;
}
function parseStatus(statusParam) {
  if (!statusParam) {
    return "active" /* ACTIVE */;
  }
  const status = statusParam.toLowerCase();
  switch (status) {
    case "active":
      return "active" /* ACTIVE */;
    case "suspended":
      return "suspended" /* SUSPENDED */;
    case "archived":
      return "archived" /* ARCHIVED */;
    default:
      throw new ValidationError(`Invalid status: ${statusParam}. Must be one of: active, suspended, archived`);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
