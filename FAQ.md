# Frequently Asked Questions

## Q: Going into fullscreen does not resize Scanarium to cover the whole page.

Yes. This is a known issue. To get a proper fullscreen Scanarium, first go into
fullscreen mode by pressing `F11`. Then reload the page by pressing `F5`. This
should give you a fullscreen Scanarium that covers the whole display.

During development Phaser 3.11 crashed Scanarium a few times when implementing
resizing after going into full-screen. With current Phaser 3.24 the crashing
would be resolved and fullscreen reliably resizes the game. Phaser 3.24 however
seems to render the rocket thrusts for the space scene flaky. So we do not
upgrade the used Phaser until we got to the bottom of the thrust issue.
