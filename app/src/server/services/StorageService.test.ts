import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendMock = vi.fn()
const getSignedUrlMock = vi.fn()

vi.mock('@aws-sdk/client-s3', () => {
  class S3Client {
    middlewareStack = { remove: vi.fn() }
    send = sendMock
  }
  class Command {}
  return {
    S3Client,
    HeadBucketCommand: Command,
    CreateBucketCommand: Command,
    PutBucketPolicyCommand: Command,
    PutBucketCorsCommand: Command,
    PutObjectCommand: class {
      constructor(public input: unknown) {}
    },
    DeleteObjectCommand: Command
  }
})

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: (_client: unknown, _command: unknown, opts: { expiresIn: number }) =>
    getSignedUrlMock(opts)
}))

import { StorageService } from './StorageService'

describe('StorageService', () => {
  let service: StorageService

  beforeEach(() => {
    sendMock.mockReset()
    sendMock.mockResolvedValue(undefined)
    getSignedUrlMock.mockReset()
    service = new StorageService()
  })

  it('presignedUploadUrl_returns_url_with_5_minute_expiry', async () => {
    getSignedUrlMock.mockResolvedValueOnce('http://example.com/signed')
    const presigned = await service.presignPut({
      kind: 'AVATAR',
      ownerId: 'u1',
      contentType: 'image/png'
    })
    expect(presigned.expiresInSeconds).toBe(300)
    expect(presigned.putUrl).toBe('http://example.com/signed')
    expect(presigned.headers).toEqual({ 'Content-Type': 'image/png' })
  })

  it('presignedUploadUrl_throws_when_mimeType_not_image', async () => {
    await expect(
      service.presignPut({ kind: 'AVATAR', ownerId: 'u1', contentType: 'application/pdf' })
    ).rejects.toThrow(/Unsupported image content type/)
  })

  it('publicUrlFor_joins_base_and_key_without_double_slash', () => {
    expect(service.publicUrlFor('a/b.png')).toMatch(/\/a\/b\.png$/)
  })

  it('putImageBody_uses_internalClient_PutObject', async () => {
    const result = await service.putImageBody({
      kind: 'COURSE_COVER',
      ownerId: 'u1',
      contentType: 'image/webp',
      body: new Uint8Array([1, 2, 3])
    })
    expect(result.key).toMatch(/^courses\/u1\/.+\.webp$/)
    expect(sendMock).toHaveBeenCalled()
  })
})
