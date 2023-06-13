javascript:
var cursorPos;

const BACKGROUND_TAB = 'background_tab';

function init() {
    document.addEventListener('keyup', onKeyUp, {capture: true});
    document.addEventListener('mousemove', e => {
        cursorPos = { 
            x: e.clientX, 
            y: e.clientY 
        };
    });
}


function onKeyUp(event) {
    if (event.key !== 'F2')
        return;

    event.preventDefault();
    event.stopPropagation();

    if (!cursorPos.x)
        return;

    let elements = document.elementsFromPoint(cursorPos.x, cursorPos.y);
    let imgs = elements.filter(el => { 
        const tag = el.tagName.toLowerCase();
        return ['img', 'image', 'video'].includes(tag);
    });

    console.log('All the elements under the cursor:');
    console.log(elements);
    console.log('All the images under the cursor (only the 1st was opend):');
    console.log(imgs);

    const img = imgs[0];
    let src = first(img?.src, img?.href?.baseVal, img?.currentSrc);    // img.poster;  Video's thumbnail

    if (!src) {
        console.log('Source not found');
        return;
    }

    /* Open image / video, if it's not a blob */
    if (!src.startsWith('blob:')) {
        window.open(getLargeUrl(src), '_blank');
        focus();
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

    url.hash = BACKGROUND_TAB;
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
