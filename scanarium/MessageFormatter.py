import logging

logger = logging.getLogger(__name__)


class MessageFormatter(object):
    def format_message(self, template, parameters):
        split = template.split('{')
        for idx in range(1, len(split)):
            try:
                (param_name, rest) = split[idx].split('}', 1)
                param_value = parameters[param_name]
                split[idx] = str(param_value) + rest
            except Exception:
                split[idx] = '{' + split[idx]

        return ''.join(split)
