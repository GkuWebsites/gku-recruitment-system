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

/**
 * Self-healing helper: if running on Linux cPanel host and mongod is down,
 * attempt to start the daemon in the background before connecting.
 */
async function ensureLocalMongodRunning(): Promise<void> {
  if (process.platform === 'linux') {
    try {
      const { exec } = await import('child_process');
      const home = process.env.HOME || '/home/prvmcqeftpe4';
      const cmd = `pgrep -f "mongod.*27017" >/dev/null 2>&1 || (${home}/mongodb/bin/mongod --dbpath ${home}/mongodb/data --bind_ip 127.0.0.1 --port 27017 --fork --logpath ${home}/mongodb/mongod.log --wiredTigerCacheSizeGB 0.25 >/dev/null 2>&1)`;
      await new Promise<void>((resolve) => {
        exec(cmd, { timeout: 4000 }, () => {
          setTimeout(resolve, 600);
        });
      });
    } catch {
      // Best-effort execution
    }
  }
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
        await ensureLocalMongodRunning();
        const fallbackConn = await mongoose.connect(fallbackUri, opts);
        cached.conn = fallbackConn;
        return cached.conn;
      } catch (fallbackErr) {
        throw primaryErr;
      }
    } else {
      // Local daemon failed to respond directly, try auto-reviving once
      try {
        await ensureLocalMongodRunning();
        const retryConn = await mongoose.connect(primaryUri, opts);
        cached.conn = retryConn;
        return cached.conn;
      } catch {
        throw primaryErr;
      }
    }
  }
}
