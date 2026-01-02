"use strict";
/**
 * JWT Utilities - Phase 1.2
 *
 * Utilities for extracting JWT claims from API Gateway events.
 * Note: JWT signature validation is handled by API Gateway + Cognito Authorizer.
 * This module only extracts claims from the validated context.
 *
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 * - AWS Architecture: .kiro/specs/architecture.aws.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemRoleFromClaims = exports.getEmailFromClaims = exports.getUserIdFromClaims = exports.extractJwtClaims = void 0;
/**
 * Extract JWT claims from API Gateway authorizer context
 *
 * @param authorizerContext - API Gateway authorizer context
 * @returns JWT claims object
 * @throws Error if claims are missing or invalid
 */
function extractJwtClaims(authorizerContext) {
    const { claims } = authorizerContext;
    if (!claims) {
        throw new Error('No JWT claims found in authorizer context');
    }
    // Validate required claims
    if (!claims.sub) {
        throw new Error('Missing required claim: sub');
    }
    if (!claims.email) {
        throw new Error('Missing required claim: email');
    }
    if (!claims.iat) {
        throw new Error('Missing required claim: iat');
    }
    if (!claims.exp) {
        throw new Error('Missing required claim: exp');
    }
    // Convert timestamps to numbers (API Gateway formats them as date strings)
    let iat;
    let exp;
    if (typeof claims.iat === 'string') {
        // Check if it's a Unix timestamp string or a formatted date string
        if (/^\d+$/.test(claims.iat)) {
            iat = parseInt(claims.iat, 10);
        }
        else {
            // Parse formatted date string
            iat = Math.floor(new Date(claims.iat).getTime() / 1000);
        }
    }
    else {
        iat = Number(claims.iat);
    }
    if (typeof claims.exp === 'string') {
        // Check if it's a Unix timestamp string or a formatted date string
        if (/^\d+$/.test(claims.exp)) {
            exp = parseInt(claims.exp, 10);
        }
        else {
            // Parse formatted date string
            exp = Math.floor(new Date(claims.exp).getTime() / 1000);
        }
    }
    else {
        exp = Number(claims.exp);
    }
    if (isNaN(iat) || isNaN(exp)) {
        throw new Error('Invalid timestamp claims');
    }
    // Check if token is expired (additional safety check)
    const now = Math.floor(Date.now() / 1000);
    if (exp < now) {
        throw new Error('JWT token has expired');
    }
    return {
        sub: claims.sub,
        email: claims.email,
        iat,
        exp,
        iss: claims.iss || '',
        aud: claims.aud || '',
        'custom:system_role': claims['custom:system_role'],
    };
}
exports.extractJwtClaims = extractJwtClaims;
/**
 * Extract user ID from JWT claims
 *
 * @param claims - JWT claims
 * @returns User ID (Cognito sub)
 */
function getUserIdFromClaims(claims) {
    return claims.sub;
}
exports.getUserIdFromClaims = getUserIdFromClaims;
/**
 * Extract email from JWT claims
 *
 * @param claims - JWT claims
 * @returns Email address
 */
function getEmailFromClaims(claims) {
    return claims.email;
}
exports.getEmailFromClaims = getEmailFromClaims;
/**
 * Extract system role from JWT claims
 *
 * @param claims - JWT claims
 * @returns System role or 'User' as default
 */
