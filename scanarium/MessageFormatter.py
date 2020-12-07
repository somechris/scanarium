import logging

logger = logging.getLogger(__name__)


class MessageFormatter(object):
    def capitalize_first(self, string):
        if string:
            # This is different from str.capitalize, as it does not lower-case
            # the 2nd character onwards.
            string = string[0].upper() + string[1:]
        return string

    def format_message(self, template, parameters):
        split = template.split('{')
        for idx in range(1, len(split)):
            try:
                conversion = None
                (param_name, rest) = split[idx].split('}', 1)
                if '!' in param_name:
                    (param_name, conversion) = param_name.rsplit('!', 1)
                    if conversion == 'S':
                        conversion = self.capitalize_first
                    elif conversion == '':
                        conversion = None
                    else:
                        raise RuntimeError(
                            f'Unknown conversion "{conversion}"')

                param_value = parameters[param_name]

                if conversion:
                    param_value = conversion(param_value)

                split[idx] = str(param_value) + rest
            except Exception:
                split[idx] = '{' + split[idx]

        return ''.join(split)
