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

// services/ride-service/handlers/ride/list-rides.ts
var list_rides_exports = {};
__export(list_rides_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(list_rides_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");

// shared/utils/lambda-utils.ts
function createResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
    },
    body: JSON.stringify(body)
  };
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

// services/ride-service/infrastructure/dynamodb-ride-repository.ts
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");

// shared/utils/id-generator.ts
var import_crypto = require("crypto");
function generateId(prefix) {
  const timestamp = Date.now().toString(36);
  const random = (0, import_crypto.randomBytes)(6).toString("hex");
  return `${prefix}_${timestamp}_${random}`;
}

// services/ride-service/domain/ride/ride.ts
var RideEntity = class _RideEntity {
  constructor(ride) {
    this.ride = ride;
  }
  static create(request, createdBy, clubId) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const rideId = generateId("ride");
    const initialStatus = request.publishImmediately ? "published" /* PUBLISHED */ : "draft" /* DRAFT */;
    const initialAudience = initialStatus === "published" /* PUBLISHED */ ? "members_only" /* MEMBERS_ONLY */ : "invite_only" /* INVITE_ONLY */;
    const ride = {
      rideId,
      clubId,
      title: request.title,
      description: request.description,
      rideType: request.rideType,
      difficulty: request.difficulty,
      status: initialStatus,
      scope: "club" /* CLUB */,
      // Phase 2.3 only supports club rides
      audience: initialAudience,
      startDateTime: request.startDateTime,
      estimatedDuration: request.estimatedDuration,
      maxParticipants: request.maxParticipants,
      currentParticipants: 1,
      // Creator is automatically a participant
      waitlistCount: 0,
      createdBy,
      createdAt: now,
      updatedAt: now,
      publishedBy: request.publishImmediately ? createdBy : void 0,
      publishedAt: request.publishImmediately ? now : void 0,
      meetingPoint: request.meetingPoint,
      route: request.route,
      requirements: request.requirements,
      isPublic: request.isPublic || false,
      allowWaitlist: request.allowWaitlist || true
    };
    return new _RideEntity(ride);
  }
  // Getters
  get rideId() {
    return this.ride.rideId;
  }
  get clubId() {
    return this.ride.clubId;
  }
  get title() {
    return this.ride.title;
  }
  get status() {
    return this.ride.status;
  }
  get scope() {
    return this.ride.scope;
  }
  get audience() {
    return this.ride.audience;
  }
  get createdBy() {
    return this.ride.createdBy;
  }
  get startDateTime() {
    return this.ride.startDateTime;
  }
  get currentParticipants() {
    return this.ride.currentParticipants;
  }
  get maxParticipants() {
    return this.ride.maxParticipants;
  }
  toJSON() {
    return { ...this.ride };
  }
  // Business methods
  canBePublished() {
    return this.ride.status === "draft" /* DRAFT */;
  }
  canBeUpdated() {
    return this.ride.status === "draft" /* DRAFT */ || this.ride.status === "published" /* PUBLISHED */;
  }
  canBeCancelled() {
    return this.ride.status === "draft" /* DRAFT */ || this.ride.status === "published" /* PUBLISHED */ || this.ride.status === "active" /* ACTIVE */;
  }
  canAcceptParticipants() {
    if (this.ride.status !== "published" /* PUBLISHED */)
      return false;
    if (!this.ride.maxParticipants)
      return true;
    return this.ride.currentParticipants < this.ride.maxParticipants;
  }
  isWaitlistAvailable() {
    return this.ride.allowWaitlist && this.ride.maxParticipants !== void 0 && this.ride.currentParticipants >= this.ride.maxParticipants;
  }
  publish(publishedBy, audience, isPublic) {
    if (!this.canBePublished()) {
      throw new Error("Ride cannot be published in current status");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    this.ride.status = "published" /* PUBLISHED */;
    this.ride.audience = audience || "members_only" /* MEMBERS_ONLY */;
    this.ride.publishedBy = publishedBy;
    this.ride.publishedAt = now;
    this.ride.updatedAt = now;
    if (isPublic !== void 0) {
      this.ride.isPublic = isPublic;
    }
  }
  update(request) {
    if (!this.canBeUpdated()) {
      throw new Error("Ride cannot be updated in current status");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (request.title !== void 0)
      this.ride.title = request.title;
    if (request.description !== void 0)
      this.ride.description = request.description;
    if (request.startDateTime !== void 0)
      this.ride.startDateTime = request.startDateTime;
    if (request.estimatedDuration !== void 0)
      this.ride.estimatedDuration = request.estimatedDuration;
    if (request.maxParticipants !== void 0)
      this.ride.maxParticipants = request.maxParticipants;
    if (request.meetingPoint !== void 0)
      this.ride.meetingPoint = request.meetingPoint;
    if (request.route !== void 0)
      this.ride.route = request.route;
    if (request.requirements !== void 0)
      this.ride.requirements = request.requirements;
    if (request.isPublic !== void 0)
      this.ride.isPublic = request.isPublic;
    if (request.allowWaitlist !== void 0)
      this.ride.allowWaitlist = request.allowWaitlist;
    this.ride.updatedAt = now;
  }
  cancel(reason) {
    if (!this.canBeCancelled()) {
      throw new Error("Ride cannot be cancelled in current status");
    }
    this.ride.status = "cancelled" /* CANCELLED */;
    this.ride.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  }
  activate() {
    if (this.ride.status !== "published" /* PUBLISHED */) {
      throw new Error("Only published rides can be activated");
    }
    this.ride.status = "active" /* ACTIVE */;
    this.ride.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  }
  complete() {
    if (this.ride.status !== "active" /* ACTIVE */) {
      throw new Error("Only active rides can be completed");
    }
    this.ride.status = "completed" /* COMPLETED */;
    this.ride.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  }
  incrementParticipants() {
    this.ride.currentParticipants++;
    this.ride.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  }
  decrementParticipants() {
    if (this.ride.currentParticipants > 0) {
      this.ride.currentParticipants--;
      this.ride.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    }
  }
  incrementWaitlist() {
    this.ride.waitlistCount = (this.ride.waitlistCount || 0) + 1;
    this.ride.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  }
  decrementWaitlist() {
    if (this.ride.waitlistCount && this.ride.waitlistCount > 0) {
      this.ride.waitlistCount--;
      this.ride.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    }
  }
};

// services/ride-service/infrastructure/dynamodb-ride-repository.ts
var DynamoDBRideRepository = class {
  constructor(dynamoClient2, tableName2) {
    this.docClient = import_lib_dynamodb.DynamoDBDocumentClient.from(dynamoClient2);
    this.tableName = tableName2;
  }
  async create(ride) {
    const rideData = ride.toJSON();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const items = [
      // Main ride item
      {
        Put: {
          TableName: this.tableName,
          Item: {
            PK: `CLUB#${rideData.clubId}`,
            SK: `RIDE#${rideData.rideId}`,
            GSI1PK: `RIDE#${rideData.rideId}`,
            GSI1SK: "METADATA",
            entityType: "RIDE",
            ...rideData
          }
        }
      },
      // Club ride index item
      {
        Put: {
          TableName: this.tableName,
          Item: {
            PK: `CLUB#${rideData.clubId}#RIDES`,
            SK: `DATE#${rideData.startDateTime.split("T")[0]}#RIDE#${rideData.rideId}`,
            GSI2PK: `CLUB#${rideData.clubId}#RIDES#${rideData.status}`,
            GSI2SK: `DATE#${rideData.startDateTime.split("T")[0]}#RIDE#${rideData.rideId}`,
            entityType: "CLUB_RIDE_INDEX",
            rideId: rideData.rideId,
            title: rideData.title,
            rideType: rideData.rideType,
            difficulty: rideData.difficulty,
            status: rideData.status,
            startDateTime: rideData.startDateTime,
            currentParticipants: rideData.currentParticipants,
            maxParticipants: rideData.maxParticipants,
            createdBy: rideData.createdBy,
            publishedBy: rideData.publishedBy,
            publishedAt: rideData.publishedAt
          }
        }
      }
    ];
    await this.docClient.send(new import_lib_dynamodb.TransactWriteCommand({ TransactItems: items }));
  }
  async findById(rideId) {
    const result = await this.docClient.send(new import_lib_dynamodb.QueryCommand({
      TableName: this.tableName,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk AND GSI1SK = :sk",
      ExpressionAttributeValues: {
        ":pk": `RIDE#${rideId}`,
        ":sk": "METADATA"
      }
    }));
    if (!result.Items || result.Items.length === 0) {
      return null;
    }
    const item = result.Items[0];
    return new RideEntity(item);
  }
  async findByClubId(clubId, query) {
    let keyCondition;
    let expressionAttributeValues;
    if (query.status) {
      keyCondition = "GSI2PK = :pk";
      expressionAttributeValues = {
        ":pk": `CLUB#${clubId}#RIDES#${query.status}`
      };
    } else {
      keyCondition = "PK = :pk";
      expressionAttributeValues = {
        ":pk": `CLUB#${clubId}#RIDES`
      };
    }
    if (query.startDate || query.endDate) {
      if (query.startDate && query.endDate) {
        keyCondition += " AND SK BETWEEN :startDate AND :endDate";
        expressionAttributeValues[":startDate"] = `DATE#${query.startDate}#RIDE#`;
        expressionAttributeValues[":endDate"] = `DATE#${query.endDate}#RIDE#~`;
      } else if (query.startDate) {
        keyCondition += " AND SK >= :startDate";
        expressionAttributeValues[":startDate"] = `DATE#${query.startDate}#RIDE#`;
      } else if (query.endDate) {
        keyCondition += " AND SK <= :endDate";
        expressionAttributeValues[":endDate"] = `DATE#${query.endDate}#RIDE#~`;
      }
    }
    const queryParams = {
      TableName: this.tableName,
      KeyConditionExpression: keyCondition,
      ExpressionAttributeValues: expressionAttributeValues,
      Limit: query.limit || 20,
      ScanIndexForward: true
      // Sort by date ascending
    };
    if (query.status) {
      queryParams.IndexName = "GSI2";
    }
    if (query.cursor) {
      queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(query.cursor, "base64").toString());
    }
    const filterExpressions = [];
    if (query.rideType) {
      filterExpressions.push("rideType = :rideType");
      expressionAttributeValues[":rideType"] = query.rideType;
    }
    if (query.difficulty) {
      filterExpressions.push("difficulty = :difficulty");
      expressionAttributeValues[":difficulty"] = query.difficulty;
    }
    if (filterExpressions.length > 0) {
      queryParams.FilterExpression = filterExpressions.join(" AND ");
    }
    const result = await this.docClient.send(new import_lib_dynamodb.QueryCommand(queryParams));
    const rides = [];
    if (result.Items) {
      for (const item of result.Items) {
        const fullRide = await this.findById(item.rideId);
        if (fullRide) {
          rides.push(fullRide);
        }
      }
    }
    let nextCursor;
    if (result.LastEvaluatedKey) {
      nextCursor = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString("base64");
    }
    return { rides, nextCursor };
  }
  async update(ride) {
    const rideData = ride.toJSON();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const items = [
      // Update main ride item
      {
        Put: {
          TableName: this.tableName,
          Item: {
            PK: `CLUB#${rideData.clubId}`,
            SK: `RIDE#${rideData.rideId}`,
            GSI1PK: `RIDE#${rideData.rideId}`,
            GSI1SK: "METADATA",
            entityType: "RIDE",
            ...rideData,
            updatedAt: now
          }
        }
      },
      // Update club ride index item
      {
        Put: {
          TableName: this.tableName,
          Item: {
            PK: `CLUB#${rideData.clubId}#RIDES`,
            SK: `DATE#${rideData.startDateTime.split("T")[0]}#RIDE#${rideData.rideId}`,
            GSI2PK: `CLUB#${rideData.clubId}#RIDES#${rideData.status}`,
            GSI2SK: `DATE#${rideData.startDateTime.split("T")[0]}#RIDE#${rideData.rideId}`,
            entityType: "CLUB_RIDE_INDEX",
            rideId: rideData.rideId,
            title: rideData.title,
            rideType: rideData.rideType,
            difficulty: rideData.difficulty,
            status: rideData.status,
            startDateTime: rideData.startDateTime,
            currentParticipants: rideData.currentParticipants,
            maxParticipants: rideData.maxParticipants,
            createdBy: rideData.createdBy,
            publishedBy: rideData.publishedBy,
            publishedAt: rideData.publishedAt,
            updatedAt: now
          }
        }
      }
    ];
    await this.docClient.send(new import_lib_dynamodb.TransactWriteCommand({ TransactItems: items }));
  }
  async delete(rideId) {
    const ride = await this.findById(rideId);
    if (!ride) {
      return;
    }
    const rideData = ride.toJSON();
    const items = [
      // Delete main ride item
      {
        Delete: {
          TableName: this.tableName,
          Key: {
            PK: `CLUB#${rideData.clubId}`,
            SK: `RIDE#${rideId}`
          }
        }
      },
      // Delete club ride index item
      {
        Delete: {
          TableName: this.tableName,
          Key: {
            PK: `CLUB#${rideData.clubId}#RIDES`,
            SK: `DATE#${rideData.startDateTime.split("T")[0]}#RIDE#${rideId}`
          }
        }
      }
    ];
    await this.docClient.send(new import_lib_dynamodb.TransactWriteCommand({ TransactItems: items }));
  }
};

