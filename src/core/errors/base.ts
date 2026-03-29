/**
 * Base error class for all Filedromat-specific errors.
 */
export class FiledromatError extends Error {
  public readonly code: string;
  public readonly shouldExit: boolean;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', shouldExit: boolean = true) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.shouldExit = shouldExit;
    Object.setPrototypeOf(this, new.target.prototype); // Restore prototype chain
  }
}
