import {mkdir, writeFile} from "node:fs/promises";
import path from "node:path";
import {randomUUID} from "node:crypto";
import {NextResponse} from "next/server";
import {requirePermission} from "@/lib/guards";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const session = await requirePermission("products.write");
    if (!session) {
      return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({error: "Image file is required"}, {status: 400});
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({error: "Only image files are allowed"}, {status: 400});
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({error: "Image exceeds 5MB limit"}, {status: 400});
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
    await mkdir(uploadDir, {recursive: true});

    const extension = path.extname(file.name) || ".jpg";
    const fileName = `${Date.now()}-${randomUUID()}${extension}`;
    const absolutePath = path.join(uploadDir, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absolutePath, buffer);

    const url = `/uploads/products/${fileName}`;
    return NextResponse.json({url}, {status: 201});
  } catch (error) {
    console.error("Failed to upload product image:", error);
    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}