// services/ride-service/domain/ride/ride-errors.ts
var RideNotFoundError = class extends Error {
  constructor(rideId) {
    super(`Ride not found: ${rideId}`);
    this.statusCode = 404;
    this.errorType = "RIDE_NOT_FOUND";
  }
};
var RideValidationError = class extends Error {
  constructor(message) {
    super(`Ride validation failed: ${message}`);
    this.statusCode = 400;
    this.errorType = "RIDE_VALIDATION_ERROR";
  }
};

// services/ride-service/domain/ride/ride-service.ts
var RideService = class {
  constructor(rideRepository2) {
    this.rideRepository = rideRepository2;
  }
  async createRide(request, createdBy, clubId) {
    this.validatePhase23Constraints(request);
    this.validateCreateRequest(request);
    const ride = RideEntity.create(request, createdBy, clubId);
    await this.rideRepository.create(ride);
    return ride;
  }
  async getRide(rideId) {
    const ride = await this.rideRepository.findById(rideId);
    if (!ride) {
      throw new RideNotFoundError(rideId);
    }
    return ride;
  }
  async listClubRides(clubId, query) {
    return this.rideRepository.findByClubId(clubId, query);
  }
  async publishRide(rideId, publishedBy, request) {
    const ride = await this.getRide(rideId);
    ride.publish(publishedBy, request.audience, request.isPublic);
    await this.rideRepository.update(ride);
    return ride;
  }
  async updateRide(rideId, request) {
    const ride = await this.getRide(rideId);
    this.validateUpdateRequest(request);
    ride.update(request);
    await this.rideRepository.update(ride);
    return ride;
  }
  async cancelRide(rideId, request) {
    const ride = await this.getRide(rideId);
    ride.cancel(request.reason);
    await this.rideRepository.update(ride);
    return ride;
  }
  validatePhase23Constraints(request) {
    if (request.route?.provider && request.route.provider !== "internal") {
      throw new RideValidationError("External route providers not supported in Phase 2.3");
    }
  }
  validateCreateRequest(request) {
    if (!request.title?.trim()) {
      throw new RideValidationError("Title is required");
    }
    if (!request.description?.trim()) {
      throw new RideValidationError("Description is required");
    }
    if (!request.startDateTime) {
      throw new RideValidationError("Start date and time is required");
    }
    const startDate = new Date(request.startDateTime);
    if (startDate <= /* @__PURE__ */ new Date()) {
      throw new RideValidationError("Start date must be in the future");
    }
    if (request.estimatedDuration <= 0) {
      throw new RideValidationError("Estimated duration must be positive");
    }
    if (request.maxParticipants !== void 0 && request.maxParticipants < 1) {
      throw new RideValidationError("Maximum participants must be at least 1");
    }
    if (!request.meetingPoint?.name?.trim()) {
      throw new RideValidationError("Meeting point name is required");
    }
    if (!request.meetingPoint?.address?.trim()) {
      throw new RideValidationError("Meeting point address is required");
    }
  }
  validateUpdateRequest(request) {
    if (request.title !== void 0 && !request.title.trim()) {
      throw new RideValidationError("Title cannot be empty");
    }
    if (request.description !== void 0 && !request.description.trim()) {
      throw new RideValidationError("Description cannot be empty");
    }
    if (request.startDateTime !== void 0) {
      const startDate = new Date(request.startDateTime);
      if (startDate <= /* @__PURE__ */ new Date()) {
        throw new RideValidationError("Start date must be in the future");
      }
    }
    if (request.estimatedDuration !== void 0 && request.estimatedDuration <= 0) {
      throw new RideValidationError("Estimated duration must be positive");
    }
    if (request.maxParticipants !== void 0 && request.maxParticipants < 1) {
      throw new RideValidationError("Maximum participants must be at least 1");
    }
  }
};

