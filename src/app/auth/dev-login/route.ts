// Connexion du compte de test utilisé par scripts/e2e-admin.mjs.
// Inactive en production (404) et sans les variables TEST_EDITOR_* ; le compte lui-même
// n'existe que pendant l'exécution des tests.
import { NextResponse } from "next/server";
import { createSessionClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development" || !process.env.TEST_EDITOR_EMAIL || !process.env.TEST_EDITOR_PASSWORD) {
    return new NextResponse("Introuvable", { status: 404 });
  }
  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: process.env.TEST_EDITOR_EMAIL,
    password: process.env.TEST_EDITOR_PASSWORD,
  });
  if (error) return new NextResponse(`Échec : ${error.message}`, { status: 401 });
  return NextResponse.redirect(new URL("/admin", request.url));
}
