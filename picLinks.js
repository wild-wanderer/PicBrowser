
var picExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp",
    ".webp",
    ".webm"
];


function findPicLink(pic, picSrc) {
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
}