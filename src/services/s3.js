import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: process.env.AWS_REGION });
const Bucket = () => process.env.S3_BUCKET;

export async function presignPut(key, contentType, expiresIn = 300) {
  const cmd = new PutObjectCommand({ Bucket: Bucket(), Key: key, ContentType: contentType });
  return getSignedUrl(s3, cmd, { expiresIn });
}

export async function getObject(key) {
  const cmd = new GetObjectCommand({ Bucket: Bucket(), Key: key });
  const res = await s3.send(cmd);
  const chunks = [];
  for await (const chunk of res.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export async function uploadBuffer(key, buffer, contentType) {
  const cmd = new PutObjectCommand({ Bucket: Bucket(), Key: key, Body: buffer, ContentType: contentType });
  await s3.send(cmd);
}

export async function deleteObjects(keys) {
  await Promise.all(
    keys.filter(Boolean).map((Key) => s3.send(new DeleteObjectCommand({ Bucket: Bucket(), Key })))
  );
}

export function getPublicUrl(key) {
  return `https://${Bucket()}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

export async function presignGet(key, expiresIn = 3600) {
  const cmd = new GetObjectCommand({ Bucket: Bucket(), Key: key });
  return getSignedUrl(s3, cmd, { expiresIn });
}
