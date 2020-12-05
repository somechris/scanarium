import uuid

from .ScanariumError import ScanariumError


class Result(object):
    def __init__(self, payload={}, exc_info=None, command=None, parameters=[]):
        super(Result, self).__init__()
        self.uuid = None
        self.command = command
        self.parameters = parameters
        self.payload = payload
        self.is_ok = exc_info is None

        self.error_code = None
        self.error_message = None
        self.error_template = None
        self.error_parameters = []

        if exc_info is not None:
            if isinstance(exc_info[1], ScanariumError):
                self.error_code = exc_info[1].code
                self.error_message = exc_info[1].message
                self.error_template = exc_info[1].template
                self.error_parameters = exc_info[1].parameters
                self.uuid = exc_info[1].uuid
            else:
                self.error_code = 'SE_UNDEF'
                self.error_message = 'undefined error'
                self.error_template = self.error_message

        if self.uuid is None:
            self.uuid = uuid.uuid4()

    def as_dict(self):
        return {
            'command': self.command,
            'parameters': self.parameters,
            'uuid': str(self.uuid),
            'payload': self.payload,
            'is_ok': self.is_ok,
            'error_code': self.error_code,
            'error_message': self.error_message,
            'error_template': self.error_template,
            'error_parameters': self.error_parameters,
        }
