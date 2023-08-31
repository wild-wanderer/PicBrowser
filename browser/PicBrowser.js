
class PicB {
    static initialized = false;
    static prevScrollTime = 0;
    static errorDelay = 0;
    
    static domParser = new DOMParser();


    /**
     * @type {{
     *   src: string;
     *   href?: string;
     *   altUrls?: string[]
     * }[]} 
     */  
    static postsQueue = [];


    static start() {
        console.log("Started Pic Browser");
        
        if (!this.initialized) {
            document.addEventListener("keydown", this.scroll);
            document.addEventListener("wheel", this.scroll, {passive: false});
            this.initialized = true;
        }

        var match = /url=(.+)/.exec(window.location.search);
        if (!match) {
            alert("URL was not provided");
            return;
        }
        var url = match[1];
        var host = /:\/\/([^\/?#]+)/.exec(url)[1];
        var isImg = /\.(?!html)[a-z]{3,4}($|\?)/i.test(url);


        if (host.endsWith('imx.to')) {
            IMX.start(url);
        }
        else if (isImg) {
            IterateOverId.start(url);
        }
        else if (host == "navratdoreality.cz") {
            NavratDoReality.start(url);
        }
        else if (host == '4archive.org' || host == '4chanarchives.com') {
            _4Archive.start(url);
        }
        else if (host.endsWith('depositphotos.com')) {
            DepositPhotos.start(url);
        }
        else {
            VisiblePictures.open(url);
        }
    }



    /**
     * @param {{
     *   src: string;
     *   href?: string;
     *   altUrls?: string[]
     * }[]} posts 
     */
    static addPosts(posts, options = {}) {
        let list = $('#list');

        posts.forEach(post => {
            var postDiv = $('<div>', { class: 'post' }).appendTo(list);

            const tag = options.isVideo ? '<video>' : '<img>'
            var img = $(tag, { 
                src: post.src,
                href: post.href
            });

            if (options.onLoad)
                img.one('load', options.onLoad);

            if (options.onError || Array.isArray(post.altUrls)) 
                img.one('error', ev => this.onError(ev, img, post.altUrls, options.onError));
            

            img.on('mouseup', ev => {
                if (ev.button >= 2)
                    return;
                
                let img = ev.target
                window.open(img.getAttribute('href') ?? img['src'], '_blank');
            })
            img.appendTo(postDiv);
        });
    };



    /**
     * @param {JQuery<HTMLElement>} img
     * @param {string[]} [altUrls]
     * @param {(Event) => void} [onError]
     */
    static onError(ev, img, altUrls, onError) {
        if (altUrls?.length) {
            let altUrl = altUrls.shift();
            img.one('error', () => this.onError(ev, img, altUrls, onError));
            img.attr('src', altUrl);
            img.closest('a').attr('href', altUrl);
        }
        else if (onError) {
            onError(ev);
        }
    }


    
    /**
     * @param {{
    *   src: string;
    *   href?: string;
    *   altUrls?: string[]
    * }[]} posts 
    */
    static addPostsOneByOne(posts, connectionsCount = 1, errorDelay = 1000) {
        this.errorDelay = errorDelay;
        if (posts)
            PicB.postsQueue.push(...posts);

        let hub = $('#hub');
        if (!hub.length)
            hub = $('<div>', { id: 'hub' }).appendTo($('body'));
        hub.text(PicB.postsQueue.length + ' imgs in queue');

        if (!PicB.postsQueue.length) {
            hub.remove();
            return;
        }
    
        for (let i = 0; i < connectionsCount; i++) {
            PicB.addPosts([PicB.postsQueue.shift()], { 
                onLoad: () => PicB.addPostsOneByOne(null),
                onError: (/** @type {{ target: any; }} */ ev) => {
                    let img = ev.target;
                    $(img).one('error', () => PicB.addPostsOneByOne(null));

                    let postFix = img.src.includes('?') ? '&r' : '?r'
                    setTimeout(() => img.src += postFix, this.errorDelay);
                } 
            });
        }
    }
    


    /**
     * @param {MouseEvent|KeyboardEvent} event
     */
    static scroll(event) {
        var posts = [... $('.post')];
        var selectedImg;
        var direction = 0;

        if (event instanceof MouseEvent) {
            event.preventDefault();
            if (event.timeStamp - this.prevScrollTime < 10)
                return;
            direction = event['deltaY'];
            this.prevScrollTime = event.timeStamp;
        }
        else {
            switch (event.key) {
                case "ArrowUp":     direction = -1;     break;
                case "ArrowDown":   direction = +1;     break;
                default:            return;
            }
            event.preventDefault();
        }

        if (direction > 0) {
            selectedImg = posts.filter(box => box.getBoundingClientRect().top > 1)[0];
        }
        else {
            selectedImg = posts.filter(box => box.getBoundingClientRect().top < -1).at(-1);
        }

        if (selectedImg) {
            selectedImg.scrollIntoView();
        }
        else if (direction == 1) {
            $('#label').get(0).scrollIntoView();
        }
    };



    /**
     * Sends GET request and executes handler on the response
     * @param {string} url
     * @param {(html: JQuery<Document>) => void} handler
     * @param {{}} [options]
     */
    static async get(url, handler, options) {
        $.ajax(url, {
            success: function (data, status, xhr) {
                let html = this.domParser.parseFromString(data, 'text/html');
                handler($(html));
            },
            error: function (xhr, textStatus, errorMessage) {
                alert("Failed to download: " + url);
            },
            ...options
        });
    }

    /**
     * Sends POST request and executes handler on the response
     * @param {string} url
     * @param {string|{}} data
     * @param {(html: JQuery<Document>) => void} handler
     * @param {{}} [options]
     */
    static post(url, data, handler, options) {
        this.get(url, handler, {
            method: 'POST',
            data: data,
            ...options
        });
    }

}

PicB.start();