// shared/types/ride-authorization.ts
var RideCapability = /* @__PURE__ */ ((RideCapability2) => {
  RideCapability2["VIEW_CLUB_RIDES"] = "view_club_rides";
  RideCapability2["VIEW_DRAFT_RIDES"] = "view_draft_rides";
  RideCapability2["JOIN_RIDES"] = "join_rides";
  RideCapability2["CREATE_RIDE_PROPOSALS"] = "create_ride_proposals";
  RideCapability2["PUBLISH_OFFICIAL_RIDES"] = "publish_official_rides";
  RideCapability2["MANAGE_RIDES"] = "manage_rides";
  RideCapability2["CANCEL_RIDES"] = "cancel_rides";
  RideCapability2["MANAGE_PARTICIPANTS"] = "manage_participants";
  RideCapability2["ASSIGN_LEADERSHIP"] = "assign_leadership";
  return RideCapability2;
})(RideCapability || {});

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
var InsufficientPrivilegesError = class extends AuthorizationError {
  constructor(capability, userId, resource) {
    const message = `Insufficient privileges: ${capability} required`;
    super(message, "INSUFFICIENT_PRIVILEGES" /* INSUFFICIENT_PRIVILEGES */, 403, {
      capability,
      userId,
      resource
    });
  }
};

