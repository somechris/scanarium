class PlanetWithMoon extends PlanetBase {
    constructor(x, y, flavor) {
        var lengthMin = 50;
        var lengthMax = 150;

        const frames = {
            main: {x: 50, y: 0, width: 50, height: 100},
            moon: {x: 0, y: 25, width: 25, height: 50},
        };

        super(flavor, x, y, lengthMin, lengthMax, frames, "main");

        const actor = this.constructor.name;
        const image_name = actor + '-' + flavor;

        var moon = game.add.image(0, 0, image_name, "moon");
        this.moonWidth = moon.width * this.textureScaleFactor;
        this.moonHeight = moon.height * this.textureScaleFactor;
        moon.setSize(this.moonWidth, this.moonHeight);
        moon.setDisplaySize(this.moonWidth, this.moonHeight);

        this.add(moon);
        this.moon = moon;
        this.moonR = randomBetween(this.mainSprite.width, 2*this.mainSprite.width);
        this.moonRYScale = randomBetween(0.2, 0.8);
        this.moonTimeFactor = 0.001 * randomBetween(0.5, 1) * (Math.random() > 0.5 ? 1 : -1);
        this.moonTimeOffset = 2 * Math.PI * Math.random();
        this.moonRotationFactor = randomPlusMinus(0.0002);
    }

    update(time, delta) {
        const moon_time = time * this.moonTimeFactor + this.moonTimeOffset;
        const cos = Math.cos(moon_time);
        const moonX = Math.sin(moon_time) * this.moonR;
        const moonY = cos * this.moonR * (this.moonRYScale + (this.y / scanariumConfig.height - 0.5) * 0.4);
        const scale = 1 + cos * 0.2;
        const moonWidth = this.moonWidth * scale;
        const moonHeight = this.moonHeight * scale;
        const depth = cos > 0 ? 1 : -1;

        this.moon.setSize(moonWidth, moonHeight);
        this.moon.setDisplaySize(moonWidth, moonHeight);

        const oldDepth = this.moon.depth;
        this.moon.setDepth(depth);
        if (oldDepth != depth) {
            // The depth of the moon changed, so we need to re-sort.
            this.sort('depth');
        }

        this.moon.setPosition(moonX, moonY);
        this.moon.rotation = time * this.moonRotationFactor;
    }
}

ScActorManager.registerActor(PlanetWithMoon);
