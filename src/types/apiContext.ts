import { User } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

export interface ApiHandlerContext {
  user: User;
  req: NextRequest;
  context: NextApiContext
}

export interface NextApiContext {
  params: Promise<Record<string, string>>;
  [key: string]: unknown;
}