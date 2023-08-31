
class DepositPhotos {

    offset = 0;

    static start(url) {
        document.title = 'DP Browser';

        var match = /offset=(\d+)/.exec(location.search);
        this.offset = match ? parseInt(match[1]) : 0;

        PicB.get(url, html => {
            let imgUrls = html
                .find('section.file-container img')
                .map((i, img) =>
                    $(img).attr('src') ?? 
                    $(img).attr('data-src') ?? 
                    alert('img.src not found')
                );

            imgUrls.each((idx, url) => {
                let largeUrl = url.replace(/\/i\/\d+\//, '/i/1600/');
                let mediumUrl = url.replace(/\/i\/\d+\//, '/i/950/');
                PicB.addPosts(largeUrl, { altUrls: [ mediumUrl, url ] });
            });

            $('#label').text('Page with offset = ' + this.offset + ' was loaded. Press num-pad left / right for more.');
        });

        document.addEventListener("keydown", ev => this.horizontalArrowClickDP(ev));
    }

    static horizontalArrowClickDP(event) {
        if (event.keyCode === 100) {
            this.offset = Math.max(0, this.offset - 100);
        }
        else if (event.keyCode === 102) {
            this.offset += $('img').length;
        }
        else {
            return;
        }

        event.preventDefault();

        let param = 'offset=' + this.offset;
        if (location.search.substring(1).includes('offset=')) {
            location.search = location.search.replace(/offset=(\d+)/, param);
            return;
        }

        let joint = location.search.substring(1).includes('?') ? '&' : '?';
        location.search += joint + param;
    };

}

function addImg(url, altUrl) {
    var postDiv = addPost(url);
    $(postDiv).find('img')[0].onerror = event => {
        let img = $(event.target);
        let a = img.closest('a');
        img.attr('src', altUrl);
        a.attr('href', altUrl);
    };
}
