import uploadBuffer from "./uploadCoud.js";

async function uploadFile(file, options = {}) {
    const result = await uploadBuffer(file.buffer, {
        public_id: `${Date.now()}-${file.originalname}`,
        ...options,
    });

    return {
        fileName: file.originalname,
        fileUrl: result.secure_url,
        fileType: file.mimetype,
        fileSize: file.size,
    };
}

export default uploadFile;
