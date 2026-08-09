import cloudinary from "cloudinary";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "User not authorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    if (!file || !["image/png", "image/jpeg"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ message: "Invalid image" }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = `data:${file.type};base64,${buffer.toString("base64")}`;

    const publicId = `lumaClone_event_${user.id}_${Date.now()}`;

    const { secure_url } = await cloudinary.v2.uploader.upload(base64Image, {
      public_id: publicId,
    });

    return NextResponse.json({ url: secure_url }, { status: 200 });
  } catch (err: unknown) {
    console.log(err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
