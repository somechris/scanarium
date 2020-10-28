#!/usr/bin/env python3

import os
import logging
import sys
import xml.etree.ElementTree as ET
import qrcode

SCANARIUM_DIR_ABS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SCANARIUM_DIR_ABS)
from common import Scanarium, ScanariumError
del sys.path[0]

logger = logging.getLogger(__name__)


def assert_directory(dir):
    if not os.path.isdir(dir):
        raise ScanariumError('E_NO_DIR', 'Is not a directory "%s"' % dir)


def get_thumbnail_name(dir, file):
    basename = file.rsplit('.', 1)[0]
    return os.path.join(dir, basename + '-thumb.jpg')


def generate_thumbnail(scanarium, dir, file, shave=True, erode=False):
    source = os.path.join(dir, file)
    target = get_thumbnail_name(dir, file)
    command = [scanarium.get_config('programs', 'convert'), source]
    if shave:
        command += ['-shave', '20%']
    if erode:
        command += ['-morphology', 'Erode', 'Octagon']
    command += ['-resize', '150x100', target]
    scanarium.run(command)


def generate_pdf(scanarium, dir, file):
    source = os.path.join(dir, file)
    target = os.path.join(dir, file.rsplit('.', 1)[0] + '.pdf')
    command = [
        scanarium.get_config('programs', 'inkscape'),
        '--export-area-page',
        '--export-pdf=%s' % (target),
        source,
    ]

    scanarium.run(command)


def register_svg_namespaces():
    namespaces = {
        'dc': 'http://purl.org/dc/elements/1.1/',
        'cc': 'http://creativecommons.org/ns#',
        'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        'svg': 'http://www.w3.org/2000/svg',
        '': 'http://www.w3.org/2000/svg',
        'sodipodi': 'http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd',
        'inkscape': 'http://www.inkscape.org/namespaces/inkscape',
    }
    for k, v in namespaces.items():
        ET.register_namespace(k, v)


def file_needs_update(destination, sources):
    ret = True
    if os.path.isfile(destination):
        ret = any(os.stat(destination).st_mtime < os.stat(source).st_mtime
                  for source in sources)
    return ret


def get_qr_path_string(x, y, x_unit, y_unit, data):
    ret = ''

    # While qrcode allows to generate an SVG path element through
    # qrcode.image.svg.SvgPathImage, its's interface is not a close match
    # here. Also the unit setting is weird as dimensions get unconditionally
    # divided by 10. And finally, Python's qrcode libraries are not too active
    # these days, so we would not want to tie us too closely to any of
    # them. So we do the image -> svg transformation manually, as it's simple
    # enough, gives us more flexibility and untangles us from qrcode
    # internals.
    data_image = qrcode.make(data, box_size=1, border=0,
                             error_correction=qrcode.constants.ERROR_CORRECT_L)
    width = data_image.width
    height = data_image.height
    dot = f'h {x_unit:f} v {y_unit:f} h {-x_unit:f} Z'
    for j in range(0, height):
        for i in range(0, width):
            if data_image.getpixel((i, j)) == 0:
                ret += f'M {(x+i*x_unit):f} {(y-(height-j-1)*y_unit):f} {dot} '

    return ret


def expand_qr_pixel_to_qr_code(element, data):
    x = float(element.get("x"))
    y = float(element.get("y"))
    x_unit = float(element.get("width"))
    y_unit = float(element.get("height"))

    element.tag = 'path'
    element.set('d', get_qr_path_string(x, y, x_unit, y_unit, data))

    for attrib in [
        "x",
        "y",
        "width",
        "height",
        "qr-pixel",
    ]:
        del(element.attrib[attrib])


def filter_svg_tree(tree, scene, actor):
    text_replacements = {
        '{ACTOR}': actor,
        '{SCENE}': scene,
    }

    def filter_text(text):
        if text is not None:
            for k, v in text_replacements.items():
                text = text.replace(k, v)
        return text

    for element in tree.iter():
        element.text = filter_text(element.text)
        element.tail = filter_text(element.tail)

    for qr_element in list(tree.iter("{http://www.w3.org/2000/svg}rect")):
        if qr_element.attrib.get('qr-pixel', 'false') == 'true':
            expand_qr_pixel_to_qr_code(qr_element, '%s:%s' % (scene, actor))


def append_svg_layers(base, addition):
    root = base.getroot()
    for layer in addition.findall('./{http://www.w3.org/2000/svg}g'):
        root.append(layer)


def generate_full_svg(scanarium, dir, scene, actor):
    undecorated_name = os.path.join(dir, actor + '-undecorated.svg')
    decoration_name = os.path.join(scanarium.get_config_dir_abs(),
                                   'actor-decoration.svg')
    full_name = os.path.join(dir, actor + '.svg')
    if file_needs_update(full_name, [undecorated_name, decoration_name]):
        register_svg_namespaces()
        tree = ET.parse(undecorated_name)
        append_svg_layers(tree, ET.parse(decoration_name))
        filter_svg_tree(tree, scene, actor)
        tree.write(full_name)


def regenerate_static_content_actor(scanarium, scene, actor):
    logging.debug(
        f'Regenerating content for scene "{scene}", actor "{actor}" ...')
    scenes_dir = scanarium.get_scenes_dir_abs()
    actor_dir = os.path.join(scenes_dir, scene, 'actors', actor)
    assert_directory(actor_dir)
    generate_full_svg(scanarium, actor_dir, scene, actor)
    generate_thumbnail(scanarium, actor_dir, actor + '.svg', shave=False,
                       erode=True)
    generate_pdf(scanarium, actor_dir, actor + '.svg')


def regenerate_static_content_scene(scanarium, scene, actor=None):
    scenes_dir = scanarium.get_scenes_dir_abs()
    actors_dir = os.path.join(scenes_dir, scene, 'actors')

    assert_directory(actors_dir)

    actors = os.listdir(actors_dir) if actor is None else [actor]
    for actor in actors:
        regenerate_static_content_actor(scanarium, scene, actor)


def regenerate_static_content(scanarium, scene=None, actor=None):
    scenes_dir = scanarium.get_scenes_dir_abs()

    assert_directory(scenes_dir)

    scenes = os.listdir(scenes_dir) if scene is None else [scene]
    for scene in scenes:
        regenerate_static_content_scene(scanarium, scene, actor)


def register_arguments(parser):
    parser.add_argument('SCENE', nargs='?',
                        help='Regenerate only scene SCENE')
    parser.add_argument('ACTOR', nargs='?',
                        help='Regenerate only actor ACTOR')


if __name__ == "__main__":
    scanarium = Scanarium()
    args = scanarium.handle_arguments('Regenerates all static content',
                                      register_arguments)
    scanarium.call_guarded(regenerate_static_content, args.SCENE, args.ACTOR)
