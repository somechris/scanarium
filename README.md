# Scanarium

![](docs/images/bait.gif)

### Table of contents

1. Installation


## Installation

First, install `inkscape`, Python >= 3.6, `opencv-python`, `numpy`, and
`pyzbar`. For example on Linux Mint, run:

```
sudo apt-get install inkscape
pip3 install opencv-contrib-python
pip3 install pyzbar
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
