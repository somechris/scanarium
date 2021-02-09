var DeveloperInformation = {
    sprite: null,
    urlParameter: 'showDeveloperInformation',
    providers: [],

    init: function() {
        if (getUrlParameterBoolean(this.urlParameter, false)) {
            this.toggleVisibility();
        }
    },

    toggleVisibility: function() {
        if (this.sprite) {
            this.sprite.destroy();
            this.sprite = null;
        } else {
            this.sprite = game.add.text(0, 0, 'Developer Information');
            this.sprite.setOrigin(0, 1);
            this.relayout();
        }
        setUrlParameterBoolean(this.urlParameter, this.sprite != null);
    },

    basicInformation: function() {
        return 'scene: ' + scene + ', size: ' + scanariumConfig.width + 'x' + scanariumConfig.height + ', language:' + language;
    },

    update: function(time, delta, lastTime) {
        if (this.sprite) {
            var text = '';
            this.providers.forEach((provider) => {
                if (text.length > 0) {
                   text += '\n';
                }
                text += provider();
            });
            this.sprite.setText(text);
        }
    },

    register: function(provider) {
        this.providers.push(provider);
    },

    relayout: function() {
        if (DeveloperInformation.sprite) {
            DeveloperInformation.sprite.x = 32 * window.devicePixelRatio;
            DeveloperInformation.sprite.y = scanariumConfig.height - 48 * window.devicePixelRatio;
        }
    },
};
DeveloperInformation.register(DeveloperInformation.basicInformation);
LayoutManager.register(DeveloperInformation.relayout);
