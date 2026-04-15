/**
 * INTEGRATION — MinIO
 *
 * Gap G3. Upload → retrieve → delete contra MinIO real. Skippado
 * localmente; roda em CI via GitHub Actions service.
 *
 * ENV esperada em CI:
 *   MINIO_ENDPOINT=localhost
 *   MINIO_PORT=9000
 *   MINIO_ACCESS_KEY=testaccess
 *   MINIO_SECRET_KEY=testsecret123
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const isCI = process.env.CI === 'true';

describe.skipIf(!isCI)('Integration — MinIO', () => {
  let client: import('minio').Client | null = null;
  const bucket = 'portal-test';
  const objectKey = `test-${Date.now()}.txt`;
  const payload = 'conteúdo de teste integração';

  beforeAll(async () => {
    const { Client } = await import('minio');
    client = new Client({
      endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
      port: Number(process.env.MINIO_PORT ?? 9000),
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY ?? 'testaccess',
      secretKey: process.env.MINIO_SECRET_KEY ?? 'testsecret123',
    });
    const exists = await client.bucketExists(bucket).catch(() => false);
    if (!exists) await client.makeBucket(bucket);
  });

  afterAll(async () => {
    await client?.removeObject(bucket, objectKey).catch(() => undefined);
  });

  it('upload → retrieve produz bytes idênticos', async () => {
    expect(client).not.toBeNull();
    await client!.putObject(bucket, objectKey, Buffer.from(payload));

    const stream = await client!.getObject(bucket, objectKey);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    const retrieved = Buffer.concat(chunks).toString('utf8');

    expect(retrieved).toBe(payload);
  });

  it('delete remove o objeto', async () => {
    await client!.removeObject(bucket, objectKey);
    await expect(client!.statObject(bucket, objectKey)).rejects.toThrow();
  });
});
