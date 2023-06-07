
picBrowserBaseInitialized = false;

var initializeBase = function() {
    if (picBrowserBaseInitialized)
        return;
    picBrowserBaseInitialized = true;

    document.addEventListener("keydown", verticalArrowClick);
    document.addEventListener("wheel", verticalArrowClick, {passive: false});
    $(window).resize(() => $('.centered').each((i, c) => arrangeGallery(c)));
};

var addPost = function(urls) {
    if (jQuery.type(urls) === "string")
        urls = [urls];

    var postDiv = $('<div>', { class: 'post' }).appendTo($('#list'));

    var centered = $('<div>', { class: 'centered' }).appendTo(postDiv);
    
    var urlGroups = [urls];
    if (urls.length > 10) {
        const one = Math.ceil(urls.length / 3);  
        const two = Math.ceil(urls.length / 3 * 2);  
        urlGroups = [
            urls.slice(0, one),
            urls.slice(one, two),
            urls.slice(two)
        ];
    }
    else if (urls.length > 4) {
        const half = Math.ceil(urls.length / 2);   
        urlGroups = [
            urls.slice(0, half),
            urls.slice(half)
        ];
    }

    var isGallery = urls.length > 1;

    // Arrange images initially
    for (var n = 0; n < urlGroups.length; n++) {
        var line = $('<div>', { class: 'line' }).appendTo(centered);

        for (var i = 0; i < urlGroups[n].length; i++) {
            var styles = 'max-height: calc(100vh / ' + urlGroups.length + ' - 2px); ' 
                       + 'max-width: calc((100vw - 25px) / ' + urlGroups[n].length + ' - 2px);'

            var a = $('<a>', { href: urlGroups[n][i] }).appendTo(line);
            var img = $('<img>', { src: urlGroups[n][i], style: styles}).appendTo(a);
            if (isGallery)
                img.on("load", () => arrangeGallery(centered));
            else 
                img.on("load", () => cleanUp404(centered));

            a.click((e) => e.preventDefault());
        }
    }

    return postDiv;
};

var arrangeGallery = function(centered) {
    var images = [... $(centered).find('img')];

    if (images.length < 2 || images.filter(img => !img.complete).length > 0)
        return;

    var screenWidth = document.documentElement.clientWidth;
    var screenHeight = window.innerHeight;
    var screenRatio = screenWidth / screenHeight;

    var totalRatio = 0;
    images.forEach(img => {
        img.ratio = img.naturalWidth / img.naturalHeight;
        totalRatio += img.ratio;
    });

    var linesCount = computeLinesCount(totalRatio / screenRatio);
    var groups = [[]];
    var summaryRatio = 0;
    var lineIndex = 1;

    while (images.length > 0) {
        if (summaryRatio + images[0].ratio / 2 < totalRatio / linesCount * lineIndex) {
            summaryRatio += images[0].ratio;
            groups.at(-1).push(images.shift());
        }
        else {
            lineIndex++;
            groups.push([]);
        }
    }

    $(centered).empty();

    for (var g = 0; g < groups.length; g++) {
        var groupRatio = groups[g].map(img => img.ratio).reduce((sum, ratio) => sum + ratio);
        var lineWidth = screenWidth - 2 * groups[g].length;
        var lineHeight = Math.min(
            lineWidth / groupRatio, 
            screenHeight / groups.length - 2
        );

        var line = $('<div>', { class: 'line' }).appendTo(centered);

        for (var i = 0; i < groups[g].length; i++) {
            var img = groups[g][i];
            img.style = 'max-height: ' + lineHeight + 'px;';

            var a = $('<a>', { href: img.src }).appendTo(line);
            var img = $(img).appendTo(a);

            a.click((e) => e.preventDefault());
        }
    }
};

var cleanUp404 = function(centered) {
    var images = [... $(centered).find('img')];
    images.forEach(img => {
        if (!img.src.startsWith("https://i.imgur.com/"))
            return;

        if (img.naturalWidth == 161 && img.naturalHeight == 81)
            img.closest('.post').remove();
    });
}


var computeLinesCount = function(imgToScreenRatio) {
    var count = 1;
    while (count * (count + 1) < imgToScreenRatio)
        count++;
    return count;
};

var verticalArrowClick = function(event) {
    var boxes = [... list.children];
    var selectedImg;

    var direction = 0;
    if (/*event.deltaY > 0 || */event.keyCode === 40)
        direction = 1;
    else if (/*event.deltaY < 0 || */event.keyCode === 38)
        direction = -1;

    if (direction == 1) {
        selectedImg = boxes.filter(box => box.getBoundingClientRect().top > 1)[0];
    }
    else if (direction == -1) {
        selectedImg = boxes.filter(box => box.getBoundingClientRect().top < -1).at(-1);
    }
    else 
        return;

    if (selectedImg) {
        selectedImg.scrollIntoView();
    }
    else if (direction == 1) {
        $('#label').get(0).scrollIntoView();
    }

    event.preventDefault();
};