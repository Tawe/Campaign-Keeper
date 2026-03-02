import { randomUUID } from "crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3ServiceException,
  S3Client,
} from "@aws-sdk/client-s3";

const ALLOWED_MIME_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const MAX_PORTRAIT_BYTES = 2 * 1024 * 1024;

let s3Client: S3Client | null = null;

function getEnv(name: string, fallback?: string) {
  const value = process.env[name] || (fallback ? process.env[fallback] : undefined);
  return value?.trim() || undefined;
}

function formatS3Error(error: unknown, action: string) {
  if (error instanceof S3ServiceException) {
    const suffix = error.message ? ` ${error.message}` : "";
    return new Error(`S3 ${action} failed (${error.name}).${suffix}`.trim());
  }

  if (error instanceof Error) {
    return new Error(`S3 ${action} failed. ${error.message}`);
  }

  return new Error(`S3 ${action} failed.`);
}

function getBucketName() {
  const bucket = getEnv("CAMPAIGN_KEEPER_S3_BUCKET", "S3_BUCKET");
  if (!bucket) {
    throw new Error("CAMPAIGN_KEEPER_S3_BUCKET is not configured.");
  }
  return bucket;
}

function getS3Client() {
  if (s3Client) return s3Client;

  const region = getEnv("CAMPAIGN_KEEPER_AWS_REGION", "AWS_REGION");
  if (!region) {
    throw new Error("CAMPAIGN_KEEPER_AWS_REGION is not configured.");
  }

  const accessKeyId = getEnv("CAMPAIGN_KEEPER_AWS_ACCESS_KEY_ID", "AWS_ACCESS_KEY_ID");
  const secretAccessKey = getEnv(
    "CAMPAIGN_KEEPER_AWS_SECRET_ACCESS_KEY",
    "AWS_SECRET_ACCESS_KEY"
  );
  const sessionToken = getEnv("CAMPAIGN_KEEPER_AWS_SESSION_TOKEN", "AWS_SESSION_TOKEN");
  const endpoint = getEnv("CAMPAIGN_KEEPER_S3_ENDPOINT", "S3_ENDPOINT");
  const forcePathStyle =
    getEnv("CAMPAIGN_KEEPER_S3_FORCE_PATH_STYLE", "S3_FORCE_PATH_STYLE") === "true";

  s3Client = new S3Client({
    region,
    endpoint,
    forcePathStyle,
    credentials:
      accessKeyId && secretAccessKey
        ? {
            accessKeyId,
            secretAccessKey,
            sessionToken,
          }
        : undefined,
  });

  return s3Client;
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=]+)$/i);
  if (!match) {
    throw new Error("Invalid image format.");
  }

  const mimeType = match[1].toLowerCase();
  const extension = ALLOWED_MIME_TYPES.get(mimeType);
  if (!extension) {
    throw new Error("Unsupported image type.");
  }

  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length === 0 || buffer.length > MAX_PORTRAIT_BYTES) {
    throw new Error("Image is too large.");
  }

  return { mimeType, extension, buffer };
}

async function bodyToUint8Array(body: unknown): Promise<Uint8Array> {
  if (!body) {
    throw new Error("Image body is empty.");
  }

  if (typeof (body as { transformToByteArray?: () => Promise<Uint8Array> }).transformToByteArray === "function") {
    return (body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
  }

  if (typeof (body as { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer === "function") {
    return new Uint8Array(await (body as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer());
  }

  if (Symbol.asyncIterator in Object(body)) {
    const chunks: Buffer[] = [];
    for await (const chunk of body as AsyncIterable<Buffer | Uint8Array | string>) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  throw new Error("Unsupported S3 response body.");
}

export async function savePortraitDataUrl(
  kind: "player" | "npc",
  id: string,
  dataUrl: string
) {
  const { mimeType, extension, buffer } = parseDataUrl(dataUrl);
  const path = `portraits/${kind}/${id}/${randomUUID()}.${extension}`;

  try {
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: getBucketName(),
        Key: path,
        Body: buffer,
        ContentType: mimeType,
        CacheControl: "private, max-age=3600",
      })
    );
  } catch (error) {
    throw formatS3Error(error, "upload");
  }

  return path;
}

export async function getPortraitObject(path: string) {
  let response;

  try {
    response = await getS3Client().send(
      new GetObjectCommand({
        Bucket: getBucketName(),
        Key: path,
      })
    );
  } catch (error) {
    throw formatS3Error(error, "read");
  }

  return {
    body: await bodyToUint8Array(response.Body),
    contentType: response.ContentType || "application/octet-stream",
    cacheControl: response.CacheControl || "private, max-age=3600",
  };
}

export async function deletePortrait(path: string | null | undefined) {
  if (!path) return;

  try {
    await getS3Client().send(
      new DeleteObjectCommand({
        Bucket: getBucketName(),
        Key: path,
      })
    );
  } catch {
    // Best-effort cleanup only.
  }
}
