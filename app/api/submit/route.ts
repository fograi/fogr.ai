import { OpenAI } from "openai";
import filter from "leo-profanity";
import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";

import {
  MIN_TITLE_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_DESC_LENGTH,
  MAX_DESC_LENGTH,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
} from "@/constants/validations";
import { bannedWords } from "@/constants/banned-words";

export const runtime = "edge"; // Required for Cloudflare Pages

filter.add(bannedWords);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const category = formData.get("category");
    const title = formData.get("title")?.toString() || "";
    const description = formData.get("description")?.toString() || "";
    const price = formData.get("price") as string | null;
    const image = formData.get("image") as File | null;

    if (!category) {
      return errorResponse("Category is required.");
    }

    if (title.length < MIN_TITLE_LENGTH) {
      return errorResponse(`Title too short`);
    } else if (title.length > MAX_TITLE_LENGTH) {
      return errorResponse(`Title too long.`, 413);
    }

    if (description.length < MIN_DESC_LENGTH) {
      return errorResponse(`Description too short.`);
    } else if (description.length > MAX_DESC_LENGTH) {
      return errorResponse(`Description too long.`, 413);
    }

    if (price && (isNaN(parseFloat(price)) || Number(price) < 0)) {
      return errorResponse("Invalid price.");
    }

    // 🚩 Local Moderation (Fastest to Slowest)
    const combinedText = `${title} ${description}`;

    if (filter.check(combinedText)) {
      return errorResponse("Failed profanity filter.");
    }

    const obscenity = new RegExpMatcher({
      ...englishDataset.build(),
      ...englishRecommendedTransformers,
    });

    if (obscenity.hasMatch(combinedText)) {
      return errorResponse("Failed obscenity filter.");
    }

    // 🔍 OpenAI Moderation (Last Check)
    if (image) {
      if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
        return errorResponse(`Invalid image type.`, 415);
      }
      if (image.size > MAX_IMAGE_SIZE) {
        return errorResponse("Image is too large.", 413);
      }

      const failed = await moderateTextAndImage(combinedText, image);

      if (failed) {
        return errorResponse("Failed AI moderation.");
      }
    } else {
      const failed = await moderateText(combinedText);

      if (failed) {
        return errorResponse("Failed AI moderation.");
      }
    }

    // 🚀 Success
    return new Response(
      JSON.stringify({ success: true, message: "Ad submitted successfully!" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return errorResponse(JSON.stringify(error), 500);
  }
}

// 🔍 OpenAI Text Moderation
async function moderateText(text: string): Promise<boolean> {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const moderation = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: text,
    });

    return moderation.results.some((r) => r.flagged);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    return true;
  }
}

// 🖼️ OpenAI Image + Text Moderation
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

    return moderation.results.some((r) => r.flagged);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    return true;
  }
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  return `data:${file.type};base64,${buffer.toString("base64")}`;
}

function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ success: false, message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
