#!/usr/bin/env python3

import os
import locale
import logging
import sys
import xml.etree.ElementTree as ET
import qrcode

SCANARIUM_DIR_ABS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SCANARIUM_DIR_ABS)
from scanarium import Scanarium, ScanariumError
del sys.path[0]

logger = logging.getLogger(__name__)


def run_inkscape(scanarium, arguments):
    command = [
        scanarium.get_config('programs', 'inkscape'),
        '--without-gui',
    ]
    command += arguments
    return scanarium.run(command)


def assert_directory(dir):
    if not os.path.isdir(dir):
        raise ScanariumError('E_NO_DIR', 'Is not a directory "{file_name}"',
                             {'file_name': dir})


def get_svg_contour_rect_stroke_width(tree):
    stroke_width = 0
    try:
        path = './/{http://www.w3.org/2000/svg}rect[@id="contour"]'
        contour = tree.find(path)
        for setting in contour.attrib.get('style', '').split(';'):
            k_raw, v_raw = setting.split(':', 1)
            if k_raw.strip() == 'stroke-width':
                stroke_width = float(v_raw.strip())
    except Exception:
        logging.exception('Failed to parse "stroke-width"')

    return stroke_width


def get_svg_contour_rect_area(scanarium, svg_path):
    # We want to determine the white inner area of the rect with id
    # `contour` in user coordinates. Ideally, Inkscape would allow to access
    # that directly. However, its `--query*` arguments only allow to get the
    # rect's /outer/ dimensions. But we need the rect's inner dimensions
    # (without border). So we have to compute that manually by moving the
    # rect's stroke-width inwards.
    #
    # (At this point we do not make up for scalings/rotations in the document
    # tree above the rect.)

    tree = ET.parse(svg_path)
    stroke_width = get_svg_contour_rect_stroke_width(tree)

    inkscape_args = [
        '--query-all',
        svg_path,
    ]

    x = None
    y = None
    width = None
    height = None
    element_sizes = run_inkscape(scanarium, inkscape_args).split('\n')
    for element_size in element_sizes:
        if x is None or element_size.startswith('contour,'):
            # We're at either the first element (ie.: page), or the contour
            x, y, width, height = map(float, element_size.split(',')[1:])

    # Now x, y, width, height denote the outer dimensions of the relevant
    # rect/page

    return locale.format_string('%f:%f:%f:%f', (
        (x + stroke_width),
        (y + stroke_width),
        (x + width - stroke_width),
        (y + height - stroke_width),
    ))


def generate_adapted_mask_source(scanarium, source, target):
    offset = scanarium.get_config('mask', 'stroke_offset', 'float')
    color = scanarium.get_config('mask', 'stroke_color', allow_empty=True)

    def adapt_style_element(style_element):
        if ':' in style_element:
            key, value = [s.strip() for s in style_element.split(':', 1)]
            new_value = value

            if offset and key == 'stroke-width':
                new_value = float(value) + offset
            elif color and key == 'stroke':
                new_value = color

            if value != new_value:
                style_element = f'{key}:{new_value}'

        return style_element

    def adapt_style(style):
        return ';'.join([adapt_style_element(style_element)
                         for style_element in style.split(';')])

    tree = ET.parse(source)
    for element in tree.findall('.//*[@id="Mask"]//'):
        style = element.get('style')
        if style:
            element.set('style', adapt_style(style))
    tree.write(target)


def get_mask_name(dir, file, suffix='png'):
    basename = file.rsplit('.', 1)[0]
    return os.path.join(dir, f'{basename}-mask.{suffix}')


def generate_mask(scanarium, dir, file, force):
    source = os.path.join(dir, file)
    adapted_source = get_mask_name(dir, file, 'svg')
    target = get_mask_name(dir, file)

    if not os.path.isfile(source):
        raise ScanariumError('SE_SCAN_NO_SOURCE_FOR_MASK',
                             'Failed to find source file {source_file} for '
                             'generating mask {target_file}',
                             {'source_file': source, 'target_file': target})

    if file_needs_update(adapted_source, [source], force):
        generate_adapted_mask_source(scanarium, source, adapted_source)

    if file_needs_update(target, [adapted_source], force):
        contour_area = get_svg_contour_rect_area(scanarium, source)
        inkscape_args = [
            '--export-id=Mask',
            '--export-id-only',
            f'--export-area={contour_area}',
            '--export-background=black',
            '--export-png=%s' % (target),
            adapted_source,
        ]
        run_inkscape(scanarium, inkscape_args)


