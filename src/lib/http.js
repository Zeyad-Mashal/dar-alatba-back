export class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function ok(data, message = "تم بنجاح", status = 200) {
  return Response.json({ success: true, message, data }, { status });
}

export function fail(error) {
  if (error?.name === "ApiError") {
    return Response.json(
      { success: false, message: error.message },
      { status: error.status || 400 },
    );
  }

  if (error?.code === 11000) {
    return Response.json(
      { success: false, message: "هذه البيانات موجودة مسبقاً" },
      { status: 409 },
    );
  }

  console.error(error);
  return Response.json(
    { success: false, message: "حدث خطأ في الخادم، حاول مرة أخرى" },
    { status: 500 },
  );
}
