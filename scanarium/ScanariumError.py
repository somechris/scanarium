class ScanariumError(RuntimeError):
    def __init__(self, code, message, *args, **kwargs):
        super(ScanariumError, self).__init__(*args, **kwargs)
        self.code = code
        self.message = message
