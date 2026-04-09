import cloudinary from "#config/cloudinary.js";
import { Readable } from "stream";

const uploadBuffer = (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "chat-app/messages",
                resource_type: "auto",
                ...options,
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            },
        );

        Readable.from(buffer).pipe(stream);
    });
};

export default uploadBuffer;
