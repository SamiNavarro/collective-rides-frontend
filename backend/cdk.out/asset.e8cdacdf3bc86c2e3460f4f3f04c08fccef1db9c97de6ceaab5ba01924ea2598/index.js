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

// services/ride-service/handlers/participation/join-ride.ts
var join_ride_exports = {};
__export(join_ride_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(join_ride_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");

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
  complete(completedBy, completionNotes) {
    if (this.ride.status !== "active" /* ACTIVE */) {
      throw new Error("Only active rides can be completed");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    this.ride.status = "completed" /* COMPLETED */;
    this.ride.completedAt = now;
    this.ride.completedBy = completedBy;
    this.ride.completionNotes = completionNotes;
    this.ride.updatedAt = now;
  }
  start(startedBy) {
    if (this.ride.status !== "published" /* PUBLISHED */) {
      throw new Error("Only published rides can be started");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    this.ride.status = "active" /* ACTIVE */;
    this.ride.startedAt = now;
    this.ride.startedBy = startedBy;
    this.ride.updatedAt = now;
  }
  canBeCompleted() {
    return this.ride.status === "active" /* ACTIVE */;
  }
  canBeStarted() {
    return this.ride.status === "published" /* PUBLISHED */;
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
  // Phase 2.5: Additional methods for completion and summary support
  async findParticipations(rideId) {
    const result = await this.docClient.send(new import_lib_dynamodb.QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `RIDE#${rideId}#PARTICIPANTS`,
        ":sk": "PARTICIPANT#"
      }
    }));
    return result.Items?.map((item) => item) || [];
  }
  async saveRideSummary(summary) {
    await this.docClient.send(new import_lib_dynamodb.PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `RIDE#${summary.rideId}`,
        SK: "SUMMARY",
        entityType: "RIDE_SUMMARY",
        ...summary
      }
    }));
  }
  async findRideSummary(rideId) {
    const result = await this.docClient.send(new import_lib_dynamodb.GetCommand({
      TableName: this.tableName,
      Key: {
        PK: `RIDE#${rideId}`,
        SK: "SUMMARY"
      }
    }));
    if (!result.Item) {
      return null;
    }
    const { PK, SK, entityType, ...summary } = result.Item;
    return summary;
  }
};

// services/ride-service/infrastructure/dynamodb-participation-repository.ts
var import_lib_dynamodb2 = require("@aws-sdk/lib-dynamodb");

