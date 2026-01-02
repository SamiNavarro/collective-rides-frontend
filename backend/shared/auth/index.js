"use strict";
/**
 * Shared Authentication Utilities - Phase 1.2
 *
 * Shared authentication and authorization utilities for the Sydney Cycling Platform v1 backend services.
 *
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 * - AWS Architecture: .kiro/specs/architecture.aws.v1.md
 * - Domain Model: SystemRole from .kiro/specs/domain.v1.md
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
// Re-export all auth utilities
__exportStar(require("./jwt-utils"), exports);
__exportStar(require("./auth-context"), exports);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7OztHQVNHOzs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsK0JBQStCO0FBQy9CLDhDQUE0QjtBQUM1QixpREFBK0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFNoYXJlZCBBdXRoZW50aWNhdGlvbiBVdGlsaXRpZXMgLSBQaGFzZSAxLjJcbiAqIFxuICogU2hhcmVkIGF1dGhlbnRpY2F0aW9uIGFuZCBhdXRob3JpemF0aW9uIHV0aWxpdGllcyBmb3IgdGhlIFN5ZG5leSBDeWNsaW5nIFBsYXRmb3JtIHYxIGJhY2tlbmQgc2VydmljZXMuXG4gKiBcbiAqIENvbXBsaWFuY2U6XG4gKiAtIFBoYXNlIDEuMiBTcGVjOiAua2lyby9zcGVjcy9waGFzZS0xLjIudXNlci1wcm9maWxlLnYxLm1kXG4gKiAtIEFXUyBBcmNoaXRlY3R1cmU6IC5raXJvL3NwZWNzL2FyY2hpdGVjdHVyZS5hd3MudjEubWRcbiAqIC0gRG9tYWluIE1vZGVsOiBTeXN0ZW1Sb2xlIGZyb20gLmtpcm8vc3BlY3MvZG9tYWluLnYxLm1kXG4gKi9cblxuLy8gUmUtZXhwb3J0IGFsbCBhdXRoIHV0aWxpdGllc1xuZXhwb3J0ICogZnJvbSAnLi9qd3QtdXRpbHMnO1xuZXhwb3J0ICogZnJvbSAnLi9hdXRoLWNvbnRleHQnOyJdfQ==