
class _4Archive {
    
    static start(url) {
        document.title = '4A Browser';
        const src_404 = [
            'https://4chanarchives.com/image/image-404.png',
            'https://i.imgur.com/removed.png'
        ]

        PicB.get(url, html => {
            document.title += " - " + html.find('h1.boardTitle')?.text() ?? '';

            var imgUrls = html
                .find('.thread a.fileThumb')
                .map((i, a) => a['href'])
                .filter((i, src) => !src_404.includes(src));

            PicB.addPosts(imgUrls, { onLoad: this.onLoad });
        });
    }

    static onLoad(ev) {
        if (ev.target.naturalWidth != 161)
            return;
        if (ev.target.naturalHeight != 81) 
            return;

        ev.target.closest('.post').remove();
    }

}
