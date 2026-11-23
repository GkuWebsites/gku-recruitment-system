import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gku_recruitment';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gku_recruitment';
  const fallbackUri = 'mongodb://127.0.0.1:27017/gku_recruitment';

  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  const opts: mongoose.ConnectOptions = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 3000,
  };

  // If running in production with an external Atlas URI that might be blocked by firewall,
  // try primary first, then fallback to local daemon
  try {
    const conn = await mongoose.connect(primaryUri, opts);
    cached.conn = conn;
    return cached.conn;
  } catch (primaryErr) {
    if (primaryUri !== fallbackUri) {
      console.warn('External MongoDB connection timed out or blocked. Falling back to local MongoDB daemon (127.0.0.1:27017)...');
      try {
        const fallbackConn = await mongoose.connect(fallbackUri, opts);
        cached.conn = fallbackConn;
        return cached.conn;
      } catch (fallbackErr) {
        throw primaryErr;
      }
    }
    throw primaryErr;
  }
}
