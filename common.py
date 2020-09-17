import os
import subprocess
import json
import tempfile
import logging
import logging.config
import configparser
import cv2

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
        cam_nr = int(file_path[4:])
        cap = cv2.VideoCapture(cam_nr)
        ret, image = cap.read()
        cap.release()
    else:
        image = cv2.imread(file_path)

    return image


def run(command, check=True, timeout=10):
    try:
        subprocess.run(command, check=check, timeout=timeout)
    except subprocess.TimeoutExpired:
        return None
    except subprocess.CalledProcessError:
        return None


def get_dynamic_directory():
    dyn_dir = SCANARIUM_CONFIG['directories']['dynamic']
    if not os.path.isabs(dyn_dir):
        dyn_dir = os.path.join(SCANARIUM_DIR_ABS, dyn_dir)
    return dyn_dir


def dump_json(file, data):
    dir = os.path.dirname(file)
    #fd, tmp_file = tempfile.mkstemp(dir=dir)
    tmp_file = tempfile.NamedTemporaryFile(mode='w+', dir=dir, delete=False)
    try:
        json.dump(data, tmp_file, indent=2, sort_keys=True)
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
