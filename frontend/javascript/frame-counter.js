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
            this.frameCountSprite = game.add.text(0, 0, '');
            this.relayout();
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

    relayout: function() {
        if (FrameCounter.showFrameCount) {
            FrameCounter.frameCountSprite.x = 32 * window.devicePixelRatio;
            FrameCounter.frameCountSprite.y = scanariumConfig.height - 32 * window.devicePixelRatio;
        }
    },
};
LayoutManager.register(FrameCounter.relayout);
