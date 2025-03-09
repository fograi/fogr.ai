import { OpenAI } from "openai";

import {
  MIN_TITLE_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_DESC_LENGTH,
  MAX_DESC_LENGTH,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
} from "@/constants/validations";

export const runtime = "edge"; // Required for Cloudflare Pages

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const category = formData.get("category");
    const title = formData.get("title");
    const description = formData.get("description");
    const price = formData.get("price") as string | null;
    const image = formData.get("image") as File | null;

    if (!category) {
      return errorResponse("Category is required.");
    }
    if (
      !title ||
      title.length < MIN_TITLE_LENGTH ||
      title.length > MAX_TITLE_LENGTH
    ) {
      return errorResponse(
        `Title must be between ${MIN_TITLE_LENGTH}-${MAX_TITLE_LENGTH} characters.`,
      );
    }
    if (
      !description ||
      description.length < MIN_DESC_LENGTH ||
      description.length > MAX_DESC_LENGTH
    ) {
      return errorResponse(
        `Description must be between ${MIN_DESC_LENGTH}-${MAX_DESC_LENGTH} characters.`,
      );
    }
    if (price && (isNaN(parseFloat(price)) || Number(price) < 0)) {
      return errorResponse("Invalid price.");
    }

    if (image) {
      if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
        return errorResponse(
          `Invalid image type. Only ${ALLOWED_IMAGE_TYPES.join(", ")} are allowed.`,
        );
      }
      if (image.size > MAX_IMAGE_SIZE) {
        return errorResponse("Image is too large. Maximum size is 5MB.");
      }

      const moderationFailed = await moderateTextAndImage(
        title + " - " + description,
        image,
      );

      if (moderationFailed) {
        return errorResponse(
          "Image failed moderation and may contain inappropriate content.",
        );
      }
    } else {
      const moderationFailed = await moderateText(title + " - " + description);

      if (moderationFailed) {
        return errorResponse(
          "Ad failed moderation and may contain inappropriate content.",
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Ad submitted successfully!" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return errorResponse(JSON.stringify(error));
  }
}

function errorResponse(message: string) {
  return new Response(JSON.stringify({ success: false, message }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}

// 🔍 OpenAI Moderation (Text)
async function moderateText(text: string): Promise<boolean> {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const moderation = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: text,
    });

    console.log(moderation);

    return moderation.results.some((r) => r.flagged);
  } catch (error) {
    console.error(error);

    return true;
  }
}

// 🖼️ OpenAI Image Moderation (Direct File)
async function moderateTextAndImage(
  text: string,
  image: File,
): Promise<boolean> {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const base64Image = await fileToBase64(image);
    const moderation = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: [
        { type: "text", text: text },
        { type: "image_url", image_url: { url: base64Image } },
      ],
    });

    console.log(moderation);

    return moderation.results.some((r) => r.flagged);
  } catch (error) {
    console.error(error);

    return true;
  }
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  return `data:${file.type};base64,${buffer.toString("base64")}`;
}
