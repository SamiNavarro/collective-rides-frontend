"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const handler = async (event) => {
    const method = event.httpMethod;
    if (method === 'GET') {
        // Handle subscription verification challenge
        return handleSubscriptionChallenge(event);
    }
    else if (method === 'POST') {
        // Handle webhook event
        return handleWebhookEvent(event);
    }
    return {
        statusCode: 405,
        body: JSON.stringify({
            success: false,
            error: 'Method not allowed'
        })
    };
};
exports.handler = handler;
async function handleSubscriptionChallenge(event) {
    const params = event.queryStringParameters;
    if (!params) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                success: false,
                error: 'Missing query parameters'
            })
        };
    }
    const mode = params['hub.mode'];
    const challenge = params['hub.challenge'];
    const verifyToken = params['hub.verify_token'];
    const expectedToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;
    if (mode === 'subscribe' && verifyToken === expectedToken) {
        console.log('Strava webhook subscription verified');
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'hub.challenge': challenge
            })
        };
    }
    return {
        statusCode: 403,
        body: JSON.stringify({
            success: false,
            error: 'Forbidden'
        })
    };
}
async function handleWebhookEvent(event) {
    try {
        // Verify webhook authenticity (implementation depends on Strava's verification method)
        if (!verifyWebhookSignature(event)) {
            return {
                statusCode: 403,
                body: JSON.stringify({
                    success: false,
                    error: 'Invalid webhook signature'
                })
            };
        }
        const webhookEvent = JSON.parse(event.body || '{}');
        // Process webhook event asynchronously
        await processWebhookEvent(webhookEvent);
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true
            })
        };
    }
    catch (error) {
        console.error('Webhook processing error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: 'Webhook processing failed'
            })
        };
    }
}
function verifyWebhookSignature(event) {
    // Implementation depends on Strava's webhook verification mechanism
    // This is a placeholder that should be implemented based on Strava's documentation
    // For now, return true for development
    // In production, this should verify the webhook signature
    return true;
}
async function processWebhookEvent(webhookEvent) {
    console.log('Processing Strava webhook event:', webhookEvent);
    // Only process activity events
    if (webhookEvent.object_type !== 'activity') {
        console.log('Ignoring non-activity webhook event');
        return;
    }
    // Handle different aspect types
    switch (webhookEvent.aspect_type) {
        case 'create':
            await handleActivityCreated(webhookEvent);
            break;
        case 'update':
            await handleActivityUpdated(webhookEvent);
            break;
        case 'delete':
            await handleActivityDeleted(webhookEvent);
            break;
        default:
            console.log(`Unhandled aspect type: ${webhookEvent.aspect_type}`);
    }
}
async function handleActivityCreated(webhookEvent) {
    console.log(`Activity created: ${webhookEvent.object_id} by athlete ${webhookEvent.owner_id}`);
    // TODO: Implement activity ingestion and matching
    // 1. Fetch activity details from Strava API
    // 2. Store activity in our database
    // 3. Attempt to match with recent rides
    // 4. Update participation evidence if matched
}
async function handleActivityUpdated(webhookEvent) {
    console.log(`Activity updated: ${webhookEvent.object_id}`);
    // TODO: Update stored activity data
    // Re-evaluate ride matching if relevant fields changed
}
async function handleActivityDeleted(webhookEvent) {
    console.log(`Activity deleted: ${webhookEvent.object_id}`);
    // TODO: Remove activity from our database
    // Remove evidence links if this activity was used as evidence
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViaG9vay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIndlYmhvb2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBR08sTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUMxQixLQUEyQixFQUNLLEVBQUU7SUFDbEMsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQztJQUVoQyxJQUFJLE1BQU0sS0FBSyxLQUFLLEVBQUU7UUFDcEIsNkNBQTZDO1FBQzdDLE9BQU8sMkJBQTJCLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDM0M7U0FBTSxJQUFJLE1BQU0sS0FBSyxNQUFNLEVBQUU7UUFDNUIsdUJBQXVCO1FBQ3ZCLE9BQU8sa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDbEM7SUFFRCxPQUFPO1FBQ0wsVUFBVSxFQUFFLEdBQUc7UUFDZixJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUNuQixPQUFPLEVBQUUsS0FBSztZQUNkLEtBQUssRUFBRSxvQkFBb0I7U0FDNUIsQ0FBQztLQUNILENBQUM7QUFDSixDQUFDLENBQUM7QUFwQlcsUUFBQSxPQUFPLFdBb0JsQjtBQUVGLEtBQUssVUFBVSwyQkFBMkIsQ0FDeEMsS0FBMkI7SUFFM0IsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLHFCQUFxQixDQUFDO0lBRTNDLElBQUksQ0FBQyxNQUFNLEVBQUU7UUFDWCxPQUFPO1lBQ0wsVUFBVSxFQUFFLEdBQUc7WUFDZixJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDbkIsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsS0FBSyxFQUFFLDBCQUEwQjthQUNsQyxDQUFDO1NBQ0gsQ0FBQztLQUNIO0lBRUQsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ2hDLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUMxQyxNQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsa0JBQWtCLENB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QyxZQUFnQztJQUNuRSxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixZQUFZLENBQUMsU0FBUyxlQUFlLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBRS9GLGtEQUFrRDtJQUNsRCw0Q0FBNEM7SUFDNUMsb0NBQW9DO0lBQ3BDLHdDQUF3QztJQUN4Qyw4Q0FBOEM7QUFDaEQsQ0FBQztBQUVELEtBQUssVUFBVSxxQkFBcUIsQ0FBQyxZQUFnQztJQUNuRSxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixZQUFZLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztJQUUzRCxvQ0FBb0M7SUFDcEMsdURBQXVEO0FBQ3pELENBQUM7QUFFRCxLQUFLLFVBQVUscUJBQXFCLENBQUMsWUFBZ0M7SUFDbkUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsWUFBWSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7SUFFM0QsMENBQTBDO0lBQzFDLDhEQUE4RDtBQUNoRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQVBJR2F0ZXdheVByb3h5RXZlbnQsIEFQSUdhdGV3YXlQcm94eVJlc3VsdCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgU3RyYXZhV2ViaG9va0V2ZW50LCBTdHJhdmFXZWJob29rQ2hhbGxlbmdlIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3R5cGVzL3N0cmF2YSc7XG5cbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKFxuICBldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnRcbik6IFByb21pc2U8QVBJR2F0ZXdheVByb3h5UmVzdWx0PiA9PiB7XG4gIGNvbnN0IG1ldGhvZCA9IGV2ZW50Lmh0dHBNZXRob2Q7XG4gIFxuICBpZiAobWV0aG9kID09PSAnR0VUJykge1xuICAgIC8vIEhhbmRsZSBzdWJzY3JpcHRpb24gdmVyaWZpY2F0aW9uIGNoYWxsZW5nZVxuICAgIHJldHVybiBoYW5kbGVTdWJzY3JpcHRpb25DaGFsbGVuZ2UoZXZlbnQpO1xuICB9IGVsc2UgaWYgKG1ldGhvZCA9PT0gJ1BPU1QnKSB7XG4gICAgLy8gSGFuZGxlIHdlYmhvb2sgZXZlbnRcbiAgICByZXR1cm4gaGFuZGxlV2ViaG9va0V2ZW50KGV2ZW50KTtcbiAgfVxuICBcbiAgcmV0dXJuIHtcbiAgICBzdGF0dXNDb2RlOiA0MDUsXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBlcnJvcjogJ01ldGhvZCBub3QgYWxsb3dlZCdcbiAgICB9KVxuICB9O1xufTtcblxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlU3Vic2NyaXB0aW9uQ2hhbGxlbmdlKFxuICBldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnRcbik6IFByb21pc2U8QVBJR2F0ZXdheVByb3h5UmVzdWx0PiB7XG4gIGNvbnN0IHBhcmFtcyA9IGV2ZW50LnF1ZXJ5U3RyaW5nUGFyYW1ldGVycztcbiAgXG4gIGlmICghcGFyYW1zKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1c0NvZGU6IDQwMCxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIGVycm9yOiAnTWlzc2luZyBxdWVyeSBwYXJhbWV0ZXJzJ1xuICAgICAgfSlcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgbW9kZSA9IHBhcmFtc1snaHViLm1vZGUnXTtcbiAgY29uc3QgY2hhbGxlbmdlID0gcGFyYW1zWydodWIuY2hhbGxlbmdlJ107XG4gIGNvbnN0IHZlcmlmeVRva2VuID0gcGFyYW1zWydodWIudmVyaWZ5X3Rva2VuJ107XG4gIFxuICBjb25zdCBleHBlY3RlZFRva2VuID0gcHJvY2Vzcy5lbnYuU1RSQVZBX1dFQkhPT0tfVkVSSUZZX1RPS0VOO1xuICBcbiAgaWYgKG1vZGUgPT09ICdzdWJzY3JpYmUnICYmIHZlcmlmeVRva2VuID09PSBleHBlY3RlZFRva2VuKSB7XG4gICAgY29uc29sZS5sb2coJ1N0cmF2YSB3ZWJob29rIHN1YnNjcmlwdGlvbiB2ZXJpZmllZCcpO1xuICAgIHJldHVybiB7XG4gICAgICBzdGF0dXNDb2RlOiAyMDAsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICdodWIuY2hhbGxlbmdlJzogY2hhbGxlbmdlXG4gICAgICB9KVxuICAgIH07XG4gIH1cbiAgXG4gIHJldHVybiB7XG4gICAgc3RhdHVzQ29kZTogNDAzLFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgZXJyb3I6ICdGb3JiaWRkZW4nXG4gICAgfSlcbiAgfTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlV2ViaG9va0V2ZW50KFxuICBldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnRcbik6IFByb21pc2U8QVBJR2F0ZXdheVByb3h5UmVzdWx0PiB7XG4gIHRyeSB7XG4gICAgLy8gVmVyaWZ5IHdlYmhvb2sgYXV0aGVudGljaXR5IChpbXBsZW1lbnRhdGlvbiBkZXBlbmRzIG9uIFN0cmF2YSdzIHZlcmlmaWNhdGlvbiBtZXRob2QpXG4gICAgaWYgKCF2ZXJpZnlXZWJob29rU2lnbmF0dXJlKGV2ZW50KSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3RhdHVzQ29kZTogNDAzLFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgZXJyb3I6ICdJbnZhbGlkIHdlYmhvb2sgc2lnbmF0dXJlJ1xuICAgICAgICB9KVxuICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zdCB3ZWJob29rRXZlbnQ6IFN0cmF2YVdlYmhvb2tFdmVudCA9IEpTT04ucGFyc2UoZXZlbnQuYm9keSB8fCAne30nKTtcbiAgICBcbiAgICAvLyBQcm9jZXNzIHdlYmhvb2sgZXZlbnQgYXN5bmNocm9ub3VzbHlcbiAgICBhd2FpdCBwcm9jZXNzV2ViaG9va0V2ZW50KHdlYmhvb2tFdmVudCk7XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1c0NvZGU6IDIwMCxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZVxuICAgICAgfSlcbiAgICB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1dlYmhvb2sgcHJvY2Vzc2luZyBlcnJvcjonLCBlcnJvcik7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1c0NvZGU6IDUwMCxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIGVycm9yOiAnV2ViaG9vayBwcm9jZXNzaW5nIGZhaWxlZCdcbiAgICAgIH0pXG4gICAgfTtcbiAgfVxufVxuXG5mdW5jdGlvbiB2ZXJpZnlXZWJob29rU2lnbmF0dXJlKGV2ZW50OiBBUElHYXRld2F5UHJveHlFdmVudCk6IGJvb2xlYW4ge1xuICAvLyBJbXBsZW1lbnRhdGlvbiBkZXBlbmRzIG9uIFN0cmF2YSdzIHdlYmhvb2sgdmVyaWZpY2F0aW9uIG1lY2hhbmlzbVxuICAvLyBUaGlzIGlzIGEgcGxhY2Vob2xkZXIgdGhhdCBzaG91bGQgYmUgaW1wbGVtZW50ZWQgYmFzZWQgb24gU3RyYXZhJ3MgZG9jdW1lbnRhdGlvblxuICBcbiAgLy8gRm9yIG5vdywgcmV0dXJuIHRydWUgZm9yIGRldmVsb3BtZW50XG4gIC8vIEluIHByb2R1Y3Rpb24sIHRoaXMgc2hvdWxkIHZlcmlmeSB0aGUgd2ViaG9vayBzaWduYXR1cmVcbiAgcmV0dXJuIHRydWU7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHByb2Nlc3NXZWJob29rRXZlbnQod2ViaG9va0V2ZW50OiBTdHJhdmFXZWJob29rRXZlbnQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc29sZS5sb2coJ1Byb2Nlc3NpbmcgU3RyYXZhIHdlYmhvb2sgZXZlbnQ6Jywgd2ViaG9va0V2ZW50KTtcbiAgXG4gIC8vIE9ubHkgcHJvY2VzcyBhY3Rpdml0eSBldmVudHNcbiAgaWYgKHdlYmhvb2tFdmVudC5vYmplY3RfdHlwZSAhPT0gJ2FjdGl2aXR5Jykge1xuICAgIGNvbnNvbGUubG9nKCdJZ25vcmluZyBub24tYWN0aXZpdHkgd2ViaG9vayBldmVudCcpO1xuICAgIHJldHVybjtcbiAgfVxuICBcbiAgLy8gSGFuZGxlIGRpZmZlcmVudCBhc3BlY3QgdHlwZXNcbiAgc3dpdGNoICh3ZWJob29rRXZlbnQuYXNwZWN0X3R5cGUpIHtcbiAgICBjYXNlICdjcmVhdGUnOlxuICAgICAgYXdhaXQgaGFuZGxlQWN0aXZpdHlDcmVhdGVkKHdlYmhvb2tFdmVudCk7XG4gICAgICBicmVhaztcbiAgICBjYXNlICd1cGRhdGUnOlxuICAgICAgYXdhaXQgaGFuZGxlQWN0aXZpdHlVcGRhdGVkKHdlYmhvb2tFdmVudCk7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdkZWxldGUnOlxuICAgICAgYXdhaXQgaGFuZGxlQWN0aXZpdHlEZWxldGVkKHdlYmhvb2tFdmVudCk7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgY29uc29sZS5sb2coYFVuaGFuZGxlZCBhc3BlY3QgdHlwZTogJHt3ZWJob29rRXZlbnQuYXNwZWN0X3R5cGV9YCk7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlQWN0aXZpdHlDcmVhdGVkKHdlYmhvb2tFdmVudDogU3RyYXZhV2ViaG9va0V2ZW50KTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnNvbGUubG9nKGBBY3Rpdml0eSBjcmVhdGVkOiAke3dlYmhvb2tFdmVudC5vYmplY3RfaWR9IGJ5IGF0aGxldGUgJHt3ZWJob29rRXZlbnQub3duZXJfaWR9YCk7XG4gIFxuICAvLyBUT0RPOiBJbXBsZW1lbnQgYWN0aXZpdHkgaW5nZXN0aW9uIGFuZCBtYXRjaGluZ1xuICAvLyAxLiBGZXRjaCBhY3Rpdml0eSBkZXRhaWxzIGZyb20gU3RyYXZhIEFQSVxuICAvLyAyLiBTdG9yZSBhY3Rpdml0eSBpbiBvdXIgZGF0YWJhc2VcbiAgLy8gMy4gQXR0ZW1wdCB0byBtYXRjaCB3aXRoIHJlY2VudCByaWRlc1xuICAvLyA0LiBVcGRhdGUgcGFydGljaXBhdGlvbiBldmlkZW5jZSBpZiBtYXRjaGVkXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGhhbmRsZUFjdGl2aXR5VXBkYXRlZCh3ZWJob29rRXZlbnQ6IFN0cmF2YVdlYmhvb2tFdmVudCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zb2xlLmxvZyhgQWN0aXZpdHkgdXBkYXRlZDogJHt3ZWJob29rRXZlbnQub2JqZWN0X2lkfWApO1xuICBcbiAgLy8gVE9ETzogVXBkYXRlIHN0b3JlZCBhY3Rpdml0eSBkYXRhXG4gIC8vIFJlLWV2YWx1YXRlIHJpZGUgbWF0Y2hpbmcgaWYgcmVsZXZhbnQgZmllbGRzIGNoYW5nZWRcbn1cblxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlQWN0aXZpdHlEZWxldGVkKHdlYmhvb2tFdmVudDogU3RyYXZhV2ViaG9va0V2ZW50KTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnNvbGUubG9nKGBBY3Rpdml0eSBkZWxldGVkOiAke3dlYmhvb2tFdmVudC5vYmplY3RfaWR9YCk7XG4gIFxuICAvLyBUT0RPOiBSZW1vdmUgYWN0aXZpdHkgZnJvbSBvdXIgZGF0YWJhc2VcbiAgLy8gUmVtb3ZlIGV2aWRlbmNlIGxpbmtzIGlmIHRoaXMgYWN0aXZpdHkgd2FzIHVzZWQgYXMgZXZpZGVuY2Vcbn0iXX0=