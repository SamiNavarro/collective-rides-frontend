"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockTokenEncryptionService = exports.KMSTokenEncryptionService = void 0;
/**
 * AWS KMS-based token encryption implementation
 */
class KMSTokenEncryptionService {
    constructor(kmsKeyId) {
        this.kmsKeyId = kmsKeyId;
    }
    async encrypt(plaintext) {
        // Implementation would use AWS KMS to encrypt the token
        // For now, return a placeholder that indicates encryption is needed
        const AWS = require('aws-sdk');
        const kms = new AWS.KMS();
        try {
            const result = await kms.encrypt({
                KeyId: this.kmsKeyId,
                Plaintext: plaintext
            }).promise();
            // Return base64 encoded encrypted blob
            return result.CiphertextBlob.toString('base64');
        }
        catch (error) {
            console.error('KMS encryption failed:', error);
            throw new Error('Token encryption failed');
        }
    }
    async decrypt(encryptedRef) {
        // Implementation would use AWS KMS to decrypt the token
        const AWS = require('aws-sdk');
        const kms = new AWS.KMS();
        try {
            const result = await kms.decrypt({
                CiphertextBlob: Buffer.from(encryptedRef, 'base64')
            }).promise();
            return result.Plaintext.toString();
        }
        catch (error) {
            console.error('KMS decryption failed:', error);
            throw new Error('Token decryption failed');
        }
    }
}
exports.KMSTokenEncryptionService = KMSTokenEncryptionService;
/**
 * Development/testing implementation (NOT for production)
 */
