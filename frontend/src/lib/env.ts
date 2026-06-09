export const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.NEXT_PUBLIC_SOCKET_URL ??
  "http://localhost:4000";

if (
  process.env.NODE_ENV === "production" &&
  !process.env.NEXT_PUBLIC_BACKEND_URL
) {
  console.warn(
    "[QuizBlast] NEXT_PUBLIC_BACKEND_URL is not set — falling back to localhost. Set it in Vercel dashboard."
  );
}
