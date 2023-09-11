javascript:
var pointerDisabled = false;


function init() {
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
}


/**@param {MouseEvent} event */
function onMouseDown(event) {
    if (event.altKey && event.button < 2) {
        pointerDisabled = true;
        document.body.classList.add('pointer-disabled');
    }
}


/**@param {MouseEvent} event */
function onMouseUp(event) {
    if (!pointerDisabled || event.button > 1)
        return;

    event.preventDefault();
    document.body.classList.remove('pointer-disabled');
    pointerDisabled = false;

    const pic = findPicture(event);
    if (!pic) {
        console.log('No picture found');
        return;
    }

    let src = first(pic.src, pic.href?.baseVal, pic.currentSrc);    // pic.poster;  Video's thumbnail

    let link = findPicLink(pic, src);
    if (link)
        src = link;

    if (!src) {
        console.log('Source not found');
        return;
    }

    if (src.startsWith('data:')) {
        const id = randomId(6);
        const newTab = window.open();
        newTab?.document.write(`
            <html>
                <head><title>${id}</title></head>
                <body style="margin: 0;">
                    <a download="${id}.jpg" href="${src}">
                        <img src="${src}" style="display: block; background: #0e0e0e; width: 100%; height: 100%; object-fit: scale-down;">
                    </a>
                </body>
            </html>
        `);
        newTab?.document.close();
        return;
    }

    /* Open image / video, if it's not a blob */
    if (!src.startsWith('blob:')) {
        const largeSrc = getLargeUrl(src);
        if (event.button === 0) 
            location.href = largeSrc;
        else 
            window.open(largeSrc, '_blank');
        return;
    } 

    if (!location.host.includes("instagram.com"))
        alert("Video source is a blob");

    /* Open post in new tab, if it's Instagram */
    const downloaderUrl = 'https://savefrom.net/' + location.href;
    window.open(downloaderUrl, '_blank');
}


/**@param {MouseEvent} event */
function findPicture(event) {
    const picTags = ['img', 'image', 'video'];

    let elements = document.elementsFromPoint(event.clientX, event.clientY);
    let pics = elements.filter(el => { 
        const tag = el.tagName.toLowerCase();
        return picTags.includes(tag);
    });

    console.log('All the elements under the cursor:');
    console.log(elements);

    let pic = pics[0];
    if (pic) {
        console.log('All the pictures under the cursor (only the 1st was opend):');
        console.log(pics);
        return pic;
    }
    
    console.log('No pictures found under the cursor - searching in descendants');

    const selector = picTags.join(', ');
    elements.some(element => {
        const subPics = element.querySelectorAll(selector);
        if (!subPics.length) {
            return false;
        }

        if (subPics.length === 1) {
            pic = subPics[0];
            console.log('Single picture found:');
            console.log(pic);
            return true;
        }

        console.log('Multiple pictures found (picking the biggest one):');
        console.log(subPics);
        
        let maxArea = 0;
        subPics.forEach(subPic => {
            const rect = subPic.getBoundingClientRect();
            const area = rect.width * rect.height;
            if (area > maxArea) {
                pic = subPic;
                maxArea = area;
            }
        });
        return pic;
    });

    return pic;
}


/** @param {string} urlStr */
function getLargeUrl(urlStr) {
    let url = new URL(urlStr);
    let host = url.hostname;
    let path = url.pathname;

    // 123 RF
    if (host == "us.123rf.com") {
        const [match, crumbs, name, ext] = /((\/\w+){4})-[^/.?]+(\.\w{2,4})$/.exec(path);
        url.host = "previews.123rf.com";
        url.pathname = "/images" + crumbs + ext;
    }

    // Adobe Stock
    else if (host.endsWith("ftcdn.net")) {
        const size = path.endsWith('.mp4') ? 700 : 1000;
        url.pathname = path.replace(/\/\d{3}_F_/, '/' + size + '_F_');
    }

    // Alamy
    else if (host.endsWith(".alamy.com")) {
        const [match, id, extension] = /[/-](\w+)\.(\w+)$/.exec(path);
        url.pathname = "/compfr/a/" + id + "." + extension;
    }

    // Can Stock Photos
    else if (host.endsWith(".thumbs.canstockphoto.com")) {
        url.hostname = "cdn.w600.comps.canstockphoto.com";
    }

    // Deposit Photos
    else if (host.endsWith(".depositphotos.com")) {
        url.pathname = path.replace(/\/i\/\d{3}\//, "/i/950/");
    }

    // DreamsTime
    else if (host == "thumbs.dreamstime.com") {
        if (path.startsWith("/z/"))
            url.pathname = path.replace("/z/", "/b/");
        else
            url.pathname = path.replace("/b/", "/z/");
    }

    // Focused Collection
    else if (host == "st.focusedcollection.com") {
        url.pathname = path.replace(/\/i\/\d+\//, "/i/1800/");
    }

    // FreePik
    else if (host == "img.freepik.com") {
        url.search = "?w=2000";
    }

    // Getty Images
    else if (host == "media.gettyimages.com") {
        url.search = "?s=2048x2048";
    }

    // I Stock Photo
    else if (host == 'media.istockphoto.com') {
        const [match, prefix, id, postfix] = /(-id|\/id\/)(\d+)($|\/)/.exec(path);
        url.pathname = '/photos/p-id' + id;
        url.search = '?s=2048x2048';
    }

    // IMX.to
    else if (host == 'imx.to') {
        url.pathname = path.replace('/t/', '/i/');
    }

    // Shutter Stock
    else if (isShutterStockImg(host, path)) {
        const [match, id, ext] = /\-(\d+)(.\w{2,4})$/.exec(path);
        url.pathname = "/shutterstock/photos/" + id + "/display_1500/" + id + ext;
    }

    else {
        return urlStr;
    }

    return url.toString();
}


/**
 * @param {string} host 
 * @param {string} path 
 */
function isShutterStockImg(host, path) {
    if (host == "image.shutterstock.com")
        return true;
    return host == "www.shutterstock.com" && path.endsWith(".jpg");
}


function first(...strings) {
    return strings.filter(str => str)[0];
}



console.log("Initializing Opener");
init();
