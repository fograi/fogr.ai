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
    if (!req.headers.get("content-type")?.includes("multipart/form-data")) {
      return errorResponse(
        "Invalid content type. Expected multipart/form-data.",
      );
    }

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
    }

    // 🚀 Simulate random success or failure
    const isSuccess = Math.random() > 0.5;

    if (!isSuccess) {
      return errorResponse("Submission failed. Try again.");
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
