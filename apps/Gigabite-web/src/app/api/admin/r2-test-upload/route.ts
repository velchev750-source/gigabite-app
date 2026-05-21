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
      return NextResponse.json({ message: "Upload a file using the file field." }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const upload = await uploadFileToR2({
      fileBuffer,
      fileName: file.name,
      contentType: file.type,
      folder: "r2-test",
    });

    return NextResponse.json({
      key: upload.key,
      publicUrl: upload.publicUrl,
    });
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

    return NextResponse.json({ message: "R2 upload failed." }, { status: 500 });
  }
}
