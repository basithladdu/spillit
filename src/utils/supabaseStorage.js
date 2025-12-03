import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// S3 Client Configuration for Supabase Storage
const s3Client = new S3Client({
    forcePathStyle: true,
    region: "us-east-1", // Supabase S3 wrapper uses this region
    endpoint: "https://upxvlqarmvakbdxgvtbc.storage.supabase.co/storage/v1/s3",
    credentials: {
        accessKeyId: "2c9410824d859e6c2242ba25403fada8",
        secretAccessKey: "85e384c10974e7533ebeac712de8b8c1a362dddd9eb995b65837301c1283d2bc"
    }
});

export const uploadToSupabase = async (file, path) => {
    try {
        // Convert File/Blob to ArrayBuffer to avoid stream issues in some browsers/SDK versions
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const command = new PutObjectCommand({
            Bucket: "municipal-uploads",
            Key: path,
            Body: buffer,
            ContentType: file.type
        });

        await s3Client.send(command);
        return path;
    } catch (err) {
        console.error("S3 Upload Error:", err);
        throw err;
    }
};
