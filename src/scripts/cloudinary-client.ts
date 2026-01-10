import { v2 as cloudinary } from 'cloudinary';

// Asegúrate de tener estas variables en tu .env
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function uploadToCloudinary(imageUrl: string, folder: string = 'noticias') {
    try {
        const result = await cloudinary.uploader.upload(imageUrl, {
            folder: folder,
        });
        return {
            url: result.secure_url,
            publicId: result.public_id
        };
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        return null;
    }
}
