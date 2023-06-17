/// <reference path="../jquery-3.6.4.js" />


var startPicBrowser = function() {
    console.log("Started Pic Browser");
    
    initializeBase();


    var match = /url=(.+)/.exec(window.location.search);
    if (!match) {
        alert("URL was not provided");
        return;
    }
    var url = match[1];
    var host = /:\/\/([^\/?#]+)/.exec(url)[1];
    var isImg = /\.(?!html)[a-z]{3,4}($|\?)/i.test(url);


    if (isImg) {
        iterateOverUrlId(url);
    }
    else if (host == "navratdoreality.cz") {
        StartNDR(url);
    }
    else if (host == '4archive.org' || host == '4chanarchives.com') {
        start4Archive(url);
    }
    else if (host.endsWith('depositphotos.com')) {
        startDepositPhotos(url);
    }
    else {
        openVisiblePictures(url);
    }
}



function openVisiblePictures(url) {
    getHtml(url, html => {
        html.find('img, image, video')
            .each((idx, pic) => {
                let link = pic.closest('a')?.href;
                const isPicLink = link && new URL(link).pathname.match(/\w\.\w{2,4}$/);
                let src = isPicLink ? link : null;

                src ??= first(
                    $(pic).attr('src'), 
                    $(pic)[0].href?.src,
                    $(pic).attr('currentSrc'), 
                    $(pic).attr('data-src')
                );

                if (!src || src.startsWith('blob:'))
                    return;

                if (src.startsWith('/')) {
                    let _url = new URL(url);
                    src = _url.protocol + '//' + _url.host + src;
                }

                const isVideo = pic.tagName.toLowerCase() === 'video';
                var postDiv = addPost(src, isVideo);
                pic = $(postDiv).find('img, video')[0];
                pic.onerror = event => {
                    $(event.target).closest('.post').remove();
                };
                pic.onload = event => {
                    const pic = event.target;
                    const rect = pic.getBoundingClientRect();
                    if (rect.width * rect.height < 100000) {
                        pic.closest('.post').remove();
                    }
                }
            });
    });
}



var StartNDR = function(url) {
    document.title = 'NDR Browser';

    $.ajax(url, {
        success: function (data, status, xhr) {
            var respHtml = $('<div/>').html(data).contents();
            var imgUrls = respHtml.find('.list-gallery > li > div > a').map((i, a) => a.href);
            imgUrls.each((index, url) => addPost(url));
        },
        error: function (xhr, textStatus, errorMessage) {
            alert("Failed")
        }
    });
}



var start4Archive = function(url) {
    document.title = '4A Browser';

    $.ajax(url, {
        success: function (data, status, xhr) {
            var respHtml = $('<div/>').html(data).contents();
            var imgUrls = respHtml.find('.thread a.fileThumb').map((i, a) => a.href);

            imgUrls.each((index, url) => {
                const src_404 = [
                    'https://4chanarchives.com/image/image-404.png',
                    'https://i.imgur.com/removed.png'
                ]
                if (!src_404.includes(url))
                    addPost(url);
            });
        },
        error: function (xhr, textStatus, errorMessage) {
            alert("Failed")
        }
    });
}



let dpOffset = 0;

function startDepositPhotos(url) {
    document.title = 'DP Browser';

    var match = /offset=(\d+)/.exec(location.search);
    dpOffset = match ? parseInt(match[1]) : 0;

    getHtml(url, html => {
        let imgUrls = html
            .find('section.file-container img')
            .map((i, img) => {
                return $(img).attr('src') ?? 
                    $(img).attr('data-src') ?? 
                    alert('img.src not found');
            });

        imgUrls.each((idx, url) => {
            addImg(url.replace(/\/i\/\d+\//, '/i/1600/'), url);
        });

        $('#label').text('Page with offset = ' + dpOffset + ' was loaded. Press num-pad left / right for more.');
    });

    document.addEventListener("keydown", horizontalArrowClickDP);
}

function horizontalArrowClickDP(event) {
    if (event.keyCode === 100) {
        dpOffset = Math.max(0, dpOffset - 100);
    }
    else if (event.keyCode === 102) {
        dpOffset += $('img').length;
    }
    else {
        return;
    }

    event.preventDefault();

    let param = 'offset=' + dpOffset;
    if (location.search.substring(1).includes('offset=')) {
        location.search = location.search.replace(/offset=(\d+)/, param);
        return;
    }

    let joint = location.search.substring(1).includes('?') ? '&' : '?';
    location.search += joint + param;
};



/**
 * 
 * @param {string} url 
 * @param {function(JQuery<HTMLElement>) : void} handler 
 */
function getHtml(url, handler) {
    $.ajax(url, {
        success: function (data, status, xhr) {
            var html = $('<div/>').html(data).contents();
            handler(html);
        },
        error: function (xhr, textStatus, errorMessage) {
            alert("Failed to download: " + url);
        }
    });
}



var iterateOverUrlId = function(url) {
    $('body').prepend($('<input>', { type: 'button', id: 'btn', value: 'Go' }));
    $('body').prepend($('<input>', { type: 'url', id: 'postfix', placeholder: 'Postfix (optional)' }));
    $('body').prepend($('<input>', { type: 'url', id: 'url', placeholder: 'Url' }));
    $('#url').val(url);

    $('#btn').click(loadByUrlId);
    $('input').keyup(function(event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            loadByUrlId();
        }
    });

    loadByUrlId();
}

var loadByUrlId = function() {
    $('#list').children().remove();

    var url = $('#url').val();
    var postfix = $('#postfix').val();

    if (url.includes('alamy.com')) {
        if (!postfix.trim()) {
            var index = url.lastIndexOf('.');
            postfix = url.substring(index, url.length);
            url = url.substring(0, index - 1);
        }

        for (var i = 0; i < 10; i++) {
            addImgByUrlId(url + i + postfix);
        }
        for (var i = 0; i < 26; i++) {
            addImgByUrlId(url + String.fromCharCode(65 + i) + postfix);
        }
    }
    else {
        if (!postfix.trim()) {
            let postfixMatch = url.match(/^(.+\d)(\D*)$/);
            url = postfixMatch[1];
            postfix = postfixMatch[2];
        }

        let match = url.match(/^(.+\D)(\d+)$/);
        let urlPrefix = match[1];
        let number = match[2];

        if (number.length === 1) {
            for (let i = 0; i < 100; i++) {
                addImgByUrlId(urlPrefix + i + postfix);
            }
        }
        else if (number.length === 2) {
            for (let i = 0; i < 10; i++) {
                addImgByUrlId(urlPrefix + '0' + i + postfix);
            }
            let start = number.at(0) === '0' ? 10 : 0;
            for (let i = start; i < 100; i++) {
                addImgByUrlId(urlPrefix + i + postfix);
            }
        }
        else {
            let numberPrefix = number.slice(0, -2);
            for (let i = 0; i < 100; i++) {
                addImgByUrlId(urlPrefix + numberPrefix + String(i).padStart(2, '0') + postfix);
            }
        }
    }
};



var addImgByUrlId = function(url) {
    var postDiv = addPost([url]);
    $(postDiv).find('img')[0].onerror = event => {
        $(event.target).closest('.post').remove();
    };
};

function addImg(url, altUrl) {
    var postDiv = addPost(url);
    $(postDiv).find('img')[0].onerror = event => {
        let img = $(event.target);
        let a = img.closest('a');
        img.attr('src', altUrl);
        a.attr('href', altUrl);
    };
}




function first(...strings) {
    return strings.filter(str => str)[0];
}




startPicBrowser();