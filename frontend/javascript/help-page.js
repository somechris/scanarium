var HelpPage = {
    sprites: null,
    width: 100,
    height: 100,

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

        var mapping = {};
        var header = localize('---Action---');
        mapping[header] = localize('---Description---');

        Object.keys(eventMap).forEach(function (event, index) {
            const description = localize(commands[eventMap[event]].description);
            event = localize_parameter('event_name', event);
            mapping[event] = description;
        });


        Object.keys(mapping).sort((a, b) => {
            const weight = function(x) {
                if (x == header) {
                    return 0;
                }
                return Math.max(x.length, 2) + 1;
            }

            var ret = weight(a) - weight(b);
            if (ret == 0) {
                ret = (a < b) ? -1 : ((a>b) ? 1 : 0);
            }
            return ret;
        }).forEach(function (event, index) {
            var description = mapping[event];

            var textY = y + caption.height*(index + 4);

            var text = game.add.text(0, textY, event);
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

