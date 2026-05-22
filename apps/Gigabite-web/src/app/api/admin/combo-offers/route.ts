import { NextResponse } from "next/server";

import {
  ComboOfferError,
  createManagerComboOffer,
  getManagerComboOffers,
} from "@/services/combo-offers";

export async function GET() {
  const data = await getManagerComboOffers();

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const comboOffer = await createManagerComboOffer(await request.json());

    return NextResponse.json(comboOffer);
  } catch (error) {
    if (error instanceof ComboOfferError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json({ message: "Hot deal could not be created." }, { status: 500 });
  }
}
