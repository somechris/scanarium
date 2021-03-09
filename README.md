# Scanarium

[Documentation Index](docs/index.md)

![](docs/images/bait.gif)

Scanarium takes your filled in coloring pages and lets them come to life, by
animating them in a given set of scenes. Scanarium should be resource-friendly
to run on old hardware, and can be viewed on any modern browser or mobile phone.

[![Scanarium video demo](docs/images/bait-youtube.jpg)](https://www.youtube.com/watch?v=LuFLBiLtP8Y)

## Live Demo

At [https://demo.scanarium.com/](https://demo.scanarium.com/) Scanarium is running
live. Uploading files has been disabled to avoid creepy content. But the site is
good enough to show what you can expect.



## Installation / Quick-start guide

See [INSTALL.md](INSTALL.md)



## Directory structure

```
.
├── backend         -- All backend services (Python)
├── commands        -- Files that trigger commands when scanned
├── conf            -- Configuration files
├── dynamic         -- Dynamic, scanned content (generated by setup.sh)
├── dynamic.sample  -- Some sample content for initial deployment
├── frontend        -- All frontend files (JavaScript)
├── localization    -- Localization files
├── scenes          -- Static data for scenes, actors (i.e. rockets,...) etc.
└── services        -- Auxiliary service (e.g.: Scanning service, webserver)
```



[Documentation Index](docs/index.md)
