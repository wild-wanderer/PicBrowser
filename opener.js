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
    
    let elements = document.elementsFromPoint(event.clientX, event.clientY);
    let pics = elements.filter(el => { 
        const tag = el.tagName.toLowerCase();
        return ['img', 'image', 'video'].includes(tag);
    });

    console.log('All the elements under the cursor:');
    console.log(elements);
    console.log('All the pictures under the cursor (only the 1st was opend):');
    console.log(pics);

    const pic = pics[0];
    if (!pic) {
        console.log('No picture found');
        return;
    }

    let link = pic.closest('a')?.href;
    const isPicLink = link && new URL(link).pathname.match(/\w\.\w{2,4}$/);
    let src = isPicLink ? link : null;
    if (isPicLink)
        console.log("Found link to the picture: " + link);

    src ??= first(pic.src, pic.href?.baseVal, pic.currentSrc);    // pic.poster;  Video's thumbnail
    if (!src) {
        console.log('Source not found');
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
    else if (host == "c8.alamy.com") {
        const [match, id, extension] = /\/(\w+)\.(\w+)$/.exec(path);
        url.pathname = "/compfr/a/" + id + "." + extension;
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
