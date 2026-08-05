export const getOptimizedImageUrl = (url, width = 1280) => {
    if (!url) return '';

    if (url.includes('supabase.co/storage/v1/object/public/')) {
        const renderUrl = url.replace('/object/public/', '/render/image/public/');
        return `${renderUrl}?width=${width}&quality=80&resize=contain`;
    }

    if (!url.includes('cloudinary.com')) return url;

    // Split the URL to insert transformations
    // Example: https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg
    // Becomes: https://res.cloudinary.com/demo/image/upload/c_limit,w_500/f_auto/q_auto/v1234567890/sample.jpg

    const parts = url.split('/upload/');
    if (parts.length !== 2) return url;

    const transformation = `c_limit,w_${width}/f_auto/q_auto`;
    return `${parts[0]}/upload/${transformation}/${parts[1]}`;
};

export const getOptimizedImageSrcSet = (url, widths = [320, 640, 960]) => {
    if (!url) return undefined;
    if (url.includes('supabase.co/storage/v1/object/public/')) {
        return widths.map((width) => `${getOptimizedImageUrl(url, width)} ${width}w`).join(', ');
    }
    if (!url.includes('cloudinary.com')) return undefined;
    return widths.map((width) => `${getOptimizedImageUrl(url, width)} ${width}w`).join(', ');
};
