# Frequently Asked Questions

## Q: Did you invent it? Who came up with this concept?

There is [much](https://workinman.com/virtual-aquarium-design-museum)
[prior](https://dinoland.nl/en/) [art](https://www.stlouisaquarium.com/)
[in](https://9gag.com/gag/amvxwWo)
[museums](https://digitalmoo.com/products/virtual-aquarium/) around the world
when it comes to coloring and animating. It's not clear, who first allowed to
animate user-generated content and when. But there are many
[groups](https://www.youtube.com/watch?v=-tmd1hjkhIs) that offer this
functionality. And for example [teamLab](https://www.teamlab.art) has
[many](https://www.teamlab.art/w/sketch_ocean/)
[installations](https://borderless.teamlab.art/ew/aquarium/)
[in](https://www.teamlab.art/w/sketch_animals/)
[this](https://www.teamlab.art/w/sketchpeople/)
[spirit](https://www.teamlab.art/w/sketchtown/).

We've not invented it. We're not doing huge installations at museums. We're not
even doing 3D models. But we try to bring it to your living room.



## Q: Going into fullscreen does not resize Scanarium to cover the whole page.

Yes. This is a known issue. To get a proper fullscreen Scanarium, first go into
fullscreen mode by pressing `F11`. Then reload the page by pressing `F5`. This
should give you a fullscreen Scanarium that covers the whole display.

During development Phaser 3.11 crashed Scanarium a few times when implementing
resizing after going into full-screen. With current Phaser 3.24 the crashing
would be resolved and fullscreen reliably resizes the game. Phaser 3.24 however
seems to render the rocket thrusts for the space scene flaky. So we do not
upgrade the used Phaser until we got to the bottom of the thrust issue.
