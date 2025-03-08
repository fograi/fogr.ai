import {
  RekognitionClient,
  DetectModerationLabelsCommand,
} from "@aws-sdk/client-rekognition";

export async function POST(request: Request) {
  const rekognition = new RekognitionClient({
    region: process.env.AWS_REGION as string,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  });

  const { imageKey } = await request.json();

  if (!imageKey)
    return new Response(JSON.stringify({ error: "Missing image key" }), {
      status: 400,
    });

  const command = new DetectModerationLabelsCommand({
    Image: { S3Object: { Bucket: process.env.S3_BUCKET_NAME, Name: imageKey } },
    MinConfidence: 75,
  });

  const { ModerationLabels } = await rekognition.send(command);

  return new Response(JSON.stringify({ labels: ModerationLabels }), {
    status: 200,
  });
}
