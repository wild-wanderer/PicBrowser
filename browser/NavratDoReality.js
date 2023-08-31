
class NavratDoReality {
    static start(url) {
        document.title = 'NDR Browser';

        PicB.get(url, html => {
            var imgUrls = html
                .find('.list-gallery > li > div > a')
                .toArray()
                .map(a => ({ src: a['href']}));
                
            PicB.addPosts(imgUrls, {})
        });
    }
}
