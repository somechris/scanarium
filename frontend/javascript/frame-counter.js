var FrameCounter = {
    showFrameCount: false,
    frameCountInterval: 1000, //milli-seconds
    frameCount: 0,
    frameCountSprite: null,

    init: function() {
        if (getParameterBoolean('showFrameCounter', false)) {
            this.toggleVisibility();
        }
    },

    toggleVisibility: function() {
        this.showFrameCount = !(this.showFrameCount);
        if (this.showFrameCount) {
            this.frameCountSprite = game.add.text(32, 32, 'fps: ?');
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
                    this.frameCountSprite.setText('fps: ' + this.frameCount);
                }
                this.frameCount=1;
            }
        }
    },
};

