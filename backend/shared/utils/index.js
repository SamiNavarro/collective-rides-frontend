"use strict";
/**
 * Shared Utilities - Phase 1.2
 *
 * Shared utility functions for the Sydney Cycling Platform v1 backend services.
 *
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 * - AWS Architecture: .kiro/specs/architecture.aws.v1.md
 * - Implementation Plan: .kiro/specs/implementation.v1.md
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
// Re-export all utilities
__exportStar(require("./lambda-utils"), exports);
__exportStar(require("./validation"), exports);
__exportStar(require("./errors"), exports);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7OztHQVNHOzs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsMEJBQTBCO0FBQzFCLGlEQUErQjtBQUMvQiwrQ0FBNkI7QUFDN0IsMkNBQXlCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBTaGFyZWQgVXRpbGl0aWVzIC0gUGhhc2UgMS4yXG4gKiBcbiAqIFNoYXJlZCB1dGlsaXR5IGZ1bmN0aW9ucyBmb3IgdGhlIFN5ZG5leSBDeWNsaW5nIFBsYXRmb3JtIHYxIGJhY2tlbmQgc2VydmljZXMuXG4gKiBcbiAqIENvbXBsaWFuY2U6XG4gKiAtIFBoYXNlIDEuMiBTcGVjOiAua2lyby9zcGVjcy9waGFzZS0xLjIudXNlci1wcm9maWxlLnYxLm1kXG4gKiAtIEFXUyBBcmNoaXRlY3R1cmU6IC5raXJvL3NwZWNzL2FyY2hpdGVjdHVyZS5hd3MudjEubWRcbiAqIC0gSW1wbGVtZW50YXRpb24gUGxhbjogLmtpcm8vc3BlY3MvaW1wbGVtZW50YXRpb24udjEubWRcbiAqL1xuXG4vLyBSZS1leHBvcnQgYWxsIHV0aWxpdGllc1xuZXhwb3J0ICogZnJvbSAnLi9sYW1iZGEtdXRpbHMnO1xuZXhwb3J0ICogZnJvbSAnLi92YWxpZGF0aW9uJztcbmV4cG9ydCAqIGZyb20gJy4vZXJyb3JzJzsiXX0=