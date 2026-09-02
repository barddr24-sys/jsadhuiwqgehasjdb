/**
 * MongoDB Mongoose Connection Manager
 *
 * Implements cached singleton connection for Next.js server runtime
 * and serverless lifecycle.
 *
 * Credentials MUST come from environment variables.
 * Never logs credentials or exposes URI to client.
 */

import mongoose from 'mongoose';

interface MongooseConnectionCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseConnectionCache | undefined;
}

const cached: MongooseConnectionCache = global.mongooseCache || {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export interface ConnectOptions {
  uri?: string;
  dbName?: string;
}

/**
 * Connects to MongoDB using environment variables or optional custom URI (for testing).
 */
export async function connectToDatabase(
  options: ConnectOptions = {}
): Promise<typeof mongoose> {
  const uri = options.uri || process.env.MONGODB_URI;
  const dbName = options.dbName || process.env.MONGODB_DB_NAME;

  if (!uri) {
    throw new Error(
      'MongoDB connection failed: MONGODB_URI environment variable is not defined.'
    );
  }

  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      ...(dbName ? { dbName } : {}),
    };

    cached.promise = mongoose.connect(uri, opts).then((m) => {
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

/**
 * Disconnects from MongoDB (useful for cleanup in test suites).
 */
export async function disconnectFromDatabase(): Promise<void> {
  if (cached.conn) {
    await cached.conn.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}

/**
 * Returns current connection state
 */
export function getConnectionState(): number {
  return mongoose.connection.readyState;
}

/**
 * Returns true if MongoDB connection is open and ready
 */
export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
