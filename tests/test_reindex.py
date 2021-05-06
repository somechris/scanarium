from .environment import CanaryTestCase


class ReindexCanaryTestCase(CanaryTestCase):
    def run_reindex(self, dir):
        return self.run_cgi(dir, 'reindex')

    def test_ok_no_content(self):
        with self.prepared_environment() as dir:
            self.run_reindex(dir)

            self.assertFileContents([dir, 'dynamic', 'scenes', 'space',
                                     'actors.json'],
                                    {'actors': {}})
            self.assertFileContents([dir, 'dynamic', 'scenes', 'space',
                                     'actors-latest.json'],
                                    {'actors': {}})

    def test_ok_single_actor(self):
        with self.prepared_environment() as dir:
            self.setFile([dir, 'dynamic', 'scenes', 'space', 'actors', 'foo',
                          'bar.png'])

            self.run_reindex(dir)
            self.assertFileContents([dir, 'dynamic', 'scenes', 'space',
                                     'actors.json'],
                                    {'actors': {'foo': ['bar']}})
            self.assertFileContents([dir, 'dynamic', 'scenes', 'space',
                                     'actors-latest.json'],
                                    {'actors': {'foo': ['bar']}})

    def test_ok_multiple_actors(self):
        with self.prepared_environment() as dir:
            self.setFile([dir, 'dynamic', 'scenes', 'space', 'actors', 'foo',
                          'bar.png'], mtime=200)
            self.setFile([dir, 'dynamic', 'scenes', 'space', 'actors', 'foo',
                          'baz.png'], mtime=100)

            self.setFile([dir, 'dynamic', 'scenes', 'space', 'actors', 'quux',
                          'quuux.png'])

            self.run_reindex(dir)
            self.assertFileContents([dir, 'dynamic', 'scenes', 'space',
                                     'actors.json'],
                                    {'actors': {'foo': ['bar', 'baz'],
                                                'quux': ['quuux']}})
            self.assertFileContents([dir, 'dynamic', 'scenes', 'space',
                                     'actors-latest.json'],
                                    {'actors': {'foo': ['bar', 'baz'],
                                                'quux': ['quuux']}})

    def test_ok_mtime_sorting(self):
        with self.prepared_environment() as dir:
            self.setFile([dir, 'dynamic', 'scenes', 'space', 'actors', 'foo',
                          'A.png'], mtime=100)
            self.setFile([dir, 'dynamic', 'scenes', 'space', 'actors', 'foo',
                          'B.png'], mtime=300)
            self.setFile([dir, 'dynamic', 'scenes', 'space', 'actors', 'foo',
                          'C.png'], mtime=200)

            self.run_reindex(dir)
            self.assertFileContents([dir, 'dynamic', 'scenes', 'space',
                                     'actors.json'],
                                    {'actors': {'foo': ['B', 'C', 'A']}})
            self.assertFileContents([dir, 'dynamic', 'scenes', 'space',
                                     'actors-latest.json'],
                                    {'actors': {'foo': ['B', 'C', 'A']}})

    def test_ok_last_cutoff(self):
        with self.prepared_environment() as dir:
            for i in range(11):
                self.setFile([dir, 'dynamic', 'scenes', 'space', 'actors',
                              'foo', f'{i}.png'], mtime=i * 100)

            self.run_reindex(dir)
            expected = {'actors': {'foo': [str(x) for x in range(10, -1, -1)]}}
            self.assertFileContents([dir, 'dynamic', 'scenes', 'space',
                                     'actors.json'], expected)
            expected = {'actors': {'foo': [str(x) for x in range(10, 0, -1)]}}
            self.assertFileContents([dir, 'dynamic', 'scenes', 'space',
                                     'actors-latest.json'], expected)
