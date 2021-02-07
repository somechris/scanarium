var degToRadian = 2 * Math.PI / 360;

// Reference is 1920x1080 monitor
var refToScreen = 1;
var screenToRef = 1;
LayoutManager.register(function(width, height) {
  refToScreen = Math.max(width, height) / 1920;
  screenToRef = 1 / refToScreen;
});

function scaleBetween(min, max, scale) {
    return (max - min) * scale + min;
}

function randomBetween(min, max) {
    return scaleBetween(min, max, Math.random());
}

function tunnel(value, min, max) {
    return Math.max(Math.min(value, max), min);
}

