import logging
import os

logger = logging.getLogger(__name__)


class Indexer(object):
    def __init__(self, dynamic_dir, scenes_dir, dumper):
        super(Indexer, self).__init__()
        self._dynamic_dir = dynamic_dir
        self._scenes_dir = scenes_dir
        self._dumper = dumper

    def reindex_actors_for_scene(self, scene):
        dyn_scene_dir = os.path.join(self._dynamic_dir, 'scenes', scene)
        stat_scene_dir = os.path.join(self._scenes_dir, scene)
        actors_data = {
            'actors': {},
        }
        actors_latest_data = {
            'actors': {},
        }
        stat_actors_dir = os.path.join(stat_scene_dir, 'actors')
        if os.path.isdir(stat_actors_dir):
            for actor in os.listdir(stat_actors_dir):
                stat_actor_dir = os.path.join(stat_actors_dir, actor)
                if os.path.isdir(stat_actor_dir):
                    logging.debug(
                        f'Reindexing scene "{scene}" actor "{actor}" ...')
                    flavor_files = []
                    dyn_actor_dir = dyn_scene_dir + \
                        stat_actor_dir[len(stat_scene_dir):]
                    if os.path.isdir(dyn_actor_dir):
                        for flavor in os.listdir(dyn_actor_dir):
                            flavor_file = os.path.join(dyn_actor_dir, flavor)
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

        file = os.path.join(dyn_scene_dir, 'actors.json')
        self._dumper.dump_json(file, actors_data)
        file = os.path.join(dyn_scene_dir, 'actors-latest.json')
        self._dumper.dump_json(file, actors_latest_data)
