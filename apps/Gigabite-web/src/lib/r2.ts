import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { z } from "zod";

const r2EnvSchema = z.object({
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_BUCKET_NAME: z.string().min(1, "R2_BUCKET_NAME is required."),
  R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID is required."),
  R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY is required."),
  R2_PUBLIC_URL: z.string().url("R2_PUBLIC_URL must be a valid URL."),
  R2_ENDPOINT: z.string().url().optional(),
});

const allowedImageTypes = ["image/webp", "image/png", "image/jpeg"] as const;
const maxUploadBytes = 5 * 1024 * 1024;

type AllowedImageType = (typeof allowedImageTypes)[number];

type UploadFileToR2Input = {
  fileBuffer: Buffer;
  fileName: string;
  contentType: string;
  folder?: string;
};

export class R2UploadError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = "R2UploadError";
  }
}

export function validateR2ImageUpload({
  fileBuffer,
  contentType,
}: {
  fileBuffer: Buffer;
  contentType: string;
}) {
  if (!allowedImageTypes.includes(contentType as AllowedImageType)) {
    throw new R2UploadError("Only WEBP, PNG, and JPEG images can be uploaded.");
  }

  if (!fileBuffer.length) {
    throw new R2UploadError("Uploaded file is empty.");
  }

  if (fileBuffer.length > maxUploadBytes) {
    throw new R2UploadError("Image upload must be 5MB or smaller.");
  }
}

export async function uploadFileToR2({
  fileBuffer,
  fileName,
  contentType,
  folder = "uploads",
}: UploadFileToR2Input) {
  validateR2ImageUpload({ fileBuffer, contentType });

  const env = getR2Env();
  const key = buildR2Key(folder, fileName);
  const client = createR2Client(env);

  await client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    }),
  );

  return {
    key,
    publicUrl: `${env.R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`,
  };
}

function createR2Client(env: ReturnType<typeof getR2Env>) {
  return new S3Client({
    region: "auto",
    endpoint: getR2Endpoint(env),
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
}

function getR2Env() {
  return r2EnvSchema.parse(process.env);
}

function getR2Endpoint(env: ReturnType<typeof getR2Env>) {
  if (env.R2_ENDPOINT) {
    return env.R2_ENDPOINT;
  }

  if (!env.R2_ACCOUNT_ID) {
    throw new R2UploadError("R2_ACCOUNT_ID or R2_ENDPOINT is required.", 500);
  }

  return `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
}

function buildR2Key(folder: string, fileName: string) {
  const safeFolder = folder
    .split("/")
    .map((part) => sanitizePathPart(part))
    .filter(Boolean)
    .join("/");
  const safeFileName = sanitizePathPart(fileName) || "upload";
  const extension = getFileExtension(safeFileName);
  const baseName = extension ? safeFileName.slice(0, -extension.length - 1) : safeFileName;
  const uniqueName = `${baseName}-${randomUUID()}${extension ? `.${extension}` : ""}`;

  return safeFolder ? `${safeFolder}/${uniqueName}` : uniqueName;
}

function sanitizePathPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getFileExtension(fileName: string) {
  const extension = fileName.split(".").pop();

  return extension && extension !== fileName ? extension : "";
}
