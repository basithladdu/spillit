export const getOptimizedImageUrl = (url, width = 'auto') => {
    if (!url) return '';
    if (!url.includes('cloudinary.com')) return url;

    // Split the URL to insert transformations
    // Example: https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg
    // Becomes: https://res.cloudinary.com/demo/image/upload/w_500,q_auto,f_auto/v1234567890/sample.jpg

    const parts = url.split('/upload/');
    if (parts.length !== 2) return url;

    const transformation = `w_${width},q_auto,f_auto`;
    return `${parts[0]}/upload/${transformation}/${parts[1]}`;
};
