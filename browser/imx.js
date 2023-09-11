
class IMX {

    /** @param {string} url */
    static start(url) {
        document.title = 'IMX Browser';
    
        let isGaleryRegex  = /imx\.to\/g\//;

        if (isGaleryRegex.test(url)) {
            this.openThumbs(url)
        }
        else {
            this.fetchGalery(url);
        }
    }

    /** @param {string} imgUrl */
    static fetchGalery(imgUrl) {
        let id = imgUrl.match(/\/(\w+)(\.\w+)?$/)[1];
        let previewUrl = 'https://imx.to/i/' + id;
    
        PicB.post(
            previewUrl, 
            "imgContinue=Continue+to+your+image...", 
            previewHtml => {
                let galleryBtn = previewHtml.find('a[title="Show gallery"]');
                if (!galleryBtn.length) {
                    alert("Not a gallery");
                    return;
                }

                let galleryUrl = 'https://imx.to' + galleryBtn.attr('href');
                this.openThumbs(galleryUrl);
            }
        );
    }

    /** @param {string} galleryUrl */
    static openThumbs(galleryUrl) {
        PicB.get(galleryUrl, galleryHtml => {
            let posts = galleryHtml
                .find('a img.imgtooltip')
                .toArray()
                .map(img => ({
                    thumb: img['src'],
                    src: img['src']?.replace('/t/', '/i/')
                }));

            PicB.addPosts(posts);
        });
    }
    
}
