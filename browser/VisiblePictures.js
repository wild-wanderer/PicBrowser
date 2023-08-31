
class VisiblePictures {

    static open(url) {
        PicB.get(url, html => {
            let posts = html
                .find('img, image, video')
                .toArray()
                .map(pic => {
                    let src = pic['src'] 
                           ?? pic[0].href?.baseVal 
                           ?? pic['currentSrc'];

                    src = findPicLink(pic, src) ?? src;

                    if (!src || src.startsWith('blob:'))
                        return;

                    if (src.startsWith('/')) {
                        let _url = new URL(url);
                        src = _url.protocol + '//' + _url.host + src;
                    }

                    return {
                        src: src,
                        isVideo: pic.tagName.toLowerCase() === 'video'
                    }
                });

            PicB.addPosts(posts, {
                onError: event => {
                    $(event.target).closest('.post').remove();
                },
                onLoad: event => {
                    const pic = event.target;
                    const rect = pic.getBoundingClientRect();
                    if (rect.width * rect.height < 100000) {
                        pic.closest('.post').remove();
                    }
                }
            });
        });
    }

}
