import os
import subprocess
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