def get_thumbnail_name(dir, file):
    basename = file.rsplit('.', 1)[0]
    return os.path.join(dir, basename + '-thumb.jpg')


def generate_thumbnail(scanarium, dir, file, force, shave=True, erode=False):
    source = os.path.join(dir, file)
    target = get_thumbnail_name(dir, file)

    if file_needs_update(target, [source], force):
        command = [scanarium.get_config('programs', 'convert'), source]
        if shave:
            command += ['-shave', '20%']
        if erode:
            command += ['-morphology', 'Erode', 'Octagon']
        command += ['-resize', '150x100', target]
        scanarium.run(command)


def generate_pdf(scanarium, dir, file, force):
    source = os.path.join(dir, file)
    target = os.path.join(dir, file.rsplit('.', 1)[0] + '.pdf')
    if file_needs_update(target, [source], force):
        inkscape_args = [
            '--export-area-page',
            '--export-pdf=%s' % (target),
            source,
        ]

        run_inkscape(scanarium, inkscape_args)


def register_svg_namespaces():
    namespaces = {
        '': 'http://www.w3.org/2000/svg',
        'cc': 'http://creativecommons.org/ns#',
        'dc': 'http://purl.org/dc/elements/1.1/',
        'inkscape': 'http://www.inkscape.org/namespaces/inkscape',
        'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        'sodipodi': 'http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd',
        'svg': 'http://www.w3.org/2000/svg',
        'xlink': 'http://www.w3.org/1999/xlink',
    }
    for k, v in namespaces.items():
        ET.register_namespace(k, v)


def file_needs_update(destination, sources, force=False):
    ret = True
    if os.path.isfile(destination) and not force:
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

    element.tag = '{http://www.w3.org/2000/svg}path'
    element.set('d', get_qr_path_string(x, y, x_unit, y_unit, data))

    for attrib in [
        "x",
        "y",
        "width",
        "height",
        "qr-pixel",
    ]:
        del(element.attrib[attrib])


def filter_svg_tree(tree, command, parameter, localizer, command_label,
                    parameter_label):
    def localize_parameter_with_alternative(key, value, alternative_keys=[]):
        ret = localizer.localize_parameter(key, value)
        for alternative_key in alternative_keys:
            if ret == value:
                ret = localizer.localize_parameter(alternative_key, ret)
        return ret

    localized_command = localize_parameter_with_alternative(
        'command_name', command, ['scene_name'])
    localized_parameter = localize_parameter_with_alternative(
        'parameter_name', parameter, ['actor_name', 'scene_name'])

    localized_command_label = localizer.localize_parameter(
        'command_label', command_label)
    localized_parameter_label = localizer.localize_parameter(
        'parameter_label', parameter_label)

    template_parameters = {
        'actor_name': localized_parameter,
        'command_label': localized_command_label,
        'command_name': localized_command,
        'command_name_raw': command,
        'parameter_label': localized_parameter_label,
        'parameter_name': localized_parameter,
        'parameter_name_raw': parameter,
        'scene_name': localized_command,
    }

    def filter_text(text):
        if text is not None:
            text = localizer.localize(text, template_parameters)
        return text

    for element in tree.iter():
        element.text = filter_text(element.text)
        element.tail = filter_text(element.tail)
        for key in element.keys():
            element.set(key, filter_text(element.get(key)))

    for qr_element in list(tree.iter("{http://www.w3.org/2000/svg}rect")):
        qr_pixel = qr_element.attrib.get('qr-pixel', None)
        if qr_pixel is not None:
            if qr_pixel == command_label:
                expand_qr_pixel_to_qr_code(
                    qr_element, '%s:%s' % (command, parameter))
            else:
                # We want to remove this qr-pixel, as it does not match the
                # needed type. But as it might be linked to other elements, we
                # instead make it invisible to avoid messing with the layout.
                #
                # As setting `visibility` does not seem to do the trick (at
                # least in Inkscape 0.92.3), we instead set opacity. This works
                # reliably in Inkscape.
                qr_element.set('style', 'opacity:0')


