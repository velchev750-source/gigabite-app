import { NextResponse } from "next/server";

import {
  ComboOfferError,
  updateManagerComboOffer,
} from "@/services/combo-offers";

type RouteContext = {
  params: Promise<{
    comboOfferId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { comboOfferId } = await context.params;

  try {
    const comboOffer = await updateManagerComboOffer(Number(comboOfferId), await request.json());

    return NextResponse.json(comboOffer);
  } catch (error) {
    if (error instanceof ComboOfferError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json({ message: "Hot deal could not be updated." }, { status: 500 });
  }
}
