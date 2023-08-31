
class IterateOverId {
        
    static start(url) {
        $('body').prepend($('<input>', { type: 'button', id: 'btn', value: 'Go' }));
        $('body').prepend($('<input>', { type: 'url', id: 'postfix', placeholder: 'Postfix (optional)' }));
        $('body').prepend($('<input>', { type: 'url', id: 'url', placeholder: 'Url' }));
        $('#url').val(url);

        $('#btn').on('click', this.loadByUrlId);
        $('input').on('keyup', event => {
            if (event.keyCode === 13) {
                event.preventDefault();
                this.loadByUrlId();
            }
        });

        this.loadByUrlId();
    }

    static loadByUrlId() {
        $('#list').children().remove();

        var url = $('#url').val() + '';
        var postfix = $('#postfix').val() + '';

        if (url.includes('alamy.com')) {
            if (!postfix.trim()) {
                var index = url.lastIndexOf('.');
                postfix = url.substring(index, url.length);
                url = url.substring(0, index - 1);
            }

            for (var i = 0; i < 10; i++) {
                this.addImg(url + i + postfix);
            }
            for (var i = 0; i < 26; i++) {
                this.addImg(url + String.fromCharCode(65 + i) + postfix);
            }
        }
        else {
            if (!postfix.trim()) {
                let postfixMatch = url.match(/^(.+\d)(\D*)$/);
                url = postfixMatch[1];
                postfix = postfixMatch[2];
            }

            let match = url.match(/^(.+\D)(\d+)$/);
            let urlPrefix = match[1];
            let number = match[2];

            if (number.length === 1) {
                for (let i = 0; i < 100; i++) {
                    this.addImg(urlPrefix + i + postfix);
                }
            }
            else if (number.length === 2) {
                for (let i = 0; i < 10; i++) {
                    this.addImg(urlPrefix + '0' + i + postfix);
                }
                let start = number.at(0) === '0' ? 10 : 0;
                for (let i = start; i < 100; i++) {
                    this.addImg(urlPrefix + i + postfix);
                }
            }
            else {
                let numberPrefix = number.slice(0, -2);
                for (let i = 0; i < 100; i++) {
                    this.addImg(urlPrefix + numberPrefix + String(i).padStart(2, '0') + postfix);
                }
            }
        }
    };

    /** @param {string} url */
    static addImg(url) {
        var postDiv = PicB.addPosts([{ src: url }], {
            onError: event => {
                $(event.target).closest('.post').remove();
            }
        });
    };
}
