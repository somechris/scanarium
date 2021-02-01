var FrameCounter = {
    showFrameCount: false,
    frameCountInterval: 1000, //milli-seconds
    frameCount: 0,
    frameCountSprite: null,
    labelPrefix: 'fps: ',

    init: function() {
        if (getParameterBoolean('showFrameCounter', false)) {
            this.toggleVisibility();
        }
    },

    toggleVisibility: function() {
        this.showFrameCount = !(this.showFrameCount);
        if (this.showFrameCount) {
            var offset = 32 * window.devicePixelRatio;
            this.frameCountSprite = game.add.text(offset, offset, this.labelPrefix + '?');
            this.frameCountSprite.depth = 999999;
        } else {
            if (this.frameCountSprite != null) {
                this.frameCountSprite.destroy();
            }
        }
    },

    update: function(time, delta, lastTime) {
        if (this.showFrameCount) {
            if (Math.floor(lastTime / this.frameCountInterval) == Math.floor(time / this.frameCountInterval)) {
                this.frameCount++;
            } else {
                if (this.frameCountSprite != null) {
                    this.frameCountSprite.setText(this.labelPrefix + this.frameCount);
                }
                this.frameCount=1;
            }
        }
    },
};

