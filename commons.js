
function findPicLink(pic, picSrc) {
    let picExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".bmp",
        ".webp",
        ".webm"
    ];

    let link = pic.closest('a')?.href;
    if (link) {
        const linkExt = new URL(link).pathname.match(/\.\w{2,4}$/)?.[1];
        const picExt = picSrc.match(/\.\w{2,4}$/)?.[1];
        const isPicLink = linkExt && (linkExt === picExt || picExtensions.includes(linkExt))
        if (isPicLink) {
            console.log("Found link to the picture: " + link);
            return link;
        }
    }
    return picSrc;
}


function randomId(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

if (typeof module != 'undefined')
    module.exports = { randomId };