import { connectDB } from "./db";
import { fail } from "./http";

export function handle(handler) {
  return async (request, context) => {
    try {
      await connectDB();
      return await handler(request, context);
    } catch (error) {
      return fail(error);
    }
  };
}