// services/ride-service/domain/authorization/ride-authorization.ts
var RideAuthorizationService = class {
  static {
    this.ROLE_CAPABILITIES = {
      ["member" /* MEMBER */]: [
        "view_club_rides" /* VIEW_CLUB_RIDES */,
        "join_rides" /* JOIN_RIDES */,
        "create_ride_proposals" /* CREATE_RIDE_PROPOSALS */
      ],
      ["admin" /* ADMIN */]: [
        "view_club_rides" /* VIEW_CLUB_RIDES */,
        "join_rides" /* JOIN_RIDES */,
        "create_ride_proposals" /* CREATE_RIDE_PROPOSALS */,
        "view_draft_rides" /* VIEW_DRAFT_RIDES */,
        "publish_official_rides" /* PUBLISH_OFFICIAL_RIDES */,
        "manage_participants" /* MANAGE_PARTICIPANTS */,
        "manage_rides" /* MANAGE_RIDES */,
        "cancel_rides" /* CANCEL_RIDES */,
        "assign_leadership" /* ASSIGN_LEADERSHIP */
      ],
      ["owner" /* OWNER */]: [
        ...Object.values(RideCapability)
      ]
    };
  }
  static async requireRideCapability(capability, authContext, clubId, rideId, rideCreatedBy) {
    if (authContext.systemCapabilities?.includes("MANAGE_ALL_CLUBS")) {
      return;
    }
    const membership = authContext.clubMemberships?.find((m) => m.clubId === clubId);
    if (!membership || membership.status !== "active") {
      throw new InsufficientPrivilegesError(capability, authContext.userId, `club:${clubId}`);
    }
    const roleCapabilities = this.ROLE_CAPABILITIES[membership.role] || [];
    if (rideCreatedBy === authContext.userId && (capability === "manage_rides" /* MANAGE_RIDES */ || capability === "cancel_rides" /* CANCEL_RIDES */)) {
      return;
    }
    if (!roleCapabilities.includes(capability)) {
      throw new InsufficientPrivilegesError(capability, authContext.userId, `club:${clubId}`);
    }
  }
  static canViewRide(authContext, clubId, rideStatus, rideScope, rideCreatedBy, isPublic) {
    if (authContext.systemCapabilities?.includes("MANAGE_ALL_CLUBS")) {
      return true;
    }
    if (isPublic && rideStatus === "published" /* PUBLISHED */) {
      return true;
    }
    if (rideScope !== "club" /* CLUB */) {
      return false;
    }
    const membership = authContext.clubMemberships?.find((m) => m.clubId === clubId);
    if (!membership || membership.status !== "active") {
      return false;
    }
    if (rideStatus === "draft" /* DRAFT */) {
      if (rideCreatedBy === authContext.userId) {
        return true;
      }
      const roleCapabilities = this.ROLE_CAPABILITIES[membership.role] || [];
      return roleCapabilities.includes("view_draft_rides" /* VIEW_DRAFT_RIDES */);
    }
    return true;
  }
  static canPublishRide(authContext, clubId) {
    if (authContext.systemCapabilities?.includes("MANAGE_ALL_CLUBS")) {
      return true;
    }
    const membership = authContext.clubMemberships?.find((m) => m.clubId === clubId);
    if (!membership || membership.status !== "active") {
      return false;
    }
    const roleCapabilities = this.ROLE_CAPABILITIES[membership.role] || [];
    return roleCapabilities.includes("publish_official_rides" /* PUBLISH_OFFICIAL_RIDES */);
  }
  static getUserRideCapabilities(authContext, clubId) {
    if (authContext.systemCapabilities?.includes("MANAGE_ALL_CLUBS")) {
      return Object.values(RideCapability);
    }
    const membership = authContext.clubMemberships?.find((m) => m.clubId === clubId);
    if (!membership || membership.status !== "active") {
      return [];
    }
    return this.ROLE_CAPABILITIES[membership.role] || [];
  }
};

