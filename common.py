import os
import subprocess
import json
import sys
import tempfile
import traceback
import logging
import logging.config
import configparser
import cv2

JSON_DUMP_ARGS = {'indent': 2, 'sort_keys': True}

IS_CGI = 'REMOTE_ADDR' in os.environ
if IS_CGI:
    import cgi
    print('Content-Type: application/json')
    print()

SCANARIUM_DIR_ABS=os.path.dirname(os.path.abspath(__file__))
CONFIG_DIR_ABS=os.path.join(SCANARIUM_DIR_ABS, 'conf')
CONFIG_FILE_ABS = os.path.join(CONFIG_DIR_ABS, 'scanarium.conf')
BACKEND_DIR_ABS=os.path.join(SCANARIUM_DIR_ABS, 'backend')
FRONTEND_DIR_ABS=os.path.join(SCANARIUM_DIR_ABS, 'frontend')
FRONTEND_DYNAMIC_DIR_ABS=os.path.join(FRONTEND_DIR_ABS, 'dynamic')
FRONTEND_CGI_DIR_ABS=os.path.join(FRONTEND_DIR_ABS, 'cgi-bin')
SCENES_DIR_ABS=os.path.join(SCANARIUM_DIR_ABS, 'scenes')

SCANARIUM_CONFIG={}

def load_config():
    global SCANARIUM_CONFIG
    config = configparser.ConfigParser()
    config.read(os.path.join(CONFIG_DIR_ABS, 'scanarium.conf.defaults'))

    config_file = os.path.join(CONFIG_DIR_ABS, 'scanarium.conf')
    if os.path.isfile(CONFIG_FILE_ABS):
        config.read(CONFIG_FILE_ABS)

    SCANARIUM_CONFIG = config

load_config()
logging.config.fileConfig(SCANARIUM_CONFIG)
logger = logging.getLogger(__name__)

def get_image():
    file_path = SCANARIUM_CONFIG['scan']['source']
    if file_path.startswith('cam:'):
        try:
            cam_nr = int(file_path[4:])
        except ValueError:
            raise ScanariumError('SE_VALUE', 'Failed to parse "%s" of source "%s" to number' % (file_path[4:], file_path))
        cap = cv2.VideoCapture(cam_nr)

        if not cap.isOpened():
            raise ScanariumError('SE_CAP_NOT_OPEN', 'Failed to open camera %d' % (cam_nr))

        ret, image = cap.read()
        cap.release()
    else:
        image = cv2.imread(file_path)

    return image


def run(command, check=True, timeout=10):
    try:
        subprocess.run(command, check=check, timeout=timeout)
    except subprocess.TimeoutExpired:
        raise ScanariumError('SE_TIMEOUT', 'The command "%s" did not finish within %d seconds' % (str(command), timeout))
    except subprocess.CalledProcessError:
        raise ScanariumError('SE_RETURN_VALUE', 'The command "%s" did not return 0' % (str(command)))


def get_dynamic_directory():
    dyn_dir = SCANARIUM_CONFIG['directories']['dynamic']
    if not os.path.isabs(dyn_dir):
        dyn_dir = os.path.join(SCANARIUM_DIR_ABS, dyn_dir)
    return dyn_dir


def dump_json_string(data):
    return json.dumps(data, **JSON_DUMP_ARGS)


def dump_json(file, data):
    dir = os.path.dirname(file)
    #fd, tmp_file = tempfile.mkstemp(dir=dir)
    tmp_file = tempfile.NamedTemporaryFile(mode='w+', dir=dir, delete=False)
    try:
        json.dump(data, tmp_file, **JSON_DUMP_ARGS)
    finally:
        tmp_file.close()
    os.replace(tmp_file.name, file)


def reindex_actors_for_scene(scene):
    scene_dir = os.path.join(get_dynamic_directory(), 'scenes', scene)
    actors_data = {
        'actors': {}
        }
    actors_latest_data = {
        'actors': {}
        }
    actors_dir = os.path.join(scene_dir, 'actors')
    if os.path.isdir(actors_dir):
        for actor in os.listdir(actors_dir):
            actor_dir = os.path.join(actors_dir, actor)
            if os.path.isdir(actor_dir):
                actor_conf = {}
                flavor_files = []
                for flavor in os.listdir(actor_dir):
                    flavor_file = os.path.join(actor_dir, flavor)
                    if os.path.isfile(flavor_file) and flavor.endswith('.png'):
                        flavor_files.append({
                                'flavor': flavor[:-4],
                                'key': os.stat(flavor_file).st_mtime,
                                })
                flavor_files.sort(key=lambda f:f['key'], reverse=True)
                flavors_sorted = [f['flavor'] for f in flavor_files]

                actors_data['actors'][actor] = flavors_sorted
                actors_latest_data['actors'][actor] = [f for f in flavors_sorted[:3]]

    dump_json(os.path.join(scene_dir, 'actors.json'), actors_data)
    dump_json(os.path.join(scene_dir, 'actors-latest.json'), actors_latest_data)


class ScanariumError(RuntimeError):
    def __init__(self, code, message, *args, **kwargs):
        super(ScanariumError, self).__init__(*args, **kwargs)
        self.code = code
        self.message = message


def result(payload={}, exc_info=None):
    if exc_info is None:
        error_code = None
        error_message = None
    else:
        if SCANARIUM_CONFIG.getboolean('general', 'debug'):
            traceback.print_exception(*exc_info)
        if isinstance(exc_info[1], ScanariumError):
            error_code = exc_info[1].code
            error_message = exc_info[1].message
        else:
            error_code = 'SE_UNDEF'
            error_message = 'undefined error'
    if IS_CGI:
        capsule = {
            'payload': payload,
            'is_ok': exc_info is None,
            'error_code': error_code,
            'error_message': error_message,
            }
        print(dump_json_string(capsule))
    else:
        if exc_info is not None:
            print('ERROR: %s' % error_code)
            print(error_message)
            print()
        if payload:
            print(dump_json_string(payload))
    sys.exit(0)


def call_guarded(func):
    try:
        payload = func()
    except:
        result(payload='Failed', exc_info=sys.exc_info())

    result(payload = payload)
