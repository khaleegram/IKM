// A collection of custom error types for more specific error handling,
// especially for Firestore permission issues.

export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

// A custom error for detailed Firestore permission issues.
// This allows us to capture the context of the failed request (path, operation, data)
// and display it in a developer-friendly way.
export class FirestorePermissionError extends Error {
  public context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const message = `Firestore permission denied on path '${context.path}' for operation '${context.operation}'.`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;
  }

  public toString(): string {
     // Create a more detailed error message for the toast/console
    let detailedMessage = `Operation: ${this.context.operation}\nPath: ${this.context.path}`;
    if (this.context.requestResourceData) {
      try {
        detailedMessage += `\nData: ${JSON.stringify(this.context.requestResourceData, null, 2)}`;
      } catch (e) {
        // Ignore if data can't be stringified
      }
    }
    return detailedMessage;
  }
}

// Type guard to check if an error is our custom FirestorePermissionError
export function isFirebaseError(error: any): error is FirestorePermissionError {
    return error instanceof FirestorePermissionError && error.name === 'FirestorePermissionError';
}
