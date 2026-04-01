import {mkdir, writeFile} from "node:fs/promises";
import path from "node:path";
import {randomUUID} from "node:crypto";
import {v2 as cloudinary} from "cloudinary";
import {NextResponse} from "next/server";
import {requirePermission} from "@/lib/guards";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function hasCloudinaryConfig() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

async function uploadToCloudinary(file: File) {
  configureCloudinary();
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  return new Promise<{url: string; publicId: string}>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "dams-belleza/products",
        resource_type: "image",
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result?.secure_url || !result.public_id) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    stream.end(fileBuffer);
  });
}

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

    if (hasCloudinaryConfig()) {
      const uploaded = await uploadToCloudinary(file);
      return NextResponse.json(
        {
          url: uploaded.url,
          publicId: uploaded.publicId,
          provider: "cloudinary",
        },
        {status: 201}
      );
    }

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {error: "Cloudinary is not configured for production image uploads"},
        {status: 500}
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
    await mkdir(uploadDir, {recursive: true});

    const extension = path.extname(file.name) || ".jpg";
    const fileName = `${Date.now()}-${randomUUID()}${extension}`;
    const absolutePath = path.join(uploadDir, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absolutePath, buffer);

    const url = `/uploads/products/${fileName}`;
    return NextResponse.json({url, provider: "local"}, {status: 201});
  } catch (error) {
    console.error("Failed to upload product image:", error);
    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}