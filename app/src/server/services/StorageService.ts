import 'server-only'
import { randomUUID } from 'node:crypto'
import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '~/env'

export type UploadKind = 'AVATAR' | 'COURSE_COVER' | 'ACHIEVEMENT_COVER' | 'CONTENT_PAGE_INLINE'

const KIND_PREFIX: Record<UploadKind, string> = {
  AVATAR: 'avatars',
  COURSE_COVER: 'courses',
  ACHIEVEMENT_COVER: 'achievements',
  CONTENT_PAGE_INLINE: 'content-pages'
}

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif'
}

export interface PresignInput {
  kind: UploadKind
  ownerId: string
  contentType: string
}

export interface PresignedUpload {
  key: string
  putUrl: string
  publicUrl: string
  headers: Record<string, string>
  expiresInSeconds: number
}

const PRESIGN_TTL_SECONDS = 5 * 60

/**
 * Single source of truth for uploading user-supplied images to S3-compatible
 * storage (MinIO in dev, S3/R2/Spaces in prod). Browser code never sees
 * credentials — the server signs short-lived PUT URLs and the client uploads
 * directly.
 *
 * Two clients in play because the in-cluster hostname (`http://minio:9000`)
 * isn't reachable from the browser:
 *   - `internalClient` does bucket bootstrap and any server-side reads/deletes.
 *   - `presignClient` is configured with the *browser-facing* origin so the
 *     PUT URL it signs is reachable from the user's machine. The signature
 *     is host-aware so the two clients can't share endpoints.
 */
export class StorageService {
  private readonly internalClient: S3Client
  private readonly presignClient: S3Client
  private readonly bucket: string
  private readonly publicBase: string
  private bucketReady: Promise<void> | null = null

  constructor() {
    const credentials = {
      accessKeyId: env.S3_ACCESS_KEY,
      secretAccessKey: env.S3_SECRET_KEY
    }
    this.internalClient = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      credentials
    })
    this.presignClient = new S3Client({
      region: env.S3_REGION,
      endpoint: extractOrigin(env.S3_PUBLIC_URL),
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      credentials
    })
    this.bucket = env.S3_BUCKET
    this.publicBase = env.S3_PUBLIC_URL.replace(/\/+$/, '')
  }

  /**
   * Idempotent: creates the bucket and applies a public-read policy on first
   * call, then memoises the result so subsequent uploads pay no overhead.
   */
  ensureBucket(): Promise<void> {
    this.bucketReady ??= this.bootstrapBucket().catch(error => {
      this.bucketReady = null
      throw error
    })
    return this.bucketReady
  }

  async presignPut({ kind, ownerId, contentType }: PresignInput): Promise<PresignedUpload> {
    await this.ensureBucket()
    const extension = EXTENSION_BY_CONTENT_TYPE[contentType]
    if (!extension) {
      throw new Error(`Unsupported image content type: ${contentType}`)
    }
    const key = `${KIND_PREFIX[kind]}/${ownerId}/${randomUUID()}.${extension}`
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType
    })
    const putUrl = await getSignedUrl(this.presignClient, command, {
      expiresIn: PRESIGN_TTL_SECONDS
    })
    return {
      key,
      putUrl,
      publicUrl: this.publicUrlFor(key),
      headers: { 'Content-Type': contentType },
      expiresInSeconds: PRESIGN_TTL_SECONDS
    }
  }

  publicUrlFor(key: string): string {
    return `${this.publicBase}/${key}`
  }

  async deleteObject(key: string): Promise<void> {
    await this.internalClient.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
  }

  private async bootstrapBucket(): Promise<void> {
    try {
      await this.internalClient.send(new HeadBucketCommand({ Bucket: this.bucket }))
    } catch {
      await this.internalClient.send(new CreateBucketCommand({ Bucket: this.bucket }))
    }
    await this.internalClient.send(
      new PutBucketPolicyCommand({
        Bucket: this.bucket,
        Policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'PublicReadGetObject',
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucket}/*`]
            }
          ]
        })
      })
    )
  }
}

export const storageService = new StorageService()

/**
 * Returns the scheme + host (+ optional port) of a URL — the form an S3
 * client expects in its `endpoint` setting. We can't pass a URL that
 * already includes the bucket path because path-style requests append the
 * bucket themselves, which would double up as `/<bucket>/<bucket>/<key>`.
 */
function extractOrigin(url: string): string {
  return new URL(url).origin
}