// services/ride-service/domain/participation/participation.ts
var ParticipationEntity = class _ParticipationEntity {
  constructor(participation) {
    this.participation = participation;
  }
  static create(rideId, clubId, userId, request, status = "confirmed" /* CONFIRMED */, waitlistPosition) {
    const participationId = generateId("part");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const participation = {
      participationId,
      rideId,
      clubId,
      userId,
      role: "participant" /* PARTICIPANT */,
      status,
      joinedAt: now,
      message: request.message,
      waitlistPosition
    };
    return new _ParticipationEntity(participation);
  }
  static createCaptain(rideId, clubId, userId) {
    const participationId = generateId("part");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const participation = {
      participationId,
      rideId,
      clubId,
      userId,
      role: "captain" /* CAPTAIN */,
      status: "confirmed" /* CONFIRMED */,
      joinedAt: now
    };
    return new _ParticipationEntity(participation);
  }
  // Getters
  get participationId() {
    return this.participation.participationId;
  }
  get rideId() {
    return this.participation.rideId;
  }
  get clubId() {
    return this.participation.clubId;
  }
  get userId() {
    return this.participation.userId;
  }
  get role() {
    return this.participation.role;
  }
  get status() {
    return this.participation.status;
  }
  get waitlistPosition() {
    return this.participation.waitlistPosition;
  }
  get attendanceStatus() {
    return this.participation.attendanceStatus || "unknown" /* UNKNOWN */;
  }
  get evidence() {
    return this.participation.evidence;
  }
  toJSON() {
    return { ...this.participation };
  }
  // Business methods
  canUpdateRole() {
    return this.participation.status === "confirmed" /* CONFIRMED */;
  }
  canLeave() {
    return this.participation.status === "confirmed" /* CONFIRMED */ || this.participation.status === "waitlisted" /* WAITLISTED */;
  }
  updateRole(newRole, reason) {
    if (!this.canUpdateRole()) {
      throw new Error("Cannot update role for non-confirmed participant");
    }
    this.participation.role = newRole;
  }
  withdraw() {
    if (!this.canLeave()) {
      throw new Error("Cannot withdraw from ride in current status");
    }
    this.participation.status = "withdrawn" /* WITHDRAWN */;
    this.participation.waitlistPosition = void 0;
  }
  remove() {
    this.participation.status = "removed" /* REMOVED */;
    this.participation.waitlistPosition = void 0;
  }
  promoteFromWaitlist() {
    if (this.participation.status !== "waitlisted" /* WAITLISTED */) {
      throw new Error("Can only promote waitlisted participants");
    }
    this.participation.status = "confirmed" /* CONFIRMED */;
    this.participation.waitlistPosition = void 0;
  }
  updateWaitlistPosition(position) {
    if (this.participation.status !== "waitlisted" /* WAITLISTED */) {
      throw new Error("Can only update waitlist position for waitlisted participants");
    }
    this.participation.waitlistPosition = position;
  }
  // Phase 2.5: Attendance tracking methods
  updateAttendance(status, confirmedBy) {
    this.participation.attendanceStatus = status;
    if (confirmedBy) {
      this.participation.confirmedBy = confirmedBy;
      this.participation.confirmedAt = (/* @__PURE__ */ new Date()).toISOString();
    }
  }
  linkStravaEvidence(stravaActivityId, matchType, metrics) {
    const evidence = {
      type: "strava" /* STRAVA */,
      refId: stravaActivityId,
      matchType,
      metricsSnapshot: metrics,
      linkedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.participation.evidence = evidence;
    this.participation.attendanceStatus = "attended" /* ATTENDED */;
  }
  linkManualEvidence(evidenceId, confirmedBy) {
    const evidence = {
      type: "manual" /* MANUAL */,
      refId: evidenceId,
      matchType: "manual" /* MANUAL */,
      linkedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.participation.evidence = evidence;
    this.participation.attendanceStatus = "attended" /* ATTENDED */;
    this.participation.confirmedBy = confirmedBy;
    this.participation.confirmedAt = (/* @__PURE__ */ new Date()).toISOString();
  }
  canUpdateAttendance() {
    return this.participation.status === "confirmed" /* CONFIRMED */;
  }
  hasEvidence() {
    return this.participation.evidence !== void 0;
  }
};

// services/ride-service/infrastructure/dynamodb-participation-repository.ts
var DynamoDBParticipationRepository = class {
  constructor(dynamoClient2, tableName2) {
    this.docClient = import_lib_dynamodb2.DynamoDBDocumentClient.from(dynamoClient2);
    this.tableName = tableName2;
  }
  async create(participation) {
    const participationData = participation.toJSON();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const items = [
      // Main participation item
      {
        Put: {
          TableName: this.tableName,
          Item: {
            PK: `RIDE#${participationData.rideId}`,
            SK: `PARTICIPANT#${participationData.userId}`,
            entityType: "RIDE_PARTICIPATION",
            ...participationData
          }
        }
      },
      // User ride index item
      {
        Put: {
          TableName: this.tableName,
          Item: {
            PK: `USER#${participationData.userId}`,
            SK: `RIDE#${participationData.rideId}`,
            GSI1PK: `USER#${participationData.userId}`,
            GSI1SK: `RIDE#${participationData.rideId}`,
            entityType: "USER_RIDE",
            participationId: participationData.participationId,
            rideId: participationData.rideId,
            clubId: participationData.clubId,
            role: participationData.role,
            status: participationData.status,
            joinedAt: participationData.joinedAt
          }
        }
      }
    ];
    await this.docClient.send(new import_lib_dynamodb2.TransactWriteCommand({ TransactItems: items }));
  }
  async findById(participationId) {
    const result = await this.docClient.send(new import_lib_dynamodb2.QueryCommand({
      TableName: this.tableName,
      FilterExpression: "participationId = :participationId",
      ExpressionAttributeValues: {
        ":participationId": participationId
      }
    }));
    if (!result.Items || result.Items.length === 0) {
      return null;
    }
    return new ParticipationEntity(result.Items[0]);
  }
  async findByRideAndUser(rideId, userId) {
    const result = await this.docClient.send(new import_lib_dynamodb2.GetCommand({
      TableName: this.tableName,
      Key: {
        PK: `RIDE#${rideId}`,
        SK: `PARTICIPANT#${userId}`
      }
    }));
    if (!result.Item) {
      return null;
    }
    return new ParticipationEntity(result.Item);
  }
  async findByRideId(rideId) {
    const result = await this.docClient.send(new import_lib_dynamodb2.QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `RIDE#${rideId}`,
        ":sk": "PARTICIPANT#"
      }
    }));
    if (!result.Items) {
      return [];
    }
    return result.Items.map((item) => new ParticipationEntity(item));
  }
  async findByUserId(userId, query) {
    const queryParams = {
      TableName: this.tableName,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk AND begins_with(GSI1SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":sk": "RIDE#"
      },
      Limit: query.limit || 20,
      ScanIndexForward: false
      // Most recent first
    };
    if (query.cursor) {
      queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(query.cursor, "base64").toString());
    }
    const filterExpressions = [];
    if (query.role) {
      filterExpressions.push("#role = :role");
      queryParams.ExpressionAttributeNames = { "#role": "role" };
      queryParams.ExpressionAttributeValues[":role"] = query.role;
    }
    if (query.status) {
      filterExpressions.push("#status = :status");
      queryParams.ExpressionAttributeNames = {
        ...queryParams.ExpressionAttributeNames,
        "#status": "status"
      };
      queryParams.ExpressionAttributeValues[":status"] = query.status;
    }
    if (filterExpressions.length > 0) {
      queryParams.FilterExpression = filterExpressions.join(" AND ");
    }
    const result = await this.docClient.send(new import_lib_dynamodb2.QueryCommand(queryParams));
    const rides = [];
    if (result.Items) {
      for (const item of result.Items) {
        const rideResult = await this.docClient.send(new import_lib_dynamodb2.QueryCommand({
          TableName: this.tableName,
          IndexName: "GSI1",
          KeyConditionExpression: "GSI1PK = :pk AND GSI1SK = :sk",
          ExpressionAttributeValues: {
            ":pk": `RIDE#${item.rideId}`,
            ":sk": "METADATA"
          }
        }));
        if (rideResult.Items && rideResult.Items.length > 0) {
          const rideData = rideResult.Items[0];
          const clubResult = await this.docClient.send(new import_lib_dynamodb2.GetCommand({
            TableName: this.tableName,
            Key: {
              PK: `CLUB#${item.clubId}`,
              SK: "METADATA"
            }
          }));
          const clubName = clubResult.Item?.name || "Unknown Club";
          rides.push({
            participationId: item.participationId,
            rideId: item.rideId,
            clubId: item.clubId,
            clubName,
            title: rideData.title,
            rideType: rideData.rideType,
            difficulty: rideData.difficulty,
            startDateTime: rideData.startDateTime,
            role: item.role,
            status: item.status,
            joinedAt: item.joinedAt
          });
        }
      }
    }
    let nextCursor;
    if (result.LastEvaluatedKey) {
      nextCursor = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString("base64");
    }
    return { rides, nextCursor };
  }
  async update(participation) {
    const participationData = participation.toJSON();
    const items = [
      // Update main participation item
      {
        Put: {
          TableName: this.tableName,
          Item: {
            PK: `RIDE#${participationData.rideId}`,
            SK: `PARTICIPANT#${participationData.userId}`,
            entityType: "RIDE_PARTICIPATION",
            ...participationData
          }
        }
      },
      // Update user ride index item
      {
        Put: {
          TableName: this.tableName,
          Item: {
            PK: `USER#${participationData.userId}`,
            SK: `RIDE#${participationData.rideId}`,
            GSI1PK: `USER#${participationData.userId}`,
            GSI1SK: `RIDE#${participationData.rideId}`,
            entityType: "USER_RIDE",
            participationId: participationData.participationId,
            rideId: participationData.rideId,
            clubId: participationData.clubId,
            role: participationData.role,
            status: participationData.status,
            joinedAt: participationData.joinedAt
          }
        }
      }
    ];
    await this.docClient.send(new import_lib_dynamodb2.TransactWriteCommand({ TransactItems: items }));
  }
  async delete(participationId) {
    const participation = await this.findById(participationId);
    if (!participation) {
      return;
    }
    const participationData = participation.toJSON();
    const items = [
      // Delete main participation item
      {
        Delete: {
          TableName: this.tableName,
          Key: {
            PK: `RIDE#${participationData.rideId}`,
            SK: `PARTICIPANT#${participationData.userId}`
          }
        }
      },
      // Delete user ride index item
      {
        Delete: {
          TableName: this.tableName,
          Key: {
            PK: `USER#${participationData.userId}`,
            SK: `RIDE#${participationData.rideId}`
          }
        }
      }
    ];
    await this.docClient.send(new import_lib_dynamodb2.TransactWriteCommand({ TransactItems: items }));
  }
  async getWaitlistPosition(rideId) {
    const result = await this.docClient.send(new import_lib_dynamodb2.QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      FilterExpression: "#status = :status",
      ExpressionAttributeNames: {
        "#status": "status"
      },
      ExpressionAttributeValues: {
        ":pk": `RIDE#${rideId}`,
        ":sk": "PARTICIPANT#",
        ":status": "waitlisted" /* WAITLISTED */
      }
    }));
    return result.Items?.length || 0;
  }
};

