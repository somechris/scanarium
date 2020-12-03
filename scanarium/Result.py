from .ScanariumError import ScanariumError


class Result(object):
    def __init__(self, payload={}, exc_info=None):
        super(Result, self).__init__()
        self.payload = payload
        self.is_ok = exc_info is None

        if exc_info is None:
            self.error_code = None
            self.error_message = None
        else:
            if isinstance(exc_info[1], ScanariumError):
                self.error_code = exc_info[1].code
                self.error_message = exc_info[1].message
            else:
                self.error_code = 'SE_UNDEF'
                self.error_message = 'undefined error'

    def as_dict(self):
        return {
            'payload': self.payload,
            'is_ok': self.is_ok,
            'error_code': self.error_code,
            'error_message': self.error_message,
        }
