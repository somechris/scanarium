import time
import os
import subprocess
import json
import re
import sys
import tempfile
import traceback
import configparser
import cv2

JSON_DUMP_ARGS = {'indent': 2, 'sort_keys': True}

IS_CGI = 'REMOTE_ADDR' in os.environ
if IS_CGI:
    print('Content-Type: application/json')
    print()


class Scanarium(object):
    def __init__(self):
        super(Scanarium, self).__init__()

    def _load_config(self):
        config = configparser.ConfigParser()
        config_dir_abs = self.get_relative_dir_abs('conf')

        config.read(os.path.join(config_dir_abs, 'scanarium.conf.defaults'))

        config_file_abs = os.path.join(config_dir_abs, 'scanarium.conf')
        if os.path.isfile(config_file_abs):
            config.read(config_file_abs)

        return config

    def get_config(self, section=None, key=None, kind='string',
                   allow_empty=False):
        if section is None:
            if key is None:
                try:
                    return self.__config
                except AttributeError:
                    self.__config = self._load_config()
                    return self.__config
            else:
                raise RuntimeError('key, but no section given')
        else:
            config = self.get_config()
            if allow_empty and config.get(section, key) == '':
                return None
            if kind == 'string':
                func = config.get
            elif kind == 'boolean':
                func = config.getboolean
            elif kind == 'int':
                func = config.getint
            elif kind == 'float':
                func = config.getfloat
            else:
                raise RuntimeError('Unknown config value type "%s"' % (kind))
            return func(section, key)

    def get_scanarium_dir_abs(self):
        return os.path.dirname(os.path.abspath(__file__))

    def get_relative_dir_abs(self, relative_dir):
        return os.path.join(self.get_scanarium_dir_abs(), relative_dir)

    def get_backend_dir_abs(self):
        return self.get_relative_dir_abs('backend')

    def get_frontend_dir_abs(self):
        return self.get_relative_dir_abs('frontend')

    def get_frontend_dynamic_dir_abs(self):
        return os.path.join(self.get_frontend_dir_abs(), 'dynamic')

    def get_frontend_cgi_bin_dir_abs(self):
        return os.path.join(self.get_frontend_dir_abs(), 'cgi-bin')

    def get_scenes_dir_abs(self):
        return self.get_relative_dir_abs('scenes')

    def get_dynamic_directory(self):
        dyn_dir = self.get_config('directories', 'dynamic')
        if not os.path.isabs(dyn_dir):
            dyn_dir = os.path.join(self.get_scanarium_dir_abs(), dyn_dir)
        return dyn_dir

    def reindex_actors_for_scene(self, scene):
        scene_dir = os.path.join(self.get_dynamic_directory(), 'scenes', scene)
        actors_data = {
            'actors': {},
        }
        actors_latest_data = {
            'actors': {},
        }
        actors_dir = os.path.join(scene_dir, 'actors')
        if os.path.isdir(actors_dir):
            for actor in os.listdir(actors_dir):
                actor_dir = os.path.join(actors_dir, actor)
                if os.path.isdir(actor_dir):
                    flavor_files = []
                    for flavor in os.listdir(actor_dir):
                        flavor_file = os.path.join(actor_dir, flavor)
                        if os.path.isfile(flavor_file) and \
                                flavor.endswith('.png'):
                            flavor_files.append({
                                'flavor': flavor[:-4],
                                'key': os.stat(flavor_file).st_mtime,
                            })
                    flavor_files.sort(key=lambda f: f['key'], reverse=True)
                    flavors_sorted = [f['flavor'] for f in flavor_files]

                    actors_data['actors'][actor] = flavors_sorted
                    latest = [f for f in flavors_sorted[:10]]
                    actors_latest_data['actors'][actor] = latest

        self.dump_json(os.path.join(scene_dir, 'actors.json'), actors_data)
        self.dump_json(os.path.join(scene_dir, 'actors-latest.json'),
                       actors_latest_data)

    def debug_show_image(self, title, image):
        if self.get_config('general', 'debug', 'boolean'):
            cv2.imshow(title, image)
            cv2.waitKey(0)
            cv2.destroyAllWindows()

    def set_camera_property(self, cap, property, config_key):
        value = self.get_config('scan', config_key, allow_empty=True,
                                kind='int')
        if value is not None:
            cap.set(property, value)

    def get_raw_image(self):
        file_path = self.get_config('scan', 'source')
        if file_path.startswith('cam:'):
            try:
                cam_nr = int(file_path[4:])
            except ValueError:
                raise ScanariumError('SE_VALUE', 'Failed to parse "%s" of '
                                     'source "%s" to number' % (file_path[4:],
                                                                file_path))
            cap = cv2.VideoCapture(cam_nr)

            if not cap.isOpened():
                raise ScanariumError('SE_CAP_NOT_OPEN',
                                     'Failed to open camera %d' % (cam_nr))

            # To avoid having to use external programs for basic
            # camera setup, we set the most basic properties right
            # within Scanarium
            self.set_camera_property(cap, cv2.CAP_PROP_FRAME_WIDTH, 'width')
            self.set_camera_property(cap, cv2.CAP_PROP_FRAME_HEIGHT, 'height')

            ret, image = cap.read()

            delay = self.get_config('scan', 'delay', allow_empty=True,
                                    kind='float')
            if delay:
                time.sleep(delay)
                ret, image = cap.read()

            cap.release()
        else:
            image = cv2.imread(file_path)

        return image

    def undistort_image(self, image):
        ret = image
        param_file = self.get_config('scan', 'calibration_xml_file')
        if param_file:
            try:
                storage = cv2.FileStorage(param_file, cv2.FileStorage_READ)
                cam_matrix = storage.getNode('cameraMatrix').mat()
                dist_coeffs = storage.getNode('dist_coeffs').mat()
            except Exception:
                raise ScanariumError(
                    'SE_LOAD_UNDISTORT',
                    'Failed to load parameters for undistortion from %s'
                    % param_file)

            width, height = image.shape[:2]
            new_camera_matrix, roi = cv2.getOptimalNewCameraMatrix(
                cam_matrix, dist_coeffs, (width, height), 1)

            self.debug_show_image('raw before undistorting', image)
            ret = cv2.undistort(ret, cam_matrix, dist_coeffs, None,
                                new_camera_matrix)
        return ret

    def get_image(self):
        raw = self.get_raw_image()
        return self.undistort_image(raw)

    def dump_json_string(self, data):
        return json.dumps(data, **JSON_DUMP_ARGS)

    def dump_json(self, file, data):
        dir = os.path.dirname(file)
        tmp_file = tempfile.NamedTemporaryFile(mode='w+', dir=dir,
                                               delete=False)
        try:
            json.dump(data, tmp_file, **JSON_DUMP_ARGS)
        finally:
            tmp_file.close()
        os.replace(tmp_file.name, file)

    def run(self, command, check=True, timeout=10):
        try:
            subprocess.run(command, check=check, timeout=timeout)
        except subprocess.TimeoutExpired:
            raise ScanariumError('SE_TIMEOUT', 'The command "%s" did not '
                                 'finish within %d seconds' % (str(command),
                                                               timeout))
        except subprocess.CalledProcessError:
            raise ScanariumError('SE_RETURN_VALUE', 'The command "%s" did '
                                 'not return 0' % (str(command)))

    def set_display(self):
        if IS_CGI:
            display = self.get_config('cgi', 'display')
            if display:
                os.environ['DISPLAY'] = display

    def call_guarded(self, func):
        try:
            caller = traceback.extract_stack()[-2].filename
            if not os.path.isabs(caller):
                caller = os.path.join(os.getcwd(), caller)
            caller = os.path.normpath(caller)
            start = self.get_backend_dir_abs() + os.sep
            if caller.startswith(start):
                caller = caller[len(start):]
            if caller.endswith('.py'):
                caller = caller[:-3]

            if not re.match(r'^[a-zA-Z-]*$', caller):
                raise ScanariumError('SE_CGI_NAME_CHARS',
                                     'Forbidden characters in cgi name')

            if IS_CGI:
                if not self.get_config('cgi:%s' % caller, 'allow', 'boolean'):
                    raise ScanariumError('SE_CGI_FORBIDDEN',
                                         'Calling script as cgi is forbidden')

            self.set_display()

            payload = func(self)
        except:  # noqa: E722
            self.result(payload='Failed', exc_info=sys.exc_info())

        self.result(payload=payload)

    def result(self, payload={}, exc_info=None):
        if exc_info is None:
            error_code = None
            error_message = None
        else:
            if self.get_config('general', 'debug', 'boolean'):
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
            print(self.dump_json_string(capsule))
        else:
            if exc_info is not None:
                print('ERROR: %s' % error_code)
                print(error_message)
                print()
            if payload:
                print(self.dump_json_string(payload))
        sys.exit(0)


class ScanariumError(RuntimeError):
    def __init__(self, code, message, *args, **kwargs):
        super(ScanariumError, self).__init__(*args, **kwargs)
        self.code = code
        self.message = message