function getSystemRoleFromClaims(claims) {
    const customRole = claims['custom:system_role'];
    // Validate and return system role, default to 'User'
    if (customRole === 'SiteAdmin') {
        return 'SiteAdmin';
    }
    return 'User';
}
exports.getSystemRoleFromClaims = getSystemRoleFromClaims;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiand0LXV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiand0LXV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7OztHQVVHOzs7QUFJSDs7Ozs7O0dBTUc7QUFDSCxTQUFnQixnQkFBZ0IsQ0FBQyxpQkFBOEM7SUFDN0UsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLGlCQUFpQixDQUFDO0lBRXJDLElBQUksQ0FBQyxNQUFNLEVBQUU7UUFDWCxNQUFNLElBQUksS0FBSyxDQUFDLDJDQUEyQyxDQUFDLENBQUM7S0FDOUQ7SUFFRCwyQkFBMkI7SUFDM0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUU7UUFDZixNQUFNLElBQUksS0FBSyxDQUFDLDZCQUE2QixDQUFDLENBQUM7S0FDaEQ7SUFFRCxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRTtRQUNqQixNQUFNLElBQUksS0FBSyxDQUFDLCtCQUErQixDQUFDLENBQUM7S0FDbEQ7SUFFRCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRTtRQUNmLE1BQU0sSUFBSSxLQUFLLENBQUMsNkJBQTZCLENBQUMsQ0FBQztLQUNoRDtJQUVELElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFO1FBQ2YsTUFBTSxJQUFJLEtBQUssQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0tBQ2hEO0lBRUQsMkVBQTJFO0lBQzNFLElBQUksR0FBVyxDQUFDO0lBQ2hCLElBQUksR0FBVyxDQUFDO0lBRWhCLElBQUksT0FBTyxNQUFNLENBQUMsR0FBRyxLQUFLLFFBQVEsRUFBRTtRQUNsQyxtRUFBbUU7UUFDbkUsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUM1QixHQUFHLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7U0FDaEM7YUFBTTtZQUNMLDhCQUE4QjtZQUM5QixHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7U0FDekQ7S0FDRjtTQUFNO1FBQ0wsR0FBRyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDMUI7SUFFRCxJQUFJLE9BQU8sTUFBTSxDQUFDLEdBQUcsS0FBSyxRQUFRLEVBQUU7UUFDbEMsbUVBQW1FO1FBQ25FLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDNUIsR0FBRyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1NBQ2hDO2FBQU07WUFDTCw4QkFBOEI7WUFDOUIsR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO1NBQ3pEO0tBQ0Y7U0FBTTtRQUNMLEdBQUcsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQzFCO0lBRUQsSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQzVCLE1BQU0sSUFBSSxLQUFLLENBQUMsMEJBQTBCLENBQUMsQ0FBQztLQUM3QztJQUVELHNEQUFzRDtJQUN0RCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztJQUMxQyxJQUFJLEdBQUcsR0FBRyxHQUFHLEVBQUU7UUFDYixNQUFNLElBQUksS0FBSyxDQUFDLHVCQUF1QixDQUFDLENBQUM7S0FDMUM7SUFFRCxPQUFPO1FBQ0wsR0FBRyxFQUFFLE1BQU0sQ0FBQyxHQUFHO1FBQ2YsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLO1FBQ25CLEdBQUc7UUFDSCxHQUFHO1FBQ0gsR0FBRyxFQUFFLE1BQU0sQ0FBQyxHQUFHLElBQUksRUFBRTtRQUNyQixHQUFHLEVBQUUsTUFBTSxDQUFDLEdBQUcsSUFBSSxFQUFFO1FBQ3JCLG9CQUFvQixFQUFFLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQztLQUNuRCxDQUFDO0FBQ0osQ0FBQztBQXZFRCw0Q0F1RUM7QUFFRDs7Ozs7R0FLRztBQUNILFNBQWdCLG1CQUFtQixDQUFDLE1BQWlCO0lBQ25ELE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQztBQUNwQixDQUFDO0FBRkQsa0RBRUM7QUFFRDs7Ozs7R0FLRztBQUNILFNBQWdCLGtCQUFrQixDQUFDLE1BQWlCO0lBQ2xELE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQztBQUN0QixDQUFDO0FBRkQsZ0RBRUM7QUFFRDs7Ozs7R0FLRztBQUNILFNBQWdCLHVCQUF1QixDQUFDLE1BQWlCO0lBQ3ZELE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0lBRWhELHFEQUFxRDtJQUNyRCxJQUFJLFVBQVUsS0FBSyxXQUFXLEVBQUU7UUFDOUIsT0FBTyxXQUFXLENBQUM7S0FDcEI7SUFFRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBVEQsMERBU0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEpXVCBVdGlsaXRpZXMgLSBQaGFzZSAxLjJcbiAqIFxuICogVXRpbGl0aWVzIGZvciBleHRyYWN0aW5nIEpXVCBjbGFpbXMgZnJvbSBBUEkgR2F0ZXdheSBldmVudHMuXG4gKiBOb3RlOiBKV1Qgc2lnbmF0dXJlIHZhbGlkYXRpb24gaXMgaGFuZGxlZCBieSBBUEkgR2F0ZXdheSArIENvZ25pdG8gQXV0aG9yaXplci5cbiAqIFRoaXMgbW9kdWxlIG9ubHkgZXh0cmFjdHMgY2xhaW1zIGZyb20gdGhlIHZhbGlkYXRlZCBjb250ZXh0LlxuICogXG4gKiBDb21wbGlhbmNlOlxuICogLSBQaGFzZSAxLjIgU3BlYzogLmtpcm8vc3BlY3MvcGhhc2UtMS4yLnVzZXItcHJvZmlsZS52MS5tZFxuICogLSBBV1MgQXJjaGl0ZWN0dXJlOiAua2lyby9zcGVjcy9hcmNoaXRlY3R1cmUuYXdzLnYxLm1kXG4gKi9cblxuaW1wb3J0IHsgSnd0Q2xhaW1zLCBBcGlHYXRld2F5QXV0aG9yaXplckNvbnRleHQgfSBmcm9tICcuLi90eXBlcy9hdXRoJztcblxuLyoqXG4gKiBFeHRyYWN0IEpXVCBjbGFpbXMgZnJvbSBBUEkgR2F0ZXdheSBhdXRob3JpemVyIGNvbnRleHRcbiAqIFxuICogQHBhcmFtIGF1dGhvcml6ZXJDb250ZXh0IC0gQVBJIEdhdGV3YXkgYXV0aG9yaXplciBjb250ZXh0XG4gKiBAcmV0dXJucyBKV1QgY2xhaW1zIG9iamVjdFxuICogQHRocm93cyBFcnJvciBpZiBjbGFpbXMgYXJlIG1pc3Npbmcgb3IgaW52YWxpZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdEp3dENsYWltcyhhdXRob3JpemVyQ29udGV4dDogQXBpR2F0ZXdheUF1dGhvcml6ZXJDb250ZXh0KTogSnd0Q2xhaW1zIHtcbiAgY29uc3QgeyBjbGFpbXMgfSA9IGF1dGhvcml6ZXJDb250ZXh0O1xuICBcbiAgaWYgKCFjbGFpbXMpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIEpXVCBjbGFpbXMgZm91bmQgaW4gYXV0aG9yaXplciBjb250ZXh0Jyk7XG4gIH1cbiAgXG4gIC8vIFZhbGlkYXRlIHJlcXVpcmVkIGNsYWltc1xuICBpZiAoIWNsYWltcy5zdWIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ01pc3NpbmcgcmVxdWlyZWQgY2xhaW06IHN1YicpO1xuICB9XG4gIFxuICBpZiAoIWNsYWltcy5lbWFpbCkge1xuICAgIHRocm93IG5ldyBFcnJvcignTWlzc2luZyByZXF1aXJlZCBjbGFpbTogZW1haWwnKTtcbiAgfVxuICBcbiAgaWYgKCFjbGFpbXMuaWF0KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdNaXNzaW5nIHJlcXVpcmVkIGNsYWltOiBpYXQnKTtcbiAgfVxuICBcbiAgaWYgKCFjbGFpbXMuZXhwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdNaXNzaW5nIHJlcXVpcmVkIGNsYWltOiBleHAnKTtcbiAgfVxuICBcbiAgLy8gQ29udmVydCB0aW1lc3RhbXBzIHRvIG51bWJlcnMgKEFQSSBHYXRld2F5IGZvcm1hdHMgdGhlbSBhcyBkYXRlIHN0cmluZ3MpXG4gIGxldCBpYXQ6IG51bWJlcjtcbiAgbGV0IGV4cDogbnVtYmVyO1xuICBcbiAgaWYgKHR5cGVvZiBjbGFpbXMuaWF0ID09PSAnc3RyaW5nJykge1xuICAgIC8vIENoZWNrIGlmIGl0J3MgYSBVbml4IHRpbWVzdGFtcCBzdHJpbmcgb3IgYSBmb3JtYXR0ZWQgZGF0ZSBzdHJpbmdcbiAgICBpZiAoL15cXGQrJC8udGVzdChjbGFpbXMuaWF0KSkge1xuICAgICAgaWF0ID0gcGFyc2VJbnQoY2xhaW1zLmlhdCwgMTApO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBQYXJzZSBmb3JtYXR0ZWQgZGF0ZSBzdHJpbmdcbiAgICAgIGlhdCA9IE1hdGguZmxvb3IobmV3IERhdGUoY2xhaW1zLmlhdCkuZ2V0VGltZSgpIC8gMTAwMCk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlhdCA9IE51bWJlcihjbGFpbXMuaWF0KTtcbiAgfVxuICBcbiAgaWYgKHR5cGVvZiBjbGFpbXMuZXhwID09PSAnc3RyaW5nJykge1xuICAgIC8vIENoZWNrIGlmIGl0J3MgYSBVbml4IHRpbWVzdGFtcCBzdHJpbmcgb3IgYSBmb3JtYXR0ZWQgZGF0ZSBzdHJpbmdcbiAgICBpZiAoL15cXGQrJC8udGVzdChjbGFpbXMuZXhwKSkge1xuICAgICAgZXhwID0gcGFyc2VJbnQoY2xhaW1zLmV4cCwgMTApO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBQYXJzZSBmb3JtYXR0ZWQgZGF0ZSBzdHJpbmdcbiAgICAgIGV4cCA9IE1hdGguZmxvb3IobmV3IERhdGUoY2xhaW1zLmV4cCkuZ2V0VGltZSgpIC8gMTAwMCk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGV4cCA9IE51bWJlcihjbGFpbXMuZXhwKTtcbiAgfVxuICBcbiAgaWYgKGlzTmFOKGlhdCkgfHwgaXNOYU4oZXhwKSkge1xuICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCB0aW1lc3RhbXAgY2xhaW1zJyk7XG4gIH1cbiAgXG4gIC8vIENoZWNrIGlmIHRva2VuIGlzIGV4cGlyZWQgKGFkZGl0aW9uYWwgc2FmZXR5IGNoZWNrKVxuICBjb25zdCBub3cgPSBNYXRoLmZsb29yKERhdGUubm93KCkgLyAxMDAwKTtcbiAgaWYgKGV4cCA8IG5vdykge1xuICAgIHRocm93IG5ldyBFcnJvcignSldUIHRva2VuIGhhcyBleHBpcmVkJyk7XG4gIH1cbiAgXG4gIHJldHVybiB7XG4gICAgc3ViOiBjbGFpbXMuc3ViLFxuICAgIGVtYWlsOiBjbGFpbXMuZW1haWwsXG4gICAgaWF0LFxuICAgIGV4cCxcbiAgICBpc3M6IGNsYWltcy5pc3MgfHwgJycsXG4gICAgYXVkOiBjbGFpbXMuYXVkIHx8ICcnLFxuICAgICdjdXN0b206c3lzdGVtX3JvbGUnOiBjbGFpbXNbJ2N1c3RvbTpzeXN0ZW1fcm9sZSddLFxuICB9O1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdXNlciBJRCBmcm9tIEpXVCBjbGFpbXNcbiAqIFxuICogQHBhcmFtIGNsYWltcyAtIEpXVCBjbGFpbXNcbiAqIEByZXR1cm5zIFVzZXIgSUQgKENvZ25pdG8gc3ViKVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VXNlcklkRnJvbUNsYWltcyhjbGFpbXM6IEp3dENsYWltcyk6IHN0cmluZyB7XG4gIHJldHVybiBjbGFpbXMuc3ViO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgZW1haWwgZnJvbSBKV1QgY2xhaW1zXG4gKiBcbiAqIEBwYXJhbSBjbGFpbXMgLSBKV1QgY2xhaW1zXG4gKiBAcmV0dXJucyBFbWFpbCBhZGRyZXNzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRFbWFpbEZyb21DbGFpbXMoY2xhaW1zOiBKd3RDbGFpbXMpOiBzdHJpbmcge1xuICByZXR1cm4gY2xhaW1zLmVtYWlsO1xufVxuXG4vKipcbiAqIEV4dHJhY3Qgc3lzdGVtIHJvbGUgZnJvbSBKV1QgY2xhaW1zXG4gKiBcbiAqIEBwYXJhbSBjbGFpbXMgLSBKV1QgY2xhaW1zXG4gKiBAcmV0dXJucyBTeXN0ZW0gcm9sZSBvciAnVXNlcicgYXMgZGVmYXVsdFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3lzdGVtUm9sZUZyb21DbGFpbXMoY2xhaW1zOiBKd3RDbGFpbXMpOiAnVXNlcicgfCAnU2l0ZUFkbWluJyB7XG4gIGNvbnN0IGN1c3RvbVJvbGUgPSBjbGFpbXNbJ2N1c3RvbTpzeXN0ZW1fcm9sZSddO1xuICBcbiAgLy8gVmFsaWRhdGUgYW5kIHJldHVybiBzeXN0ZW0gcm9sZSwgZGVmYXVsdCB0byAnVXNlcidcbiAgaWYgKGN1c3RvbVJvbGUgPT09ICdTaXRlQWRtaW4nKSB7XG4gICAgcmV0dXJuICdTaXRlQWRtaW4nO1xuICB9XG4gIFxuICByZXR1cm4gJ1VzZXInO1xufSJdfQ==