var homeUrl = 'https://trueteens.top/page/';

var scrollBarWidth = 17;
var pagesPerScreen = 10;
var user = null;
var page = 1;

var startTT = function () {
    console.log('TrueTeens Browser started');

    initializeBase();

    document.addEventListener("keydown", horizontalArrowClickTT);
    
    var match = /page=(\d+)/.exec(window.location.search);
    page = match ? parseInt(match[1]) : 1;

    var match = /user=(\w+)/.exec(window.location.search);
    user = match ? match[1] : null;

    if (user)
        document.title += " - " + user;
    document.title += " - Page " + page;
    loadTTPage(page);
};

var loadTTPage = function (pageNo) {
    var delay = 0;
    page = pageNo;
    $('#label').text('Loading page ' + page + '...');

    var url = 'https://trueteens.top/';
    if (user)
        url += 'members/' + user + '/snax_posts/approved/';
    url += 'page/' + page + '/';

    $.ajax(url, {
        success: function (data, status, xhr) { 
            var respHtml = $('<div/>').html(data).contents();
            if (user)
                var articles = respHtml.find('div.snax-posts article');
            else 
                var articles = respHtml.find('.page-body article');
            
            articles.each((i, article) => {
                var score = $(article).find('.snax-voting-score').attr('data-snax-voting-score');
                var author = user ?? $(article).find('.entry-author strong').text();

                score = parseInt(score);
                if (score < 0 || author === 'Al Kraft' && score < 15 && page > 180)
                    return true;
            
                if (page > 180 && ['Ronaldo', 'Steven', 'Thighs&Breasts'].includes(author))
                    return true;

                var link = $(article).find('a.g1-frame').attr('href');
            
                var galleryIcon = $(article).find('.g1-frame-icon-gallery')[0];
                var isGallery = galleryIcon && galleryIcon.innerText > 1;

                if (isGallery) {
                    delay += 2000;
                    setTimeout(() => loadTTGallery(link, page), delay);
                }
                else {
                    var url = $(article).find('img.wp-post-image').attr('data-src');
                    var avatar = $(article).find('img.avatar').attr('data-src');
                    if (avatar && avatar.includes('/buddypress/'))
                        avatar = false;
                    addTTPost({ 
                        urls: [url],
                        avatar: avatar,
                        author: author,
                        score: score,
                        page: page,
                        link: link
                    });
                }
            });
            
            console.log('Page ' + page + ' loaded successfully');

            delay += 2000;
            if (page % pagesPerScreen == 0) {
                setTimeout(() => {
                    $('#label').text('Page ' + page + ' was loaded. Press num-pad left / right for more.');
                }, delay);
            }
            else {
                setTimeout(() => loadTTPage(page + 1), delay);
            }
        },
        error: function (xhr, textStatus, errorMessage) { 
            console.log('Failed to load page ' + page + ': ' + xhr.status);
            delay += 3000;
            setTimeout(() => loadTTPage(page), delay);
        }
    });
};

var loadTTGallery = function(link, _page) {
    $.ajax(link, {
        success: function (data, status, xhr) { 
            var respHtml = $('<div/>').html(data).contents();
            var date = respHtml.find('time').first().attr('datetime').replace("T", " ").replace(/:\d\d\+.+/, "");
            var score = respHtml.find('.snax-voting-score').first().attr('data-snax-voting-score');
            var author = respHtml.find('.entry-author strong').first().text();
            var avatar = respHtml.find('img.avatar').first().attr('data-src');
            if (avatar.includes('/buddypress/'))
                avatar = false;
            var imgs = respHtml
                    .find('div.snax-items')
                    .first()
                    .find('img.wp-post-image');
            var urls = imgs.map((i, img) => {
                return $(img).attr('data-src');
            });
            addTTPost({ 
                urls: urls,
                avatar: avatar,
                author: author,
                score: score,
                page: _page,
                date: date
            });
        },
        error: function (xhr, textStatus, errorMessage) { 
            alert('Error while loading gallery: ' + xhr.status);
        }
    });
};

var addTTPost = function(post) {
    var urls = $(post.urls).map((i, url) => {
        return url.replace(/-\d{2,4}x\d{2,4}(\.\w{3,4})$/, "$1");
    });
    var postDiv = addPost(urls);
    postDiv.attr('link', post.link);

    var info = $('<div>', { class: 'info' }).appendTo(postDiv);
    if (post.avatar)
        info.append($('<img>', { src: post.avatar }));
    info.append(post.author + " | " + post.score);

    var pager = $('<div>', { class: 'pager' }).appendTo(postDiv);
    pager.append('Page: ' + post.page);
    if (post.date) {
        pager.append(" | " + post.date);
        pager.attr('date-set', true);
    }
    else {
        pager.click(e => {
            if (!pager.attr('date-set')) {
                pager.attr('date-set', true);
                updateTTDate(pager);
            }
        });
    }
};

var updateTTDate = function(pager) {
    var link = pager.closest('.post').attr('link');

    $.ajax(link, {
        success: function (data, status, xhr) { 
            var respHtml = $('<div/>').html(data).contents();
            var date = respHtml.find('time').first().attr('datetime').replace("T", " ").replace(/:\d\d\+.+/, "");
            pager.append(" | " + date);
        },
        error: function (xhr, textStatus, errorMessage) { 
            pager.attr('date-set', false);
            alert('Error while loading date: ' + xhr.status);
        }
    });
}


var horizontalArrowClickTT = function(event) {
    if (event.keyCode === 100 && page >= pagesPerScreen * 2) {
        page -= pagesPerScreen * 2;
    }
    else if (event.keyCode !== 102) {
        return;
    }

    var params = '?';
    if (user)
        params += 'user=' + user + '&';
    params += 'page=' + (page + 1);
    window.location.search = params;

    event.preventDefault();
};

