class PhotoWomanAndChild extends Photo {
    constructor(x, y, flavor) {
        const widthMm = 100; // mm
        super(flavor, x, y, widthMm);
    }
}

ScActorManager.registerActor(PhotoWomanAndChild);
