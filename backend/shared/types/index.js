"use strict";
/**
 * Shared TypeScript Types - Phase 1.2
 *
 * Shared TypeScript type definitions for the Sydney Cycling Platform v1 backend services.
 *
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 * - Domain Model: .kiro/specs/domain.v1.md
 * - AWS Architecture: .kiro/specs/architecture.aws.v1.md
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// Re-export all types for easy importing
__exportStar(require("./user"), exports);
__exportStar(require("./api"), exports);
__exportStar(require("./auth"), exports);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7OztHQVNHOzs7Ozs7Ozs7Ozs7Ozs7O0FBRUgseUNBQXlDO0FBQ3pDLHlDQUF1QjtBQUN2Qix3Q0FBc0I7QUFDdEIseUNBQXVCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBTaGFyZWQgVHlwZVNjcmlwdCBUeXBlcyAtIFBoYXNlIDEuMlxuICogXG4gKiBTaGFyZWQgVHlwZVNjcmlwdCB0eXBlIGRlZmluaXRpb25zIGZvciB0aGUgU3lkbmV5IEN5Y2xpbmcgUGxhdGZvcm0gdjEgYmFja2VuZCBzZXJ2aWNlcy5cbiAqIFxuICogQ29tcGxpYW5jZTpcbiAqIC0gUGhhc2UgMS4yIFNwZWM6IC5raXJvL3NwZWNzL3BoYXNlLTEuMi51c2VyLXByb2ZpbGUudjEubWRcbiAqIC0gRG9tYWluIE1vZGVsOiAua2lyby9zcGVjcy9kb21haW4udjEubWRcbiAqIC0gQVdTIEFyY2hpdGVjdHVyZTogLmtpcm8vc3BlY3MvYXJjaGl0ZWN0dXJlLmF3cy52MS5tZFxuICovXG5cbi8vIFJlLWV4cG9ydCBhbGwgdHlwZXMgZm9yIGVhc3kgaW1wb3J0aW5nXG5leHBvcnQgKiBmcm9tICcuL3VzZXInO1xuZXhwb3J0ICogZnJvbSAnLi9hcGknO1xuZXhwb3J0ICogZnJvbSAnLi9hdXRoJzsiXX0=