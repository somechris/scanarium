class InstantPhoto extends Photo {
    constructor(x, y, flavor) {
        const widthMm = 90; // mm
        super(flavor, x, y, widthMm);
    }
}

ScActorManager.registerActor(InstantPhoto);
