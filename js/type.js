class GhostType {
    constructor(targetId, options) {
        this.options = options || {
            interval: 50,
            delay: 2000
        };
        this.targetId = targetId;
        this.target = $(this.targetId);
        this.playing = false;
        this.timeoutId = null;
        this.data = {
            $originalText: null,
            $remainingTexts: null,
            $currentText: null,
        };
        this.actions = {
            delay: function (args, next, typer) {
                var waitTime = parseInt(args[1], 10);
                if (!isNaN(waitTime)) {
                    typer.setTimeout(next, waitTime);
                }
                else {
                    next();
                }
            },
            setTypeInterval: function (args, next, typer) {
                var interval = parseInt(args[1], 10);
                if (!isNaN(interval)) {
                    typer.options.interval = interval;
                }
                next();
            },
            removeText: function (args, next, typer) {
                var length = parseInt(args[1], 10);
                if (!isNaN(length)) {
                    typer.data.$remainingTexts.splice(0, length);
                }
                next();
            },
            type: function (args, next, typer) {
                var text = args.slice(1).join(' ');
                typer.data.$remainingTexts.splice.apply(typer.data.$remainingTexts, [0, 0].concat(text.split('')));
                next();
            },
            deleteLine: function (args, next, typer) {
                var lines, length = parseInt(args[1] || '1', 10);
                if (isNaN(length)) {
                    length = 1;
                }
                lines = typer.data.$currentText.split(/<br\/?>/);
                while (length--) {
                    lines.pop();
                }
                typer.data.$currentText = lines.join('<br>');
                next();
            },
            clear: function (args, next, typer) {
                typer.data.$currentText = '';
                next();
            },
            reset: function (args, next, typer) {
                typer.reset();
            }
        };
        this.handles = {
            start: function () { },
            stop: function () { }
        };
    }
    start() {
        this.reset();
        this.data.$originalText =
            this.data.$originalText ||
            $(this.targetId).html();
        this.data.$remainingTexts = this.data.$originalText.replace(/\n +/g, "").replace(/\s+/g, ' ').split("");
        this.data.$currentText = "";
        $(this.targetId).html('');
        this.playing = true;
        this.handles.start.call(this);
        this.setTimeout(this.tick_.bind(this), this.options.delay);
    }
    /* control timeout */
    setTimeout(func, delay) {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            if (window.console && window.console.error) {
                window.console.error(new Error('setTimeout during timeout exist'), func);
            }
            else {
                window.alert(new Error('setTimeout during timeout exist'), func);
            }
        }
        this.timeoutId = setTimeout(function () {
            this.clearTimeout();
            func();
        }.bind(this), delay);
    }
    clearTimeout() {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
    }
    /* control the tick loop */
    stop() {
        this.clearTimeout();
        this.playing = false;
        this.handles.stop.call(this);
    }
    resume() {
        this.tick_();
    }
    /* reset content */
    reset() {
        this.stop();
        if (this.data.$originalText !== null) {
            this.target.html(this.data.$originalText);
        }
    }
    /* parse and decide next action */
    tick_() {
        var i, commetInner, action, args;
        if (this.data.$remainingTexts.length === 0) {
            this.playing = false;
            return;
        }
        if (this.data.$remainingTexts.slice(0, 4).join('') === "<!--") {
            for (var i = 0; i < this.data.$remainingTexts.length; i++) {
                if (this.data.$remainingTexts.slice(i, i + 3).join('') === "-->") {
                    commetInner = this.data.$remainingTexts.slice(4, i).join('');
                    this.data.$remainingTexts.splice(0, i + 3);
                    commetInner = commetInner.replace(/^\s+|\s+$/g, '');
                    break;
                }
            }
            if (commetInner && commetInner[0] === "$") {
                args = commetInner.split(' ');
                args[0] = args[0].slice(1);
                if (this.actions[args[0]]) {
                    this.actions[args[0]](args, this.tick_.bind(this), this);
                    return;
                }
            }
            this.type(this.data.$remainingTexts.shift());
            this.setTimeout(this.tick_.bind(this), this.options.interval);
        }
        else if (this.data.$remainingTexts[0] === '<') {
            var text = this.data.$remainingTexts.shift();
            while (this.data.$remainingTexts[0] !== '>') {
                text += this.data.$remainingTexts.shift();
            }
            text += this.data.$remainingTexts.shift();
            this.type(text);
            this.setTimeout(this.tick_.bind(this), this.options.interval);
        }
        else {
            this.type(this.data.$remainingTexts.shift());
            this.setTimeout(this.tick_.bind(this), this.options.interval);
        }
    }
    type(char) {
        this.data.$currentText += char;
        this.target.html(this.data.$currentText);
    }
}

const typer = new GhostType("span.target", { delay: 10 });
typer.start();
