import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export async function POST(request: Request) {
  const s3 = new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  });

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file)
    return new Response(JSON.stringify({ error: "No file uploaded" }), {
      status: 400,
    });

  const fileKey = `uploads/${Date.now()}-${file.name}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
      Body: buffer,
      ContentType: file.type,
    }),
  );

  return new Response(
    JSON.stringify({
      imageKey: fileKey,
      url: `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${fileKey}`,
    }),
    { status: 200 },
  );
}
