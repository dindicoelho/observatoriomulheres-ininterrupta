import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { nome, email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("leads")
      .insert({ nome: nome || null, email: email.toLowerCase().trim() });

    if (error) {
      // Duplicate email — silently succeed
      if (error.code === "23505") {
        return NextResponse.json({ ok: true, message: "Já inscrito" });
      }
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Erro ao salvar" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}