def append_svg_layers(base, addition):
    root = base.getroot()
    for layer in addition.findall('./{http://www.w3.org/2000/svg}g'):
        root.append(layer)


def generate_full_svg(scanarium, dir, command, parameter, localizer,
                      command_label, parameter_label, force,
                      extra_decoration_name):
    undecorated_name = os.path.join(dir, parameter + '-undecorated.svg')
    decoration_name = os.path.join(scanarium.get_config_dir_abs(),
                                   'decoration.svg')
    full_name = os.path.join(dir, parameter + '.svg')
    sources = [undecorated_name, decoration_name]
    if extra_decoration_name:
        sources.append(extra_decoration_name)
    if file_needs_update(full_name, sources, force):
        register_svg_namespaces()
        tree = ET.parse(undecorated_name)
        append_svg_layers(tree, ET.parse(decoration_name))
        if extra_decoration_name:
            append_svg_layers(tree, ET.parse(extra_decoration_name))
        filter_svg_tree(tree, command, parameter, localizer, command_label,
                        parameter_label)
        tree.write(full_name)


def regenerate_static_content_command_parameter(
        scanarium, dir, command, parameter, is_actor, localizer, force,
        extra_decoration_name):
    command_label = 'scene' if is_actor else 'command'
    parameter_label = 'actor' if is_actor else 'parameter'
    logging.debug(f'Regenerating content for {command_label} "{command}", '
                  f'{parameter_label} "{parameter}" ...')

    assert_directory(dir)
    full_svg_name = parameter + '.svg'
    generate_full_svg(scanarium, dir, command, parameter, localizer,
                      command_label, parameter_label, force,
                      extra_decoration_name)
    generate_pdf(scanarium, dir, full_svg_name, force)

    if is_actor:
        generate_mask(scanarium, dir, full_svg_name, force)
        generate_thumbnail(scanarium, dir, full_svg_name, force, shave=False,
                           erode=True)


def regenerate_static_content_command_parameters(
        scanarium, dir, command, parameter, is_actor, localizer, force,
        extra_decoration_name):
    parameters = os.listdir(dir) if parameter is None else [parameter]
    parameters.sort()
    for parameter in parameters:
        parameter_dir = os.path.join(dir, parameter)
        if os.path.isdir(parameter_dir):
            regenerate_static_content_command_parameter(
                scanarium, parameter_dir, command, parameter, is_actor,
                localizer, force, extra_decoration_name)


def regenerate_static_content_commands(
        scanarium, dir, command, parameter, is_actor, localizer, force):
    if os.path.isdir(dir):
        commands = os.listdir(dir) if command is None else [command]
        commands.sort()
        for command in commands:
            command_dir = os.path.join(dir, command)
            extra_decoration_name = os.path.join(
                command_dir, 'extra-decoration.svg')
            if not os.path.isfile(extra_decoration_name):
                extra_decoration_name = None
            if is_actor:
                command_dir = os.path.join(command_dir, 'actors')
            if os.path.isdir(command_dir):
                regenerate_static_content_command_parameters(
                    scanarium, command_dir, command, parameter, is_actor,
                    localizer, force, extra_decoration_name)


def regenerate_static_content(scanarium, command, parameter, localizer, force):
    for d in [
        {'dir': scanarium.get_commands_dir_abs(), 'is_actor': False},
        {'dir': scanarium.get_scenes_dir_abs(), 'is_actor': True},
    ]:
        regenerate_static_content_commands(
            scanarium, d['dir'], command, parameter, d['is_actor'], localizer,
            force)


def register_arguments(scanarium, parser):
    parser.add_argument('--language',
                        help='Localize for the given language '
                        '(E.g.: \'de\' for German)')
    parser.add_argument('--force',
                        help='Regenerate all files, even if they are not'
                        'stale',
                        action='store_true')
    parser.add_argument('COMMAND', nargs='?',
                        help='Regenerate only the given command/scene')
    parser.add_argument('PARAMETER', nargs='?',
                        help='Regenerate only the given parameter/actor')


if __name__ == "__main__":
    scanarium = Scanarium()
    args = scanarium.handle_arguments('Regenerates all static content',
                                      register_arguments)
    scanarium.call_guarded(
        regenerate_static_content, args.COMMAND, args.PARAMETER,
        scanarium.get_localizer(args.language), args.force)
