/**
 * Token Encryption Service
 *
 * This service handles secure encryption and decryption of OAuth tokens.
 * Implementation should use AWS KMS or similar secure key management.
 */
export interface TokenEncryptionService {
    encrypt(plaintext: string): Promise<string>;
    decrypt(encryptedRef: string): Promise<string>;
}
/**
 * AWS KMS-based token encryption implementation
 */
export declare class KMSTokenEncryptionService implements TokenEncryptionService {
    private kmsKeyId;
    constructor(kmsKeyId: string);
    encrypt(plaintext: string): Promise<string>;
    decrypt(encryptedRef: string): Promise<string>;
}
/**
 * Development/testing implementation (NOT for production)
 */
export declare class MockTokenEncryptionService implements TokenEncryptionService {
    encrypt(plaintext: string): Promise<string>;
    decrypt(encryptedRef: string): Promise<string>;
}
