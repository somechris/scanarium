class PhotoRacingCar extends Photo {
    constructor(x, y, flavor) {
        const widthMm = 150; // mm
        super(flavor, x, y, widthMm);
    }
}

ScActorManager.registerActor(PhotoRacingCar);
