"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticipationEntity = void 0;
const participation_1 = require("../../../../shared/types/participation");
const id_generator_1 = require("../../../../shared/utils/id-generator");
class ParticipationEntity {
    constructor(participation) {
        this.participation = participation;
    }
    static create(rideId, clubId, userId, request, status = participation_1.ParticipationStatus.CONFIRMED, waitlistPosition) {
        const participationId = (0, id_generator_1.generateId)('part');
        const now = new Date().toISOString();
        const participation = {
            participationId,
            rideId,
            clubId,
            userId,
            role: participation_1.RideRole.PARTICIPANT,
            status,
            joinedAt: now,
            message: request.message,
            waitlistPosition
        };
        return new ParticipationEntity(participation);
    }
    static createCaptain(rideId, clubId, userId) {
        const participationId = (0, id_generator_1.generateId)('part');
        const now = new Date().toISOString();
        const participation = {
            participationId,
            rideId,
            clubId,
            userId,
            role: participation_1.RideRole.CAPTAIN,
            status: participation_1.ParticipationStatus.CONFIRMED,
            joinedAt: now
        };
        return new ParticipationEntity(participation);
    }
    // Getters
    get participationId() { return this.participation.participationId; }
    get rideId() { return this.participation.rideId; }
    get clubId() { return this.participation.clubId; }
    get userId() { return this.participation.userId; }
    get role() { return this.participation.role; }
    get status() { return this.participation.status; }
    get waitlistPosition() { return this.participation.waitlistPosition; }
    get attendanceStatus() { return this.participation.attendanceStatus || participation_1.AttendanceStatus.UNKNOWN; }
    get evidence() { return this.participation.evidence; }
    toJSON() {
        return { ...this.participation };
    }
    // Business methods
    canUpdateRole() {
        return this.participation.status === participation_1.ParticipationStatus.CONFIRMED;
    }
    canLeave() {
        return this.participation.status === participation_1.ParticipationStatus.CONFIRMED ||
            this.participation.status === participation_1.ParticipationStatus.WAITLISTED;
    }
    updateRole(newRole, reason) {
        if (!this.canUpdateRole()) {
            throw new Error('Cannot update role for non-confirmed participant');
        }
        this.participation.role = newRole;
    }
    withdraw() {
        if (!this.canLeave()) {
            throw new Error('Cannot withdraw from ride in current status');
        }
        this.participation.status = participation_1.ParticipationStatus.WITHDRAWN;
        this.participation.waitlistPosition = undefined;
    }
    remove() {
        this.participation.status = participation_1.ParticipationStatus.REMOVED;
        this.participation.waitlistPosition = undefined;
    }
    promoteFromWaitlist() {
        if (this.participation.status !== participation_1.ParticipationStatus.WAITLISTED) {
            throw new Error('Can only promote waitlisted participants');
        }
        this.participation.status = participation_1.ParticipationStatus.CONFIRMED;
        this.participation.waitlistPosition = undefined;
    }
    updateWaitlistPosition(position) {
        if (this.participation.status !== participation_1.ParticipationStatus.WAITLISTED) {
            throw new Error('Can only update waitlist position for waitlisted participants');
        }
        this.participation.waitlistPosition = position;
    }
    // Phase 2.5: Attendance tracking methods
    updateAttendance(status, confirmedBy) {
        this.participation.attendanceStatus = status;
        if (confirmedBy) {
            this.participation.confirmedBy = confirmedBy;
            this.participation.confirmedAt = new Date().toISOString();
        }
    }
    linkStravaEvidence(stravaActivityId, matchType, metrics) {
        const evidence = {
            type: participation_1.EvidenceType.STRAVA,
            refId: stravaActivityId,
            matchType,
            metricsSnapshot: metrics,
            linkedAt: new Date().toISOString()
        };
        this.participation.evidence = evidence;
        this.participation.attendanceStatus = participation_1.AttendanceStatus.ATTENDED;
    }
    linkManualEvidence(evidenceId, confirmedBy) {
        const evidence = {
            type: participation_1.EvidenceType.MANUAL,
            refId: evidenceId,
            matchType: participation_1.MatchType.MANUAL,
            linkedAt: new Date().toISOString()
        };
        this.participation.evidence = evidence;
        this.participation.attendanceStatus = participation_1.AttendanceStatus.ATTENDED;
        this.participation.confirmedBy = confirmedBy;
        this.participation.confirmedAt = new Date().toISOString();
    }
    canUpdateAttendance() {
        return this.participation.status === participation_1.ParticipationStatus.CONFIRMED;
    }
    hasEvidence() {
        return this.participation.evidence !== undefined;
    }
}
exports.ParticipationEntity = ParticipationEntity;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFydGljaXBhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBhcnRpY2lwYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsMEVBU2dEO0FBQ2hELHdFQUFtRTtBQUVuRSxNQUFhLG1CQUFtQjtJQUM5QixZQUFvQixhQUFnQztRQUFoQyxrQkFBYSxHQUFiLGFBQWEsQ0FBbUI7SUFBRyxDQUFDO0lBRXhELE1BQU0sQ0FBQyxNQUFNLENBQ1gsTUFBYyxFQUNkLE1BQWMsRUFDZCxNQUFjLEVBQ2QsT0FBd0IsRUFDeEIsU0FBOEIsbUNBQW1CLENBQUMsU0FBUyxFQUMzRCxnQkFBeUI7UUFFekIsTUFBTSxlQUFlLEdBQUcsSUFBQSx5QkFBVSxFQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzNDLE1BQU0sR0FBRyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7UUFFckMsTUFBTSxhQUFhLEdBQXNCO1lBQ3ZDLGVBQWU7WUFDZixNQUFNO1lBQ04sTUFBTTtZQUNOLE1BQU07WUFDTixJQUFJLEVBQUUsd0JBQVEsQ0FBQyxXQUFXO1lBQzFCLE1BQU07WUFDTixRQUFRLEVBQUUsR0FBRztZQUNiLE9BQU8sRUFBRSxPQUFPLENBQUMsT0FBTztZQUN4QixnQkFBZ0I7U0FDakIsQ0FBQztRQUVGLE9BQU8sSUFBSSxtQkFBbUIsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUNoRCxDQUFDO0lBRUQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxNQUFjLEVBQUUsTUFBYyxFQUFFLE1BQWM7UUFDakUsTUFBTSxlQUFlLEdBQUcsSUFBQSx5QkFBVSxFQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzNDLE1BQU0sR0FBRyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7UUFFckMsTUFBTSxhQUFhLEdBQXNCO1lBQ3ZDLGVBQWU7WUFDZixNQUFNO1lBQ04sTUFBTTtZQUNOLE1BQU07WUFDTixJQUFJLEVBQUUsd0JBQVEsQ0FB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QVMsRUFBRSx5QkFBUyxDQUFDLE1BQU07WUFDM0IsUUFBUSxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO1NBQ25DLENBQUM7UUFFRixJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDdkMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsR0FBRyxnQ0FBZ0IsQ0FBQyxRQUFRLENBQUM7UUFDaEUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1FBQzdDLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDNUQsQ0FBQztJQUVELG1CQUFtQjtRQUNqQixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxLQUFLLG1DQUFtQixDQUFDLFNBQVMsQ0FBQztJQUNyRSxDQUFDO0lBRUQsV0FBVztRQUNULE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEtBQUssU0FBUyxDQUFDO0lBQ25ELENBQUM7Q0FDRjtBQXpKRCxrREF5SkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBcbiAgUmlkZVBhcnRpY2lwYXRpb24sIFxuICBQYXJ0aWNpcGF0aW9uU3RhdHVzLCBcbiAgUmlkZVJvbGUsXG4gIEpvaW5SaWRlUmVxdWVzdCxcbiAgQXR0ZW5kYW5jZVN0YXR1cyxcbiAgRXZpZGVuY2UsXG4gIEV2aWRlbmNlVHlwZSxcbiAgTWF0Y2hUeXBlXG59IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC90eXBlcy9wYXJ0aWNpcGF0aW9uJztcbmltcG9ydCB7IGdlbmVyYXRlSWQgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdXRpbHMvaWQtZ2VuZXJhdG9yJztcblxuZXhwb3J0IGNsYXNzIFBhcnRpY2lwYXRpb25FbnRpdHkge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcnRpY2lwYXRpb246IFJpZGVQYXJ0aWNpcGF0aW9uKSB7fVxuXG4gIHN0YXRpYyBjcmVhdGUoXG4gICAgcmlkZUlkOiBzdHJpbmcsXG4gICAgY2x1YklkOiBzdHJpbmcsXG4gICAgdXNlcklkOiBzdHJpbmcsXG4gICAgcmVxdWVzdDogSm9pblJpZGVSZXF1ZXN0LFxuICAgIHN0YXR1czogUGFydGljaXBhdGlvblN0YXR1cyA9IFBhcnRpY2lwYXRpb25TdGF0dXMuQ09ORklSTUVELFxuICAgIHdhaXRsaXN0UG9zaXRpb24/OiBudW1iZXJcbiAgKTogUGFydGljaXBhdGlvbkVudGl0eSB7XG4gICAgY29uc3QgcGFydGljaXBhdGlvbklkID0gZ2VuZXJhdGVJZCgncGFydCcpO1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcblxuICAgIGNvbnN0IHBhcnRpY2lwYXRpb246IFJpZGVQYXJ0aWNpcGF0aW9uID0ge1xuICAgICAgcGFydGljaXBhdGlvbklkLFxuICAgICAgcmlkZUlkLFxuICAgICAgY2x1YklkLFxuICAgICAgdXNlcklkLFxuICAgICAgcm9sZTogUmlkZVJvbGUuUEFSVElDSVBBTlQsXG4gICAgICBzdGF0dXMsXG4gICAgICBqb2luZWRBdDogbm93LFxuICAgICAgbWVzc2FnZTogcmVxdWVzdC5tZXNzYWdlLFxuICAgICAgd2FpdGxpc3RQb3NpdGlvblxuICAgIH07XG5cbiAgICByZXR1cm4gbmV3IFBhcnRpY2lwYXRpb25FbnRpdHkocGFydGljaXBhdGlvbik7XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlQ2FwdGFpbihyaWRlSWQ6IHN0cmluZywgY2x1YklkOiBzdHJpbmcsIHVzZXJJZDogc3RyaW5nKTogUGFydGljaXBhdGlvbkVudGl0eSB7XG4gICAgY29uc3QgcGFydGljaXBhdGlvbklkID0gZ2VuZXJhdGVJZCgncGFydCcpO1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcblxuICAgIGNvbnN0IHBhcnRpY2lwYXRpb246IFJpZGVQYXJ0aWNpcGF0aW9uID0ge1xuICAgICAgcGFydGljaXBhdGlvbklkLFxuICAgICAgcmlkZUlkLFxuICAgICAgY2x1YklkLFxuICAgICAgdXNlcklkLFxuICAgICAgcm9sZTogUmlkZVJvbGUuQ0FQVEFJTixcbiAgICAgIHN0YXR1czogUGFydGljaXBhdGlvblN0YXR1cy5DT05GSVJNRUQsXG4gICAgICBqb2luZWRBdDogbm93XG4gICAgfTtcblxuICAgIHJldHVybiBuZXcgUGFydGljaXBhdGlvbkVudGl0eShwYXJ0aWNpcGF0aW9uKTtcbiAgfVxuXG4gIC8vIEdldHRlcnNcbiAgZ2V0IHBhcnRpY2lwYXRpb25JZCgpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5wYXJ0aWNpcGF0aW9uLnBhcnRpY2lwYXRpb25JZDsgfVxuICBnZXQgcmlkZUlkKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLnBhcnRpY2lwYXRpb24ucmlkZUlkOyB9XG4gIGdldCBjbHViSWQoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMucGFydGljaXBhdGlvbi5jbHViSWQ7IH1cbiAgZ2V0IHVzZXJJZCgpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5wYXJ0aWNpcGF0aW9uLnVzZXJJZDsgfVxuICBnZXQgcm9sZSgpOiBSaWRlUm9sZSB7IHJldHVybiB0aGlzLnBhcnRpY2lwYXRpb24ucm9sZTsgfVxuICBnZXQgc3RhdHVzKCk6IFBhcnRpY2lwYXRpb25TdGF0dXMgeyByZXR1cm4gdGhpcy5wYXJ0aWNpcGF0aW9uLnN0YXR1czsgfVxuICBnZXQgd2FpdGxpc3RQb3NpdGlvbigpOiBudW1iZXIgfCB1bmRlZmluZWQgeyByZXR1cm4gdGhpcy5wYXJ0aWNpcGF0aW9uLndhaXRsaXN0UG9zaXRpb247IH1cbiAgZ2V0IGF0dGVuZGFuY2VTdGF0dXMoKTogQXR0ZW5kYW5jZVN0YXR1cyB7IHJldHVybiB0aGlzLnBhcnRpY2lwYXRpb24uYXR0ZW5kYW5jZVN0YXR1cyB8fCBBdHRlbmRhbmNlU3RhdHVzLlVOS05PV047IH1cbiAgZ2V0IGV2aWRlbmNlKCk6IEV2aWRlbmNlIHwgdW5kZWZpbmVkIHsgcmV0dXJuIHRoaXMucGFydGljaXBhdGlvbi5ldmlkZW5jZTsgfVxuXG4gIHRvSlNPTigpOiBSaWRlUGFydGljaXBhdGlvbiB7XG4gICAgcmV0dXJuIHsgLi4udGhpcy5wYXJ0aWNpcGF0aW9uIH07XG4gIH1cblxuICAvLyBCdXNpbmVzcyBtZXRob2RzXG4gIGNhblVwZGF0ZVJvbGUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMucGFydGljaXBhdGlvbi5zdGF0dXMgPT09IFBhcnRpY2lwYXRpb25TdGF0dXMuQ09ORklSTUVEO1xuICB9XG5cbiAgY2FuTGVhdmUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMucGFydGljaXBhdGlvbi5zdGF0dXMgPT09IFBhcnRpY2lwYXRpb25TdGF0dXMuQ09ORklSTUVEIHx8XG4gICAgICAgICAgIHRoaXMucGFydGljaXBhdGlvbi5zdGF0dXMgPT09IFBhcnRpY2lwYXRpb25TdGF0dXMuV0FJVExJU1RFRDtcbiAgfVxuXG4gIHVwZGF0ZVJvbGUobmV3Um9sZTogUmlkZVJvbGUsIHJlYXNvbj86IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICghdGhpcy5jYW5VcGRhdGVSb2xlKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHVwZGF0ZSByb2xlIGZvciBub24tY29uZmlybWVkIHBhcnRpY2lwYW50Jyk7XG4gICAgfVxuXG4gICAgdGhpcy5wYXJ0aWNpcGF0aW9uLnJvbGUgPSBuZXdSb2xlO1xuICB9XG5cbiAgd2l0aGRyYXcoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmNhbkxlYXZlKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHdpdGhkcmF3IGZyb20gcmlkZSBpbiBjdXJyZW50IHN0YXR1cycpO1xuICAgIH1cblxuICAgIHRoaXMucGFydGljaXBhdGlvbi5zdGF0dXMgPSBQYXJ0aWNpcGF0aW9uU3RhdHVzLldJVEhEUkFXTjtcbiAgICB0aGlzLnBhcnRpY2lwYXRpb24ud2FpdGxpc3RQb3NpdGlvbiA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIHJlbW92ZSgpOiB2b2lkIHtcbiAgICB0aGlzLnBhcnRpY2lwYXRpb24uc3RhdHVzID0gUGFydGljaXBhdGlvblN0YXR1cy5SRU1PVkVEO1xuICAgIHRoaXMucGFydGljaXBhdGlvbi53YWl0bGlzdFBvc2l0aW9uID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgcHJvbW90ZUZyb21XYWl0bGlzdCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5wYXJ0aWNpcGF0aW9uLnN0YXR1cyAhPT0gUGFydGljaXBhdGlvblN0YXR1cy5XQUlUTElTVEVEKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NhbiBvbmx5IHByb21vdGUgd2FpdGxpc3RlZCBwYXJ0aWNpcGFudHMnKTtcbiAgICB9XG5cbiAgICB0aGlzLnBhcnRpY2lwYXRpb24uc3RhdHVzID0gUGFydGljaXBhdGlvblN0YXR1cy5DT05GSVJNRUQ7XG4gICAgdGhpcy5wYXJ0aWNpcGF0aW9uLndhaXRsaXN0UG9zaXRpb24gPSB1bmRlZmluZWQ7XG4gIH1cblxuICB1cGRhdGVXYWl0bGlzdFBvc2l0aW9uKHBvc2l0aW9uOiBudW1iZXIpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5wYXJ0aWNpcGF0aW9uLnN0YXR1cyAhPT0gUGFydGljaXBhdGlvblN0YXR1cy5XQUlUTElTVEVEKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NhbiBvbmx5IHVwZGF0ZSB3YWl0bGlzdCBwb3NpdGlvbiBmb3Igd2FpdGxpc3RlZCBwYXJ0aWNpcGFudHMnKTtcbiAgICB9XG5cbiAgICB0aGlzLnBhcnRpY2lwYXRpb24ud2FpdGxpc3RQb3NpdGlvbiA9IHBvc2l0aW9uO1xuICB9XG5cbiAgLy8gUGhhc2UgMi41OiBBdHRlbmRhbmNlIHRyYWNraW5nIG1ldGhvZHNcbiAgdXBkYXRlQXR0ZW5kYW5jZShzdGF0dXM6IEF0dGVuZGFuY2VTdGF0dXMsIGNvbmZpcm1lZEJ5Pzogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5wYXJ0aWNpcGF0aW9uLmF0dGVuZGFuY2VTdGF0dXMgPSBzdGF0dXM7XG4gICAgaWYgKGNvbmZpcm1lZEJ5KSB7XG4gICAgICB0aGlzLnBhcnRpY2lwYXRpb24uY29uZmlybWVkQnkgPSBjb25maXJtZWRCeTtcbiAgICAgIHRoaXMucGFydGljaXBhdGlvbi5jb25maXJtZWRBdCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICB9XG4gIH1cblxuICBsaW5rU3RyYXZhRXZpZGVuY2Uoc3RyYXZhQWN0aXZpdHlJZDogc3RyaW5nLCBtYXRjaFR5cGU6IE1hdGNoVHlwZSwgbWV0cmljcz86IGFueSk6IHZvaWQge1xuICAgIGNvbnN0IGV2aWRlbmNlOiBFdmlkZW5jZSA9IHtcbiAgICAgIHR5cGU6IEV2aWRlbmNlVHlwZS5TVFJBVkEsXG4gICAgICByZWZJZDogc3RyYXZhQWN0aXZpdHlJZCxcbiAgICAgIG1hdGNoVHlwZSxcbiAgICAgIG1ldHJpY3NTbmFwc2hvdDogbWV0cmljcyxcbiAgICAgIGxpbmtlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICB9O1xuXG4gICAgdGhpcy5wYXJ0aWNpcGF0aW9uLmV2aWRlbmNlID0gZXZpZGVuY2U7XG4gICAgdGhpcy5wYXJ0aWNpcGF0aW9uLmF0dGVuZGFuY2VTdGF0dXMgPSBBdHRlbmRhbmNlU3RhdHVzLkFUVEVOREVEO1xuICB9XG5cbiAgbGlua01hbnVhbEV2aWRlbmNlKGV2aWRlbmNlSWQ6IHN0cmluZywgY29uZmlybWVkQnk6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGV2aWRlbmNlOiBFdmlkZW5jZSA9IHtcbiAgICAgIHR5cGU6IEV2aWRlbmNlVHlwZS5NQU5VQUwsXG4gICAgICByZWZJZDogZXZpZGVuY2VJZCxcbiAgICAgIG1hdGNoVHlwZTogTWF0Y2hUeXBlLk1BTlVBTCxcbiAgICAgIGxpbmtlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICB9O1xuXG4gICAgdGhpcy5wYXJ0aWNpcGF0aW9uLmV2aWRlbmNlID0gZXZpZGVuY2U7XG4gICAgdGhpcy5wYXJ0aWNpcGF0aW9uLmF0dGVuZGFuY2VTdGF0dXMgPSBBdHRlbmRhbmNlU3RhdHVzLkFUVEVOREVEO1xuICAgIHRoaXMucGFydGljaXBhdGlvbi5jb25maXJtZWRCeSA9IGNvbmZpcm1lZEJ5O1xuICAgIHRoaXMucGFydGljaXBhdGlvbi5jb25maXJtZWRBdCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgfVxuXG4gIGNhblVwZGF0ZUF0dGVuZGFuY2UoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMucGFydGljaXBhdGlvbi5zdGF0dXMgPT09IFBhcnRpY2lwYXRpb25TdGF0dXMuQ09ORklSTUVEO1xuICB9XG5cbiAgaGFzRXZpZGVuY2UoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMucGFydGljaXBhdGlvbi5ldmlkZW5jZSAhPT0gdW5kZWZpbmVkO1xuICB9XG59Il19