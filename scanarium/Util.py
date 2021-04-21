import datetime
import logging
import os

logger = logging.getLogger(__name__)


def file_needs_update(destination, sources, force=False):
    ret = True
    if os.path.isfile(destination) and not force:
        ret = any(os.stat(destination).st_mtime < os.stat(source).st_mtime
                  for source in sources)
    return ret


def generate_thumbnail(scanarium, dir, file, force, shave=True, erode=False):
    source = os.path.join(dir, file)
    target = os.path.join(dir, file.rsplit('.', 1)[0] + '-thumb.jpg')

    if file_needs_update(target, [source], force):
        command = [scanarium.get_config('programs', 'convert'), source]
        if shave:
            command += ['-shave', '20%']
        if erode:
            command += ['-morphology', 'Erode', 'Octagon']
        command += [
            '-resize', '150x100',
            '-background', 'white',
            '-flatten',
            target
        ]
        scanarium.run(command)


def get_log_filename(scanarium, name):
    now = datetime.datetime.now()
    date_dir = now.strftime(os.path.join('%Y', '%m', '%d'))
    full_dir = os.path.join(scanarium.get_log_dir_abs(), date_dir)
    os.makedirs(full_dir, exist_ok=True)

    full_file = os.path.join(full_dir, now.strftime('%H.%M.%S.%f-') + name)
    return full_file


class Util(object):
    def __init__(self, scanarium):
        self._scanarium = scanarium

    def generate_thumbnail(self, scanarium, dir, file, force, shave=True,
                           erode=False):
        return generate_thumbnail(scanarium, dir, file, force, shave, erode)

    def file_needs_update(self, destination, sources, force=False):
        return file_needs_update(destination, sources, force)

    def get_log_filename(self, name):
        return get_log_filename(self._scanarium, name)