// services/ride-service/domain/participation/participation-errors.ts
var ParticipationNotFoundError = class extends Error {
  constructor(participationId) {
    super(`Participation not found: ${participationId}`);
    this.statusCode = 404;
    this.errorType = "PARTICIPATION_NOT_FOUND";
  }
};
var AlreadyParticipatingError = class extends Error {
  constructor(userId, rideId) {
    super(`User ${userId} is already participating in ride ${rideId}`);
    this.statusCode = 409;
    this.errorType = "ALREADY_PARTICIPATING";
  }
};
var RideFullError = class extends Error {
  constructor(rideId) {
    super(`Ride ${rideId} is full`);
    this.statusCode = 409;
    this.errorType = "RIDE_FULL";
  }
};
var InvalidRoleTransitionError = class extends Error {
  constructor(fromRole, toRole) {
    super(`Invalid role transition from ${fromRole} to ${toRole}`);
    this.statusCode = 400;
    this.errorType = "INVALID_ROLE_TRANSITION";
  }
};
var CannotRemoveCaptainError = class extends Error {
  constructor() {
    super("Cannot remove ride captain. Transfer captain role first.");
    this.statusCode = 400;
    this.errorType = "CANNOT_REMOVE_CAPTAIN";
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

// services/ride-service/domain/participation/participation-service.ts
var ParticipationService = class {
  constructor(participationRepository2, rideRepository2) {
    this.participationRepository = participationRepository2;
    this.rideRepository = rideRepository2;
  }
  async joinRide(rideId, userId, request) {
    const ride = await this.rideRepository.findById(rideId);
    if (!ride) {
      throw new RideNotFoundError(rideId);
    }
    const existingParticipation = await this.participationRepository.findByRideAndUser(rideId, userId);
    if (existingParticipation) {
      throw new AlreadyParticipatingError(userId, rideId);
    }
    if (ride.status !== "published" /* PUBLISHED */) {
      throw new Error("Can only join published rides");
    }
    let participation;
    if (ride.canAcceptParticipants()) {
      participation = ParticipationEntity.create(
        rideId,
        ride.clubId,
        userId,
        request,
        "confirmed" /* CONFIRMED */
      );
      ride.incrementParticipants();
      await this.rideRepository.update(ride);
    } else if (ride.isWaitlistAvailable()) {
      const waitlistPosition = await this.participationRepository.getWaitlistPosition(rideId) + 1;
      participation = ParticipationEntity.create(
        rideId,
        ride.clubId,
        userId,
        request,
        "waitlisted" /* WAITLISTED */,
        waitlistPosition
      );
      ride.incrementWaitlist();
      await this.rideRepository.update(ride);
    } else {
      throw new RideFullError(rideId);
    }
    await this.participationRepository.create(participation);
    return participation;
  }
  async leaveRide(rideId, userId) {
    const participation = await this.participationRepository.findByRideAndUser(rideId, userId);
    if (!participation) {
      throw new ParticipationNotFoundError(`${rideId}:${userId}`);
    }
    if (participation.role === "captain" /* CAPTAIN */) {
      throw new CannotRemoveCaptainError();
    }
    const ride = await this.rideRepository.findById(rideId);
    if (!ride) {
      throw new RideNotFoundError(rideId);
    }
    participation.withdraw();
    await this.participationRepository.update(participation);
    if (participation.status === "confirmed" /* CONFIRMED */) {
      ride.decrementParticipants();
      await this.promoteFromWaitlistIfNeeded(rideId, ride);
    } else if (participation.status === "waitlisted" /* WAITLISTED */) {
      ride.decrementWaitlist();
      await this.reorderWaitlist(rideId);
    }
    await this.rideRepository.update(ride);
  }
  async updateParticipantRole(rideId, userId, request) {
    const participation = await this.participationRepository.findByRideAndUser(rideId, userId);
    if (!participation) {
      throw new ParticipationNotFoundError(`${rideId}:${userId}`);
    }
    this.validateRoleTransition(participation.role, request.role);
    participation.updateRole(request.role, request.reason);
    await this.participationRepository.update(participation);
    return participation;
  }
  async removeParticipant(rideId, userId) {
    const participation = await this.participationRepository.findByRideAndUser(rideId, userId);
    if (!participation) {
      throw new ParticipationNotFoundError(`${rideId}:${userId}`);
    }
    if (participation.role === "captain" /* CAPTAIN */) {
      throw new CannotRemoveCaptainError();
    }
    const ride = await this.rideRepository.findById(rideId);
    if (!ride) {
      throw new RideNotFoundError(rideId);
    }
    participation.remove();
    await this.participationRepository.update(participation);
    if (participation.status === "confirmed" /* CONFIRMED */) {
      ride.decrementParticipants();
      await this.promoteFromWaitlistIfNeeded(rideId, ride);
    } else if (participation.status === "waitlisted" /* WAITLISTED */) {
      ride.decrementWaitlist();
      await this.reorderWaitlist(rideId);
    }
    await this.rideRepository.update(ride);
  }
  async getRideParticipants(rideId) {
    return this.participationRepository.findByRideId(rideId);
  }
  async getUserRides(userId, query) {
    return this.participationRepository.findByUserId(userId, query);
  }
  // Phase 2.5: Attendance tracking methods
  async updateAttendance(rideId, userId, attendanceStatus, confirmedBy) {
    const participation = await this.participationRepository.findByRideAndUser(rideId, userId);
    if (!participation) {
      throw new ParticipationNotFoundError(`${rideId}:${userId}`);
    }
    if (!participation.canUpdateAttendance()) {
      throw new Error("Cannot update attendance for non-confirmed participant");
    }
    participation.updateAttendance(attendanceStatus, confirmedBy);
    await this.participationRepository.update(participation);
    return participation;
  }
  async linkManualEvidence(rideId, userId, evidenceId, description, confirmedBy) {
    const participation = await this.participationRepository.findByRideAndUser(rideId, userId);
    if (!participation) {
      throw new ParticipationNotFoundError(`${rideId}:${userId}`);
    }
    if (!participation.canUpdateAttendance()) {
      throw new Error("Cannot link evidence for non-confirmed participant");
    }
    participation.linkManualEvidence(evidenceId, confirmedBy);
    await this.participationRepository.update(participation);
    return participation;
  }
  async linkStravaEvidence(rideId, userId, stravaActivityId, matchType, metrics) {
    const participation = await this.participationRepository.findByRideAndUser(rideId, userId);
    if (!participation) {
      throw new ParticipationNotFoundError(`${rideId}:${userId}`);
    }
    if (!participation.canUpdateAttendance()) {
      throw new Error("Cannot link evidence for non-confirmed participant");
    }
    participation.linkStravaEvidence(stravaActivityId, matchType, metrics);
    await this.participationRepository.update(participation);
    return participation;
  }
  validateRoleTransition(fromRole, toRole) {
    const allowedTransitions = {
      ["participant" /* PARTICIPANT */]: ["leader" /* LEADER */, "captain" /* CAPTAIN */],
      ["leader" /* LEADER */]: ["participant" /* PARTICIPANT */, "captain" /* CAPTAIN */],
      ["captain" /* CAPTAIN */]: ["leader" /* LEADER */]
      // Captain can step down but not to participant directly
    };
    if (!allowedTransitions[fromRole]?.includes(toRole)) {
      throw new InvalidRoleTransitionError(fromRole, toRole);
    }
  }
  async promoteFromWaitlistIfNeeded(rideId, ride) {
    if (!ride.canAcceptParticipants())
      return;
    const participations = await this.participationRepository.findByRideId(rideId);
    const waitlisted = participations.filter((p) => p.status === "waitlisted" /* WAITLISTED */).sort((a, b) => (a.waitlistPosition || 0) - (b.waitlistPosition || 0));
    if (waitlisted.length > 0) {
      const nextParticipant = waitlisted[0];
      nextParticipant.promoteFromWaitlist();
      await this.participationRepository.update(nextParticipant);
      ride.incrementParticipants();
      ride.decrementWaitlist();
      await this.reorderWaitlist(rideId);
    }
  }
  async reorderWaitlist(rideId) {
    const participations = await this.participationRepository.findByRideId(rideId);
    const waitlisted = participations.filter((p) => p.status === "waitlisted" /* WAITLISTED */).sort((a, b) => (a.waitlistPosition || 0) - (b.waitlistPosition || 0));
    for (let i = 0; i < waitlisted.length; i++) {
      waitlisted[i].updateWaitlistPosition(i + 1);
      await this.participationRepository.update(waitlisted[i]);
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
      ["captain" /* CAPTAIN */]: [
        "view_club_rides" /* VIEW_CLUB_RIDES */,
        "join_rides" /* JOIN_RIDES */,
        "create_ride_proposals" /* CREATE_RIDE_PROPOSALS */,
        "view_draft_rides" /* VIEW_DRAFT_RIDES */,
        "publish_official_rides" /* PUBLISH_OFFICIAL_RIDES */,
        "manage_participants" /* MANAGE_PARTICIPANTS */
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

// services/ride-service/handlers/participation/join-ride.ts
var dynamoClient = new import_client_dynamodb.DynamoDBClient({});
var tableName = process.env.DYNAMODB_TABLE_NAME;
var rideRepository = new DynamoDBRideRepository(dynamoClient, tableName);
var participationRepository = new DynamoDBParticipationRepository(dynamoClient, tableName);
var participationService = new ParticipationService(participationRepository, rideRepository);
var handler = async (event) => {
  try {
    const authContext = await getAuthContext(event);
    const clubId = event.pathParameters?.clubId;
    const rideId = event.pathParameters?.rideId;
    if (!clubId || !rideId) {
      return createResponse(400, { error: "Club ID and Ride ID are required" });
    }
    await RideAuthorizationService.requireRideCapability(
      "join_rides" /* JOIN_RIDES */,
      authContext,
      clubId,
      rideId
    );
    const request = event.body ? parseJSON(event.body) : {};
    const participation = await participationService.joinRide(rideId, authContext.userId, request);
    return createResponse(201, {
      success: true,
      data: participation.toJSON(),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("Join ride error:", error);
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