// services/ride-service/handlers/ride/list-rides.ts
var dynamoClient = new import_client_dynamodb.DynamoDBClient({});
var tableName = process.env.DYNAMODB_TABLE_NAME;
var rideRepository = new DynamoDBRideRepository(dynamoClient, tableName);
var rideService = new RideService(rideRepository);
var handler = async (event) => {
  try {
    const authContext = await getAuthContext(event);
    const clubId = event.pathParameters?.clubId;
    if (!clubId) {
      return createResponse(400, { error: "Club ID is required" });
    }
    await RideAuthorizationService.requireRideCapability(
      "view_club_rides" /* VIEW_CLUB_RIDES */,
      authContext,
      clubId
    );
    const queryParams = event.queryStringParameters || {};
    const query = {
      limit: queryParams.limit ? parseInt(queryParams.limit) : 20,
      cursor: queryParams.cursor,
      status: queryParams.status,
      rideType: queryParams.rideType,
      difficulty: queryParams.difficulty,
      startDate: queryParams.startDate,
      endDate: queryParams.endDate,
      includeDrafts: queryParams.includeDrafts === "true"
    };
    if (query.limit && (query.limit < 1 || query.limit > 100)) {
      return createResponse(400, { error: "Limit must be between 1 and 100" });
    }
    const canViewDrafts = RideAuthorizationService.getUserRideCapabilities(authContext, clubId).includes("view_draft_rides" /* VIEW_DRAFT_RIDES */);
    if (query.includeDrafts && !canViewDrafts) {
      return createResponse(403, {
        error: "Insufficient privileges to view draft rides"
      });
    }
    const result = await rideService.listClubRides(clubId, query);
    const visibleRides = result.rides.filter((ride) => {
      const rideData = ride.toJSON();
      return RideAuthorizationService.canViewRide(
        authContext,
        clubId,
        rideData.status,
        rideData.scope,
        rideData.createdBy,
        rideData.isPublic
      );
    });
    const responseData = visibleRides.map((ride) => {
      const rideData = ride.toJSON();
      return {
        rideId: rideData.rideId,
        title: rideData.title,
        rideType: rideData.rideType,
        difficulty: rideData.difficulty,
        status: rideData.status,
        scope: rideData.scope,
        audience: rideData.audience,
        startDateTime: rideData.startDateTime,
        estimatedDuration: rideData.estimatedDuration,
        maxParticipants: rideData.maxParticipants,
        currentParticipants: rideData.currentParticipants,
        meetingPoint: {
          name: rideData.meetingPoint.name,
          address: rideData.meetingPoint.address
        },
        route: rideData.route ? {
          name: rideData.route.name,
          type: rideData.route.type,
          distance: rideData.route.distance,
          difficulty: rideData.route.difficulty
        } : void 0,
        createdBy: rideData.createdBy,
        createdByName: "Unknown",
        // TODO: Enrich with user name
        publishedBy: rideData.publishedBy,
        publishedAt: rideData.publishedAt
      };
    });
    return createResponse(200, {
      success: true,
      data: responseData,
      pagination: {
        limit: query.limit,
        nextCursor: result.nextCursor
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("List rides error:", error);
    if (error.statusCode) {
      return createResponse(error.statusCode, {
        error: error.message,
        errorType: error.errorType
      });
    }
    return createResponse(500, { error: "Internal server error" });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