class MockTokenEncryptionService {
    async encrypt(plaintext) {
        // Simple base64 encoding for development (NOT secure)
        return Buffer.from(plaintext).toString('base64');
    }
    async decrypt(encryptedRef) {
        // Simple base64 decoding for development (NOT secure)
        return Buffer.from(encryptedRef, 'base64').toString();
    }
}
exports.MockTokenEncryptionService = MockTokenEncryptionService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW4tZW5jcnlwdGlvbi1zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidG9rZW4tZW5jcnlwdGlvbi1zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQVdBOztHQUVHO0FBQ0gsTUFBYSx5QkFBeUI7SUFDcEMsWUFBb0IsUUFBZ0I7UUFBaEIsYUFBUSxHQUFSLFFBQVEsQ0FBUTtJQUFHLENBQUM7SUFFeEMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFpQjtRQUM3Qix3REFBd0Q7UUFDeEQsb0VBQW9FO1FBQ3BFLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMvQixNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUUxQixJQUFJO1lBQ0YsTUFBTSxNQUFNLEdBQUcsTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDO2dCQUMvQixLQUFLLEVBQUUsSUFBSSxDQUFDLFFBQVE7Z0JBQ3BCLFNBQVMsRUFBRSxTQUFTO2FBQ3JCLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUViLHVDQUF1QztZQUN2QyxPQUFPLE1BQU0sQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ2pEO1FBQUMsT0FBTyxLQUFLLEVBQUU7WUFDZCxPQUFPLENBQUMsS0FBSyxDQUFDLHdCQUF3QixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQy9DLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztTQUM1QztJQUNILENBQUM7SUFFRCxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQW9CO1FBQ2hDLHdEQUF3RDtRQUN4RCxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDL0IsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7UUFFMUIsSUFBSTtZQUNGLE1BQU0sTUFBTSxHQUFHLE1BQU0sR0FBRyxDQUFDLE9BQU8sQ0FBQztnQkFDL0IsY0FBYyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQzthQUNwRCxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFYixPQUFPLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUM7U0FDcEM7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNkLE9BQU8sQ0FBQyxLQUFLLENBQUMsd0JBQXdCLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDL0MsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1NBQzVDO0lBQ0gsQ0FBQztDQUNGO0FBdkNELDhEQXVDQztBQUVEOztHQUVHO0FBQ0gsTUFBYSwwQkFBMEI7SUFDckMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFpQjtRQUM3QixzREFBc0Q7UUFDdEQsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNuRCxDQUFDO0lBRUQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFvQjtRQUNoQyxzREFBc0Q7UUFDdEQsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUN4RCxDQUFDO0NBQ0Y7QUFWRCxnRUFVQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVG9rZW4gRW5jcnlwdGlvbiBTZXJ2aWNlXG4gKiBcbiAqIFRoaXMgc2VydmljZSBoYW5kbGVzIHNlY3VyZSBlbmNyeXB0aW9uIGFuZCBkZWNyeXB0aW9uIG9mIE9BdXRoIHRva2Vucy5cbiAqIEltcGxlbWVudGF0aW9uIHNob3VsZCB1c2UgQVdTIEtNUyBvciBzaW1pbGFyIHNlY3VyZSBrZXkgbWFuYWdlbWVudC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUb2tlbkVuY3J5cHRpb25TZXJ2aWNlIHtcbiAgZW5jcnlwdChwbGFpbnRleHQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPjtcbiAgZGVjcnlwdChlbmNyeXB0ZWRSZWY6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPjtcbn1cblxuLyoqXG4gKiBBV1MgS01TLWJhc2VkIHRva2VuIGVuY3J5cHRpb24gaW1wbGVtZW50YXRpb25cbiAqL1xuZXhwb3J0IGNsYXNzIEtNU1Rva2VuRW5jcnlwdGlvblNlcnZpY2UgaW1wbGVtZW50cyBUb2tlbkVuY3J5cHRpb25TZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBrbXNLZXlJZDogc3RyaW5nKSB7fVxuXG4gIGFzeW5jIGVuY3J5cHQocGxhaW50ZXh0OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIC8vIEltcGxlbWVudGF0aW9uIHdvdWxkIHVzZSBBV1MgS01TIHRvIGVuY3J5cHQgdGhlIHRva2VuXG4gICAgLy8gRm9yIG5vdywgcmV0dXJuIGEgcGxhY2Vob2xkZXIgdGhhdCBpbmRpY2F0ZXMgZW5jcnlwdGlvbiBpcyBuZWVkZWRcbiAgICBjb25zdCBBV1MgPSByZXF1aXJlKCdhd3Mtc2RrJyk7XG4gICAgY29uc3Qga21zID0gbmV3IEFXUy5LTVMoKTtcbiAgICBcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQga21zLmVuY3J5cHQoe1xuICAgICAgICBLZXlJZDogdGhpcy5rbXNLZXlJZCxcbiAgICAgICAgUGxhaW50ZXh0OiBwbGFpbnRleHRcbiAgICAgIH0pLnByb21pc2UoKTtcbiAgICAgIFxuICAgICAgLy8gUmV0dXJuIGJhc2U2NCBlbmNvZGVkIGVuY3J5cHRlZCBibG9iXG4gICAgICByZXR1cm4gcmVzdWx0LkNpcGhlcnRleHRCbG9iLnRvU3RyaW5nKCdiYXNlNjQnKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignS01TIGVuY3J5cHRpb24gZmFpbGVkOicsIGVycm9yKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVG9rZW4gZW5jcnlwdGlvbiBmYWlsZWQnKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBkZWNyeXB0KGVuY3J5cHRlZFJlZjogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAvLyBJbXBsZW1lbnRhdGlvbiB3b3VsZCB1c2UgQVdTIEtNUyB0byBkZWNyeXB0IHRoZSB0b2tlblxuICAgIGNvbnN0IEFXUyA9IHJlcXVpcmUoJ2F3cy1zZGsnKTtcbiAgICBjb25zdCBrbXMgPSBuZXcgQVdTLktNUygpO1xuICAgIFxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBrbXMuZGVjcnlwdCh7XG4gICAgICAgIENpcGhlcnRleHRCbG9iOiBCdWZmZXIuZnJvbShlbmNyeXB0ZWRSZWYsICdiYXNlNjQnKVxuICAgICAgfSkucHJvbWlzZSgpO1xuICAgICAgXG4gICAgICByZXR1cm4gcmVzdWx0LlBsYWludGV4dC50b1N0cmluZygpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdLTVMgZGVjcnlwdGlvbiBmYWlsZWQ6JywgZXJyb3IpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUb2tlbiBkZWNyeXB0aW9uIGZhaWxlZCcpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIERldmVsb3BtZW50L3Rlc3RpbmcgaW1wbGVtZW50YXRpb24gKE5PVCBmb3IgcHJvZHVjdGlvbilcbiAqL1xuZXhwb3J0IGNsYXNzIE1vY2tUb2tlbkVuY3J5cHRpb25TZXJ2aWNlIGltcGxlbWVudHMgVG9rZW5FbmNyeXB0aW9uU2VydmljZSB7XG4gIGFzeW5jIGVuY3J5cHQocGxhaW50ZXh0OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIC8vIFNpbXBsZSBiYXNlNjQgZW5jb2RpbmcgZm9yIGRldmVsb3BtZW50IChOT1Qgc2VjdXJlKVxuICAgIHJldHVybiBCdWZmZXIuZnJvbShwbGFpbnRleHQpLnRvU3RyaW5nKCdiYXNlNjQnKTtcbiAgfVxuXG4gIGFzeW5jIGRlY3J5cHQoZW5jcnlwdGVkUmVmOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIC8vIFNpbXBsZSBiYXNlNjQgZGVjb2RpbmcgZm9yIGRldmVsb3BtZW50IChOT1Qgc2VjdXJlKVxuICAgIHJldHVybiBCdWZmZXIuZnJvbShlbmNyeXB0ZWRSZWYsICdiYXNlNjQnKS50b1N0cmluZygpO1xuICB9XG59Il19