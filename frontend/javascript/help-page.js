var HelpPage = {
    sprites: null,
    width: 100,
    height: 100,
    keys: [
        {key: '---key---', description: '---description---'},
        {key: '?', description: 'Show/hide this help page'},
        {key: 'c', description: 'Show/hide frame counter'},
        {key: 'f', description: 'Switch to fullscreen mode'},
        {key: 'h', description: 'Show/hide this help page'},
        {key: 'm', description: 'Add another random actor'},
        {key: 'n', description: 'Delete all your scanned actors'},
        {key: 'p', description: 'Pause/Resume'},
        {key: 'r', description: 'Reindex actors'},
        {key: 's', description: 'Show camera source image'},
        {key: ' ', description: 'Scan image'},
    ],

    generateSprites: function() {
        var ret = [];
        //var graphics = game.make.graphics({x:0, y:0, add:false});

        var x = this.width / 20;
        var y = this.height / 20;
        var width = this.width * 18 / 20;
        var height = this.height * 18 / 20;

        var graphics = game.add.graphics(0,0);
        graphics.lineStyle(1, 0xffffff, 1);
        graphics.fillStyle(0x808080, 0.7);
        graphics.fillRect(0, 0, width, height);

        if (game.textures.exists('help_page')) {
            game.textures.remove('help_page');
        }
        graphics.generateTexture('help_page', width, height);
        graphics.destroy();

        var background = game.add.image(x, y, 'help_page');
        background.setOrigin(0,0);

        var caption = game.add.text(x+width, y+height, localize('Help Page'));
        caption.x = x + width/2 - caption.width/2;
        caption.y = y + caption.height;

        var ret = [background, caption];

        var keys = this.keys;

        this.keys.forEach(function (key_spec, index) {
            var key = localize_parameter('event_name', key_spec['key'])
            var description = localize(key_spec['description'])

            var textY = y + caption.height*(index + 4);

            var text = game.add.text(0, textY, key);
            text.x = x + width/2 - text.width - width / 80;
            ret.push(text);

            text = game.add.text(0, textY, description);
            text.x = x + width/2 + width / 80;
            ret.push(text);
        });

        ret.forEach(function (sprite, index) {
            bringToFront(sprite);
        });


        return ret;
    },

    isVisible: function() {
      return this.sprites != null;
    },

    toggleVisibility: function() {
        if (HelpPage.isVisible()) {
            HelpPage.sprites.forEach(function (sprite, index) {
                sprite.destroy();
            });
            HelpPage.sprites = null;
        } else {
            HelpPage.sprites = HelpPage.generateSprites();
        }
    },

    resize: function(width, height) {
      HelpPage.width = width;
      HelpPage.height = height;
      if (HelpPage.isVisible()) {
          HelpPage.toggleVisibility();
          HelpPage.toggleVisibility();
      }
    }
};
LayoutManager.register(HelpPage.resize);

