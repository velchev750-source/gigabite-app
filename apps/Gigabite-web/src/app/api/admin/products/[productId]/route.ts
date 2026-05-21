import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { managerProductUpdateSchema } from "@/lib/validations/admin";
import { getValidationMessage } from "@/lib/validations/form";
import {
  ManagerProductError,
  updateManagerProduct,
} from "@/services/manager-products";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;

  try {
    const payload = managerProductUpdateSchema.parse(await request.json());
    await updateManagerProduct({
      productId: Number(productId),
      ...payload,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ message: getValidationMessage(error) }, { status: 400 });
    }

    if (error instanceof ManagerProductError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json({ message: "Unable to update product." }, { status: 500 });
  }
}
