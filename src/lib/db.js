import mongoose from "mongoose";

const globalCache = globalThis;

if (!globalCache.mongooseCache) {
  globalCache.mongooseCache = { conn: null, promise: null };
}

export async function connectDB() {
  const uri = process.env.MONGO_URL;
  if (!uri) {
    const error = new Error("إعدادات قاعدة البيانات غير مكتملة");
    error.status = 500;
    throw error;
  }

  if (globalCache.mongooseCache.conn) {
    return globalCache.mongooseCache.conn;
  }

  if (!globalCache.mongooseCache.promise) {
    globalCache.mongooseCache.promise = mongoose.connect(uri, {
      bufferCommands: false,
    });
  }

  globalCache.mongooseCache.conn = await globalCache.mongooseCache.promise;
  return globalCache.mongooseCache.conn;
}
