var FrameCounter = {
    showFrameCount: false,
    frameCountInterval: 1000, //milli-seconds
    frameCount: 0,
    frameCountSprite: null,
    labelPrefix: 'fps: {fps}',
    urlParameter: 'showFrameCounter',

    init: function() {
        if (getUrlParameterBoolean(this.urlParameter, false)) {
            this.toggleVisibility();
        }
    },

    formatCount: function(count) {
        if (this.frameCountSprite != null) {
            this.frameCountSprite.setText(localize(this.labelPrefix, {'fps': count}));
        }
    },

    toggleVisibility: function() {
        this.showFrameCount = !(this.showFrameCount);
        if (this.showFrameCount) {
            var offset = 32 * window.devicePixelRatio;
            this.frameCountSprite = game.add.text(offset, offset, '');
            this.formatCount('?');
            this.frameCountSprite.depth = 999999;
        } else {
            if (this.frameCountSprite != null) {
                this.frameCountSprite.destroy();
            }
        }
        setUrlParameterBoolean(this.urlParameter, this.showFrameCount);
    },

    update: function(time, delta, lastTime) {
        if (this.showFrameCount) {
            if (Math.floor(lastTime / this.frameCountInterval) == Math.floor(time / this.frameCountInterval)) {
                this.frameCount++;
            } else {
                this.formatCount(this.frameCount);
                this.frameCount=1;
            }
        }
    },
};

