# Installation / Quick-start guide

[Documentation Index](docs/index.md)

Table of contents

1. [Software setup](#software-setup)
1. [Camera setup](#camera-setup)
1. [Coloring pages](#coloring-pages)



## Software setup

First, install `inkscape`, `imagemagick`, Python >= 3.6, `opencv-python`,
`numpy`, and `pyzbar`. For example on Linux Mint Tricia, run:

```
sudo apt-get install inkscape imagemagick python3-pip python3-setuptools
pip3 install opencv-contrib-python pyzbar
```

Then run the `setup.sh` script to download the [Phaser](https://phaser.io/) and
initialize the configuration for you:

```
./setup.sh
```

Edit `conf/scanarium.conf` and adjust to your liking:

```
nano conf/scanarium.conf
```

Launch the demo server:

```
./run-demo-server.sh
```

And finally point your browser to the default URL at http://localhost:8080/

Enjoy!



## Camera setup

See [docs/camera-setup.md](docs/camera-setup.md)



## Coloring pages

The coloring pages are stored in the `scenes` directory and grouped by scene, as all actor code is.
For example for the `space` (default) scene:

* [Simple Rocket](scenes/space/actors/SimpleRocket/SimpleRocket.svg)
* [Flying Saucer](scenes/space/actors/FlyingSaucer/FlyingSaucer.svg)

Thes files are SVGs. You can for example print them using `Inkscape`.



[Documentation Index](docs/index.md)
