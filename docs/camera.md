# Camera

[Documentation Index](index.md)

Pretty-much any camera that you can hook up with your computer and get
video out, should do.

During development, we used anything from an cheap, old (around 2007) Logitech
QuickCam E2500 which provides only about VGA-resolution of 640x472 up to Android
phones with 12-megapixel cameras and proper photo cameras. They all worked just
fine.

Colors were more vibrant with this or more dull with that camera. But all were
decent enough for the low requirements of Scanarium.

## Working without a camera

If you do not have a camera at hand, but have some other way to get images into
the computer that's fine too.

Instead, of using a `source` that starts with `cam:` in the `[scan]' section of
`conf/scanarium.conf`, simply set `source` to some absolute file name. Then,
scanning considers the picture at this path.

You can for example have an email address that stores image attachments to this
path and therby allow users to mail in pictures to your Scanarium instance
(E.g.: at a show booth).

[Documentation Index](index.md)
