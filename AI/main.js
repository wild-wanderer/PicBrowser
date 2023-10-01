
class Main {
    static running = false;
    static hiddenImgs = [];
    static restoredImgs = [];
    static editorActive = true;
    static prevScrollTime = 0;
    static domParser = new DOMParser();

    static async init() {
        if (!location.hostname.endsWith('.perchance.org')) {
            return;
        }

        let overlayUrl = chrome.runtime.getURL('AI/overlay.html');
        await fetch(overlayUrl)
            .then(response => response.text())
            .then(html => this.domParser.parseFromString(html, 'text/html'))
            .then(overlay => $(overlay).find('.top-panel').appendTo($("body")));
        
        $('.top-panel').on('focusout', ev => {
            console.log('Focus shift', ev.target, ev.relatedTarget);
            
            let focusedEl = ev.relatedTarget;
            let legitAncestor = focusedEl?.closest('.top-panel, #output-container');
            if (legitAncestor) {
                console.log("Not changing focus, because ancestor is:", legitAncestor);
            }
            else {
                console.log("Changing focus back");
                setTimeout(() => document.querySelector('.editor').focus(), 0);
            }
        });

        let editor = $('.editor');
        editor.on('input', () => this.resizeEditor(editor[0]));
        editor.on('keypress', ev => {
            if (ev.key != "Enter") 
                return;
            this.startGenerator();
            ev.preventDefault();
        });
        editor.val(localStorage.getItem('query') ?? '');
        this.resizeEditor(editor[0]);

        let sidePanel = $('.side-panel');
        let tagListUrl = chrome.runtime.getURL('AI/tags.json');
        fetch(tagListUrl)
            .then(response => response.json())
            .then(tags => tags.forEach(tag => {
                $('<p>', { id: tag }).text(tag).appendTo(sidePanel);
            }));

        $('.send').on('click', this.startGenerator);
        $('.stop').on('click', this.stopGenerator);
        $('.minimize').on('click', this.minimize);

        document.addEventListener("wheel", this.scroll, { passive: false });
        document.body.addEventListener("keydown", this.onKeyDown);

        window.addEventListener("message", ev => {
            if (typeof ev.data !== 'string')
                return;
            if (!ev.data.startsWith('Img url: ')) 
                return;

            this.appendImg(ev.data.substring(9));
        });
    }


    static startGenerator() {
        let editor = document.querySelector('.editor');
        let query = Main.convertInput(editor.value);

        let description = document.querySelector('textarea[data-name="description"]')
        description.value = query.positive;
        description.dispatchEvent(new Event('input', { bubbles: true }));

        let antyDesc = document.querySelector('input[data-name="negative"]')
        antyDesc.value = query.negative;
        antyDesc.dispatchEvent(new Event('input', { bubbles: true }));

        let button = document.querySelector('#generateButtonEl');
        setTimeout(() => button.click(), 0);

        Main.running = true;
        document.querySelector('.top-panel').classList.add('running');
    }

    static stopGenerator() {
        Main.running = false;
        document.querySelector('.top-panel').classList.remove('running');
        let frames = document.querySelectorAll('iframe');
        frames.forEach(frame => {
            frame.contentWindow.postMessage('Stop the loop', '*');
        });
    }

    static minimize() {
        document.querySelector('.top-panel')
            .classList.toggle('minimized');
    }

    static appendImg(src) {
        let gallery = document.querySelector('.gallery');

        let query = this.getCurrentQuery();
        let img = document.createElement('img');
        img.setAttribute('src', src);
        img.setAttribute('title', query)
        img.addEventListener('mouseup', ev => {
            if (ev.button == 1) {
                if (ev.timeStamp - this.prevScrollTime < 30)
                    return;
                this.hideImg(img, false);
            }
            else if (ev.button == 0) {
                this.downloadImg(img);
            }
            ev.preventDefault();
        });
        gallery.append(img);
    }

    static hideImg(img, saved) {
        img.classList.add('hidden');
        this.hiddenImgs.push(img);

        let iconType = saved ? 'download' : 'trash';
        let url = chrome.runtime.getURL(`img/${iconType}.svg`);

        let icon = document.querySelector('.icon');
        icon.setAttribute('style', `background: url(${url});`)
        icon.classList.add('activated');
        setTimeout(() => icon.classList.remove('activated'), 100);
    }

    static onKeyDown(ev) {
        let editorFocused = document.querySelector('.editor') === document.activeElement;
        if (editorFocused)
            return;

        if (!ev.ctrlKey)
            return;

        switch (ev.key) {
            case "Tab":   
                setTimeout(() => document.querySelector('.editor').focus(), 0);
                break;

            case "z":
                var img = Main.hiddenImgs.pop();
                if (!img)
                    return;
                img.classList?.remove('hidden');
                Main.restoredImgs.push(img);
                break;

            case "y":
                var img = Main.restoredImgs.pop();
                if (!img)
                    return;
                img.classList?.add('hidden');
                Main.hiddenImgs.push(img);
                break;
                    
            default:    
                return;
        }

        ev.preventDefault();   
    }

    static downloadImg(img) {
        fetch('http://localhost:3000/upload', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ 
                imageBase64: img.src, 
                comment: img.title 
            }),
        })
        .then((response) => {
            if (response.ok) {
                this.hideImg(img, true);
            } else {
                console.error(error);
                alert('Failed to save the image:', response.status);
            }
        })
        .catch((error) => {
            console.error(error);
            alert('An error occurred');
        });
    }

    static convertInput(inputString) {
        const match = inputString.match(/\{([^}]+)\}/);
        let negative = "";
        let positive = inputString;
        if (match) {
            negative = match[1];
            positive = inputString.replace(match[0], "");
        }
        return { negative, positive };
    }

    static getCurrentQuery() {
        let query = document.querySelector('textarea[data-name="description"]').value;
        let negative = document.querySelector('input[data-name="negative"]').value;
        let artStyle = document.querySelector('select[data-name="artStyle"]').selectedOptions[0].text;

        query = query.trim();
        if (negative?.length)
            query += ` { ${negative.trim()} }`;
        return query + ` [${artStyle}]`;
    }

    static resizeEditor(editor) {
        editor.style.height = '0';
        editor.style.height = editor.scrollHeight + 'px'
        localStorage.setItem('query', editor.value);
    }


    /** @param {MouseEvent} event */
    static scroll(event) {
        event.preventDefault();

        if (event.timeStamp - this.prevScrollTime < 10)
            return;
        this.prevScrollTime = event.timeStamp;

        let gallery = document.querySelector('.gallery')
        let images = [...gallery.querySelectorAll('img:not(.hidden)')];
        let rect = gallery.getBoundingClientRect();
        let center = (rect.top + rect.bottom) / 2;

        if (event['deltaY'] > 0) {
            var selectedImg = images.filter(img => Main.midYPos(img) > center + 20)[0];
        }
        else {
            var selectedImg = images.filter(img => Main.midYPos(img) < center - 20).at(-1);
        }

        if (selectedImg) {
            let y = gallery.scrollTop + Main.midYPos(selectedImg) - center;
            gallery.scroll(0, y);
        }
    };

    /** 
     * Returns Y position of a middle of the element
     * @param {Element} el 
     * */
    static midYPos(el) {
        let rect = el.getBoundingClientRect();
        return (rect.top + rect.bottom) / 2;
    }

}

Main.init();