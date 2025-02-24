import { NextResponse } from "next/server";
import { getWallets } from "@/lib/wallets";

export async function GET() {
    try {
        const wallets = await getWallets();
        return NextResponse.json(wallets);
    } catch (error) {
        return NextResponse.json({ error: "Failed to load wallets" }, { status: 500 });
    }
}
