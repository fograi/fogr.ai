import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  RekognitionClient,
  DetectModerationLabelsCommand,
  ModerationLabel,
} from "@aws-sdk/client-rekognition";

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

      const imageUrl = await uploadToS3(image);
      const moderationLabels = await moderateImage(imageUrl);

      if (moderationLabels && moderationLabels.length > 0) {
        console.log("Moderation Labels:", moderationLabels);

        return errorResponse(
          "Image failed moderation and may contain inappropriate content.",
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

async function uploadToS3(image: File): Promise<string> {
  const s3 = new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  });

  const fileKey = `uploads/${Date.now()}-${image.name}`;
  const buffer = Buffer.from(await image.arrayBuffer());

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
      Body: buffer,
      ContentType: image.type,
    }),
  );

  return `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;
}

// Function to Run AWS Rekognition Moderation
async function moderateImage(
  imageUrl: string,
): Promise<ModerationLabel[] | undefined> {
  const rekognition = new RekognitionClient({
    region: process.env.AWS_REGION as string,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  });

  const imageKey = imageUrl.split(".com/")[1]; // Extract image key from URL

  const command = new DetectModerationLabelsCommand({
    Image: { S3Object: { Bucket: process.env.S3_BUCKET_NAME, Name: imageKey } },
    MinConfidence: 75,
  });

  const { ModerationLabels } = await rekognition.send(command);

  return ModerationLabels;
}
