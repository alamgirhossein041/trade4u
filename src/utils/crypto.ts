import * as crypto from 'crypto';

/*
 * This class is used for the Encryption and Decryption of User Secrets.
 */
export class Crypto {
  /*
   * Encryption algorithm
   */
  public static algorithm: string = process.env.ENC_ALGORITHM;

  /*
   * Encryption secret key
   */
  public static secretKey: string = process.env.ENC_SECRETPASS;

  /*
   * iv
   */
  public static iv: string = process.env.ENC_IV;

  /*
   * This function is used for Encryption of secret.
   * @param text Secret Key for Encryption.
   * @returns string
   */
  public static encrypt(text: string) {
    var cipher = crypto.createCipheriv(
      process.env.ENC_ALGORITHM,
      Buffer.from(process.env.ENC_SECRETPASS),
      Buffer.from(process.env.ENC_IV),
    );
    var encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /*
   * This function is used for decryption of Secret.
   * @param text string
   * @returns string
   */
  public static decrypt(text: string) {
    var decipher = crypto.createDecipheriv(
      process.env.ENC_ALGORITHM,
      Buffer.from(process.env.ENC_SECRETPASS),
      Buffer.from(process.env.ENC_IV),
    );
    var decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
