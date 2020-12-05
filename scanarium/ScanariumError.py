class ScanariumError(RuntimeError):
    def __init__(self, code, template, parameters=[], *args, **kwargs):
        super(ScanariumError, self).__init__(*args, **kwargs)
        self.code = code
        self.template = template
        self.parameters = parameters
        self.message = self.format_message()

    def format_message(self):
        split = self.template.split('{')
        for idx in range(1, len(split)):
            try:
                (param_name, rest) = split[idx].split('}', 1)
                param_value = self.parameters[param_name]
                split[idx] = str(param_value) + rest
            except Exception:
                split[idx] = '{' + split[idx]

        return ''.join(split)
