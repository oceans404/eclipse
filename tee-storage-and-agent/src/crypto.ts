import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits
const MASTER_KEY_LENGTH = 32; // 256 bits

export interface EncryptedData {
  encryptedBuffer: Buffer;
  wrappedKey: string;
  iv: string;
  authTag: string;
  algorithm: string;
  keyVersion: string;
}

export class CryptoService {
  private masterKey: Buffer;
  private keyVersion = 'v1';

  constructor() {
    // Load master key from environment
    const masterKeyHex = process.env.MASTER_KEY;
    if (!masterKeyHex || masterKeyHex.length !== MASTER_KEY_LENGTH * 2) {
      throw new Error('MASTER_KEY must be exactly 64 hex characters (32 bytes)');
    }
    
    this.masterKey = Buffer.from(masterKeyHex, 'hex');
  }

  /**
   * Encrypts a file with AES-256-GCM using a randomly generated key
   */
  encryptFile(fileBuffer: Buffer): EncryptedData {
    // Generate random data key and IV
    const dataKey = randomBytes(KEY_LENGTH);
    const iv = randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = createCipheriv(ALGORITHM, dataKey, iv);
    
    // Encrypt the file
    const encrypted = Buffer.concat([
      cipher.update(fileBuffer),
      cipher.final()
    ]);

    // Get the authentication tag
    const authTag = cipher.getAuthTag();

    // Wrap the data key with master key
    const wrappedKey = this.wrapKey(dataKey);

    return {
      encryptedBuffer: encrypted,
      wrappedKey: wrappedKey,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      algorithm: ALGORITHM,
      keyVersion: this.keyVersion
    };
  }

  /**
   * Decrypts a file using the wrapped key
   */
  decryptFile(
    encryptedBuffer: Buffer, 
    wrappedKey: string, 
    iv: string, 
    authTag: string
  ): Buffer {
    // Unwrap the data key
    const dataKey = this.unwrapKey(wrappedKey);
    
    // Convert base64 strings back to buffers
    const ivBuffer = Buffer.from(iv, 'base64');
    const authTagBuffer = Buffer.from(authTag, 'base64');

    // Create decipher
    const decipher = createDecipheriv(ALGORITHM, dataKey, ivBuffer);
    decipher.setAuthTag(authTagBuffer);

    // Decrypt the file
    const decrypted = Buffer.concat([
      decipher.update(encryptedBuffer),
      decipher.final()
    ]);

    // Clear sensitive data from memory
    dataKey.fill(0);

    return decrypted;
  }

  /**
   * Wraps a data key using the master key
   */
  private wrapKey(dataKey: Buffer): string {
    // Simple XOR wrapping for POC - in production use proper KMS or AES key wrapping
    const wrapped = Buffer.alloc(dataKey.length);
    for (let i = 0; i < dataKey.length; i++) {
      wrapped[i] = dataKey[i] ^ this.masterKey[i % this.masterKey.length];
    }
    return wrapped.toString('base64');
  }

  /**
   * Unwraps a data key using the master key
   */
  private unwrapKey(wrappedKey: string): Buffer {
    // Reverse the XOR wrapping
    const wrapped = Buffer.from(wrappedKey, 'base64');
    const dataKey = Buffer.alloc(wrapped.length);
    for (let i = 0; i < wrapped.length; i++) {
      dataKey[i] = wrapped[i] ^ this.masterKey[i % this.masterKey.length];
    }
    return dataKey;
  }

  /**
   * Generates a secure master key for initial setup
   */
  static generateMasterKey(): string {
    return randomBytes(MASTER_KEY_LENGTH).toString('hex');
  }
}