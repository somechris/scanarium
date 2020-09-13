var BasicFish = {
    direction: -1,
    game: null,
    sprite: null,
    birth: null,
    birth: null,
    imgWidth: 891,
    imgHeight: 630,
    scaleMin: 1/9,
    scaleMax: 1/9,
    scale: 1,
    targetDirectionMin: 135 * degToRadian,
    targetDirectionMax: 225 * degToRadian,
    targetDirection: 180 * degToRadian,
    targetDirectionEpsilon: degToRadian,
    direction: 180 * degToRadian,
    speed: 1,
    nextMotionPlanningUpdate: 0,

    init: function(game, x, y) {
        this.game = game;

        var sprite = game.physics.add.sprite(x, y, 'fish');
        this.scale = (this.scaleMax-this.scaleMin)*Math.random() + this.scaleMin;
        var width = this.imgWidth * this.scale;
        var height = this.imgHeight * this.scale;
        sprite.setSize(width, height);
        sprite.setDisplaySize(width, height);
        sprite.setOrigin(0,0);
        sprite.setCollideWorldBounds(false);
        sprite.setVelocityX(-(Math.random()*20+10));

        this.sprite = sprite;
        this.nextMotionPlanningUpdate = 0;
    },

    update: function(time, delta) {
        if (time > this.nextMotionPlanningUpdate) {
            this.targetDirection += (Math.random() - 0.5) * 10 / this.scale * degToRadian;
        }
        var maxDirectionChange = degToRadian;
        if (this.direction < this.targetDirection - this.targetDirectionEpsilon) {
            var speed = 20;
            console.log('update: ' + this.scale + '   ' + direction);
            this.sprite.setVelocityX(speed * Math.cos(direction));
            this.sprite.setVelocityY(-speed * Math.sin(direction));

            this.nextVelocityUpdate = time + Math.random() * 1000 * this.scale + 100/this.scale   ;

            console.log('update: ' + this.scale + '   ' + this.nextVelocityUpdate);
        }


        if (this.birth == null) {
            this.birth = time;
        }
/*     if (time - this.birth > 1000) {
       addFish(this.game);
     }*/
  },
};
