
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
                let galleryUrl = 'https://imx.to' + previewHtml.find('a[title="Show gallery"]').attr('href');
                this.openThumbs(galleryUrl);
            }
        );
    }

    /** @param {string} galleryUrl */
    static openThumbs(galleryUrl) {
        PicB.get(galleryUrl, galleryHtml => {
            let imgUrls = galleryHtml
                .find('a img.imgtooltip')
                .toArray()
                .map(img => ({
                    src: img['src'],
                    href: img['src']?.replace('/t/', '/i/')
                }));

            PicB.addPostsOneByOne(imgUrls, 1, 200);
        });
    }
    
}
