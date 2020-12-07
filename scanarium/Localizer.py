import logging

from .MessageFormatter import MessageFormatter

logger = logging.getLogger(__name__)


class Localizer(object):
    def __init__(self, localizations):
        super(Localizer, self).__init__()
        self._localizations = localizations
        self._message_formatter = MessageFormatter()

    def localize_parameter(self, name, value):
        return self._localizations.get('parameters', {}).get(name, {}).get(
            value, value)

    def localize_template(self, template):
        return self._localizations.get('messages', {}).get(template, template)

    def localize(self, template, parameters={}):
        localized_parameters = {}
        for name, value in parameters.items():
            localized_parameters[name] = self.localize_parameter(name, value)

        localized_template = self.localize_template(template)
        return self._message_formatter.format_message(
            localized_template, localized_parameters)
