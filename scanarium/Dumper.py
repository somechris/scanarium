import json
import os
import tempfile

JSON_DUMP_ARGS = {'indent': 2, 'sort_keys': True}


class Dumper(object):
    def dump_json_string(self, data):
        return json.dumps(data, **JSON_DUMP_ARGS)

    def dump_json(self, file, data):
        dir = os.path.dirname(file)
        os.makedirs(dir, exist_ok=True)
        tmp_file = tempfile.NamedTemporaryFile(mode='w+', dir=dir,
                                               delete=False)
        try:
            json.dump(data, tmp_file, **JSON_DUMP_ARGS)
        finally:
            tmp_file.close()
        os.replace(tmp_file.name, file)
