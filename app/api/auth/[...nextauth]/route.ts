import { handlers } from "@/auth";

// Force Node.js runtime for bcrypt compatibility
export const runtime = "nodejs";

export const { GET, POST } = handlers;
