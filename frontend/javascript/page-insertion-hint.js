var PageInsertionHint = {
  label: 'Insert page here',
  urlParameter: 'pageInsertionHint',
  textSprite: null,
  shadowSprite: null,
  time: 0,
  bottomOffset: 4 * window.devicePixelRatio,
  maxJumpHeight: 64 * window.devicePixelRatio,
  jumpLength: 800, // in ms
  jumpsPerSeries: 5,
  fontStyle: {
    fontSize: Math.ceil(32 * window.devicePixelRatio).toString() + 'px',
  },

  init: function() {
    if (getUrlParameterBoolean(this.urlParameter, false)) {
      this.setVisible();
    }
  },

  createSprite: function() {
    var text = localize('↓↓↓ Insert coloring pages below ↓↓↓');
    var sprite = game.add.text(0, 0, text, this.fontStyle);
    sprite.setOrigin(0.5, 1);
    sprite.depth = 999999;
    return sprite;
  },

  destroySprite: function(sprite) {
    if (sprite != null) {
      sprite.destroy();
    }
    return null;
  },

  setVisible: function() {
    setUrlParameterBoolean(this.urlParameter, true);
    if (this.textSprite == null) {
      this.textSprite = this.createSprite();
    }

    if (this.shadowSprite == null) {
      this.shadowSprite = this.createSprite();
      this.shadowSprite.setColor('#888888');
      this.shadowSprite.depth -= 1;
    }
    this.reposition();
  },

  setInvisible: function() {
    setUrlParameterBoolean(this.urlParameter, false);

    this.textSprite = this.destroySprite(this.textSprite);
    this.shadowSprite = this.destroySprite(this.shadowSprite);
  },

  reposition: function() {
    if (this.textSprite != null) {
      this.textSprite.x = scanariumConfig.width / 2;

      var period1 = this.jumpLength;
      var jumpPhase = (this.time % period1) / period1;

      var period2 = this.jumpsPerSeries * period1;
      var jumpHeight = this.maxJumpHeight * Math.cos( (this.time % period2) / period2 * Math.PI / 2);

      this.textSprite.y = scanariumConfig.height - this.bottomOffset - Math.sin(jumpPhase * Math.PI) * jumpHeight;

      if (this.shadowSprite != null) {
        this.shadowSprite.x = this.textSprite.x + 2;
        this.shadowSprite.y = this.textSprite.y + 2;
      }
    }
  },

  update: function(time, delta, lastTime) {
    this.time = time;
    this.reposition();
  },
};
LayoutManager.register(PageInsertionHint.reposition);
