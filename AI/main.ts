
class Main {
    static running = false;
    static tagGroups: TagGroup[] = [];
    static tagMap: Map<string, Tag> = new Map();
    static hiddenImgs: HTMLImageElement[] = [];
    static restoredImgs: HTMLImageElement[] = [];
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

            let focusedEl = ev.relatedTarget as HTMLElement;
            let legitAncestor = focusedEl?.closest('.top-panel, #output-container');
            if (legitAncestor) {
                console.log("Not changing focus, because ancestor is:", legitAncestor);
            }
            else {
                console.log("Changing focus back");
                setTimeout(() => (document.querySelector('.editor') as HTMLElement).focus(), 0);
            }
        });

        let editor = $('.editor') as JQuery<HTMLTextAreaElement>;
        $(window).on('resize', () => this.resizeEditor(editor[0]));
        editor.on('input', () => this.resizeEditor(editor[0]));
        editor.on('keypress', ev => {
            if (ev.key != "Enter")
                return;
            this.startGenerator();
            ev.preventDefault();
        });
        editor.val(localStorage.getItem('query') ?? '');
        this.resizeEditor(editor[0]);

        let tagListUrl = chrome.runtime.getURL('AI/tags.json');
        fetch(tagListUrl)
            .then(response => response.json() as Promise<TagGroup[]>)
            .then(tagGroups => this.initializeTags(tagGroups));

        $('.send').on('click', this.startGenerator);
        $('.stop').on('click', this.stopGenerator);
        $('.minimize').on('click', this.minimize);

        $('.gallery')[0].addEventListener("wheel", this.scroll, { passive: false });
        document.body.addEventListener("keydown", this.onKeyDown);

        window.addEventListener("message", ev => {
            if (typeof ev.data !== 'string')
                return;
            if (!ev.data.startsWith('Img url: '))
                return;

            this.appendImg(ev.data.substring(9));
            if (!Main.running) {
                let frame = ev.source as Window;
                frame?.postMessage('Stop the loop', '*');
            }
        });
    }


    static startGenerator() {
        let editor = document.querySelector('.editor') as HTMLTextAreaElement;
        let query = Main.convertInput(editor.value);
        let tagQuery = Main.convertInput(Main.getTagString(false));

        let description = document.querySelector('textarea[data-name="description"]') as HTMLTextAreaElement;
        description.value = [query.positive, tagQuery.positive].join(", ");
        description.dispatchEvent(new Event('input', { bubbles: true }));

        let antyDesc = document.querySelector('input[data-name="negative"]') as HTMLInputElement;
        antyDesc.value = [query.negative, tagQuery.negative].join(", ");
        antyDesc.dispatchEvent(new Event('input', { bubbles: true }));

        let button = document.querySelector('#generateButtonEl') as HTMLButtonElement;
        setTimeout(() => button.click(), 0);

        Main.running = true;
        document.querySelector('.top-panel')?.classList?.add('running');
    }

    static stopGenerator() {
        Main.running = false;
        document.querySelector('.top-panel')?.classList?.remove('running');
        let frames = document.querySelectorAll('iframe');

        frames.forEach(frame => {
            frame.contentWindow?.postMessage('Stop the loop', '*');
        });
    }

    static minimize() {
        document.querySelector('.top-panel')?.classList.toggle('minimized');
    }

    static appendImg(src: string) {
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
        gallery?.append(img);
    }

    static hideImg(img: HTMLImageElement, saved: boolean) {
        img.classList.add('hidden');
        this.hiddenImgs.push(img);

        let iconType = saved ? 'download' : 'trash';
        let url = chrome.runtime.getURL(`img/${iconType}.svg`);

        let icon = document.querySelector('.icon') as HTMLElement;
        icon.setAttribute('style', `background: url(${url});`)
        icon.classList.add('activated');
        setTimeout(() => icon.classList.remove('activated'), 100);
    }

    static onKeyDown(ev: KeyboardEvent) {
        let editorFocused = document.querySelector('.editor') === document.activeElement;
        if (editorFocused)
            return;

        if (!ev.ctrlKey)
            return;

        switch (ev.key) {
            case "Tab":
                let editor = document.querySelector('.editor') as HTMLElement;
                setTimeout(() => editor.focus(), 0);
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

    static downloadImg(img: HTMLImageElement) {
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
                    alert('Failed to save the image:' + response.status);
                }
            })
            .catch((error) => {
                console.error(error);
                alert('An error occurred');
            });
    }

    static convertInput(inputString: string) {
        const match = inputString.match(/<([^<>]+)>/);
        let negative = "";
        let positive = inputString;
        if (match) {
            negative = match[1];
            positive = inputString.replace(match[0], "");
        }
        return { negative, positive };
    }

    static getCurrentQuery() {
        let query = (document.querySelector('textarea[data-name="description"]') as HTMLTextAreaElement).value;
        let negative = (document.querySelector('input[data-name="negative"]') as HTMLInputElement).value;
        let artStyle = (document.querySelector('select[data-name="artStyle"]') as HTMLSelectElement).selectedOptions[0].text;

        query = query.trim();
        if (negative?.length)
            query += ` { ${negative.trim()} }`;
        return query + ` [${artStyle}]`;
    }

    static resizeEditor(editor: HTMLTextAreaElement) {
        editor.style.height = '0';
        editor.style.height = editor.scrollHeight + 'px'
        localStorage.setItem('query', editor.value);
    }


    static scroll(event: WheelEvent) {
        event.preventDefault();

        if (event.timeStamp - this.prevScrollTime < 10)
            return;
        this.prevScrollTime = event.timeStamp;

        let gallery = document.querySelector('.gallery') as HTMLElement;
        let images = [...gallery.querySelectorAll('img:not(.hidden)')];
        let rect = gallery.getBoundingClientRect();
        let center = (rect.top + rect.bottom) / 2;

        if (event.deltaY > 0) {
            var selectedImg = images.filter(img => Main.midYPos(img) > center + 20)[0];
        }
        else {
            var selectedImg = images.filter(img => Main.midYPos(img) < center - 20).at(-1) as Element;
        }

        if (selectedImg) {
            let y = gallery.scrollTop + Main.midYPos(selectedImg) - center;
            gallery.scroll(0, y);
        }
    };

    /** Returns Y position of a middle of the element */
    static midYPos(el: Element) {
        let rect = el.getBoundingClientRect();
        return (rect.top + rect.bottom) / 2;
    }


    static initializeTags(tagGroups: TagGroup[]) {
        this.tagGroups = tagGroups;
        for (let group of tagGroups) {
            for (let tag of group.tags) {
                if (this.tagMap.has(tag.id)) {
                    alert("TagID '" + tag.id + "' is duplicated");
                    this.tagMap.clear();
                    return;
                }
                this.tagMap.set(tag.id, tag);
                tag.parent = group;
            }
        }

        let activeTags = JSON.parse(localStorage.getItem('tags') ?? "[]") as TagInfo[];
        activeTags.forEach(tagInfo => {
            let tag = this.tagMap.get(tagInfo.id);
            if (tag) {
                tag.checked = true;
                tag.disabled = tagInfo.disabled;
                tag.important = tagInfo.important;
            }
            if (tag?.parent?.isSentence) {

            }
        });

        tagGroups
            .filter(group => group.isSentence)
            .filter(group => group.tags.some(tag => tag.important))
            .forEach(group => {
                group.important = true;
                group.tags.forEach(tag => tag.important = true);
            });

        this.redrawTags();
    }


    static onTagCheckBoxClick(ev: JQuery.MouseDownEvent) {
        let element = ev.target as HTMLElement
        let tag = this.tagMap.get(element.id);
        if (!tag) {
            return;
        }

        switch (ev.button) {
            case 0:
                if (tag.checked) {
                    tag.important = !tag.important;
                    if (tag.parent?.isSentence) {
                        tag.parent.important = tag.important;
                        tag.parent.tags.forEach(t => t.important = tag?.important)
                    }
                }
                else {
                    tag.checked = true;
                }
                break;

            case 1:
                tag.checked = false;
                tag.disabled = false;
                break;

            case 2:
                tag.disabled = !tag.disabled;
                break;
        }
        this.redrawTags();

        let activeTagsInfo = [...this.tagMap.values()]
            .filter(tag => tag.checked)
            .map(tag => ({
                id: tag.id,
                important: tag.important,
                disabled: tag.disabled
            }));
        localStorage.setItem('tags', JSON.stringify(activeTagsInfo));

        ev.preventDefault();
        ev.stopPropagation();
    }


    static redrawTags() {
        let sidePanel = $('.side-panel');
        sidePanel.html("");

        this.tagGroups.forEach(group => {
            let groupElement = $('<div>', { class: 'tag-group' }).appendTo(sidePanel)

            group.tags.forEach(tag => {
                let element = $('<p>', { id: tag.id, class: 'tag tag-check-box' })
                    .text(tag.value)
                    .appendTo(groupElement);

                if (tag.checked) {
                    element.addClass("checked");
                    element.attr("style", "background-image: radial-gradient(" + group.color + " 3.5px, #0000 5px);")

                    if (tag.important) {
                        element.addClass("important");
                    }
                    if (tag.disabled) {
                        element.addClass("disabled");
                    }
                }
                else {
                    element.attr("style", "background-image: radial-gradient(#0000 2px, " + group.color + " 3.5px, #0000 5px);");
                }
            });
        });


        $(".tag-bar").html(this.getTagString(true));

        $(".tag")
            .on("mousedown", ev => this.onTagCheckBoxClick(ev))
            .on("mouseup", ev => ev.preventDefault())
            .on("contextmenu", () => false);
    }


    static getTagString(asHtml: boolean) {
        let activeGroups = this.tagGroups.filter(group =>
            group.tags.some(tag =>
                tag.checked && (asHtml || !tag.disabled)
            )
        );

        let texts = activeGroups.map(group => {
            let activeTags = group.tags.filter(tag =>
                tag.checked && (asHtml || !tag.disabled)
            );

            let spanTexts = activeTags.map(tag => {
                if (asHtml) {
                    return this.tag2html(tag, group.color);
                }
                if (tag.important && !tag.parent?.isSentence) {
                    return "(" + tag.value + ")";
                }
                return tag.value;
            });

            if (group.isSentence) {
                var text = spanTexts.join(" ");
                if (!asHtml && group.important) {
                    text = "(" + text + ")";
                }
            }
            else {
                var text = spanTexts.join(", ");
            }

            if (group.isNegative) {
                text = "<" + text + ">";
            }
            return text;
        });
        return texts.join(", ");
    }


    static tag2html(tag: Tag, color: string) {
        let span = $("<span>", {
            id: tag.id,
            class: "tag",
            style: `color: ${color};`
        });
        span.text(tag.value);
        if (tag.important) {
            span.addClass("important");
        }
        if (tag.disabled) {
            span.addClass("disabled");
        }
        return span.prop('outerHTML');
    }
}




interface TagInfo {
    id: string;
    important?: boolean;
    disabled?: boolean;
}

interface Tag extends TagInfo {
    value: string;
    checked?: boolean;
    parent?: TagGroup;
}

interface TagGroup {
    tags: Tag[];
    color: string;
    isSentence?: boolean;
    isNegative?: boolean;
    important?: boolean;
}





Main.init();