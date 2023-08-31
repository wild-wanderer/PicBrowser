// <reference path="../jquery-3.6.4.js" />

var domParser = new DOMParser();




function openVisiblePictures(url) {
    getHtml(url, html => {
        html.find('img, image, video')
            .each((idx, pic) => {

                let src = first(
                    $(pic).attr('src'), 
                    $(pic)[0].href?.baseVal,
                    $(pic).attr('currentSrc')
                );

                let link = findPicLink(pic, src);
                if (link)
                    src = link;

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




function first(...strings) {
    return strings.filter(str => str)[0];
}

