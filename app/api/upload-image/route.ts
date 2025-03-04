import fs from "fs/promises";
import { Readable } from "stream";

import { NextResponse } from "next/server";
import { IncomingForm } from "formidable";
import AWS from "aws-sdk";

export const config = { api: { bodyParser: false } };

const rekognition = new AWS.Rekognition({
  region: "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

const r2 = new AWS.S3({
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY,
  secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY,
  signatureVersion: "v4",
});

const moderateImage = async (imageBuffer: Buffer) => {
  const { ModerationLabels } = await rekognition
    .detectModerationLabels({ Image: { Bytes: imageBuffer } })
    .promise();

  return ModerationLabels?.length === 0;
};

const uploadToR2 = async (fileBuffer: Buffer, filename: string) => {
  await r2
    .upload({
      Bucket: process.env.CLOUDFLARE_BUCKET_NAME!,
      Key: filename,
      Body: fileBuffer,
      ContentType: "image/png",
    })
    .promise();

  return `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.CLOUDFLARE_BUCKET_NAME}/${filename}`;
};

const parseForm = (req: Request) => {
    return new Promise<{ fields: any; files: any }>((resolve, reject) => {
      const form = new IncomingForm();
      const chunks: any[] = [];
  
      req.body
        ?.getReader()
        ?.read()
        .then(function processText({ done, value }) {
          if (done) {
            const reqStream = new Readable();
            reqStream.push(Buffer.concat(chunks));
            reqStream.push(null);
  
            form.parse(reqStream, (err, fields, files) => {
              if (err) reject(err);
              else resolve({ fields, files });
            });
            return;
          }
          chunks.push(value);
          req.body?.getReader()?.read().then(processText);
        });
    });
  };
  
  export async function POST(req: Request) {
    const { fields, files } = await parseForm(req);
    const file = files.file?.[0];
  
    if (!file)
      return NextResponse.json({ success: false, message: "No file uploaded" });
  
    const fileBuffer = await fs.readFile(file.filepath);
  
    if (!(await moderateImage(fileBuffer))) {
      return NextResponse.json({ success: false, message: "Image flagged" });
    }
  
    const imageUrl = await uploadToR2(fileBuffer, file.newFilename);
  
    return NextResponse.json({ success: true, url: imageUrl });
  }