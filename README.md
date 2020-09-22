# Scanarium

[Documentation Index](docs/index.md)

![](docs/images/bait.gif)

### Table of contents

1. Installation


## Installation

First, install `inkscape`, Python >= 3.6, `opencv-python`, `numpy`, and
`pyzbar`. For example on Linux Mint Tricia, run:

```
sudo apt-get install inkscape python3-pip python3-setuptools
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

[Documentation Index](docs/index.md)
