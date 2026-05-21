import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { R2UploadError, uploadFileToR2 } from "@/lib/r2";
import { requireRole } from "@/services/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireRole("manager");

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Upload a product image." }, { status: 400 });
    }

    const upload = await uploadFileToR2({
      fileBuffer: Buffer.from(await file.arrayBuffer()),
      fileName: file.name,
      contentType: file.type,
      folder: "products",
    });

    return NextResponse.json(upload);
  } catch (error) {
    if (error instanceof R2UploadError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: "R2 environment configuration is incomplete." },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "Product image upload failed." }, { status: 500 });
  }
}
