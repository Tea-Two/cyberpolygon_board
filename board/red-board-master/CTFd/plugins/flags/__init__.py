import re
from CTFd.plugins import register_plugin_assets_directory

from CTFd.utils.mutation.mutator import normalize

class FlagException(Exception):
    def __init__(self, message):
        self.message = message

    def __str__(self):
        return self.message


class BaseFlag(object):
    name = None
    templates = {}

    @staticmethod
    def compare(self, saved, provided):
        return True


class CTFdStaticFlag(BaseFlag):
    name = "static"
    templates = {  # Nunjucks templates used for key editing & viewing
        "create": "/plugins/flags/assets/static/create.html",
        "update": "/plugins/flags/assets/static/edit.html",
    }

    @staticmethod
    def compare(chal_key_obj, provided):
        saved = chal_key_obj.content
        data = chal_key_obj.data

        if len(saved) != len(provided):
            return False
        result = 0

        if data == "case_insensitive":
            for x, y in zip(saved.lower(), provided.lower()):
                result |= ord(x) ^ ord(y)
        else:
            for x, y in zip(saved, provided):
                result |= ord(x) ^ ord(y)
        return result == 0

class CTFdOnlineMutatedFlag(BaseFlag):
    name = "online_mutated"
    templates = {  # Nunjucks templates used for key editing & viewing
        "create": "/plugins/flags/assets/online_mutated/create.html",
        "update": "/plugins/flags/assets/online_mutated/edit.html",
    }

    @staticmethod
    def compare(chal_key_obj, provided):
        saved = chal_key_obj.content
        demutated_flag = normalize(provided)
        if saved != demutated_flag:
            return False
        return True

class CTFdFileMutatedFlag(BaseFlag):
    name = "file_mutated"
    templates = {  # Nunjucks templates used for key editing & viewing
        "create": "/plugins/flags/assets/file_mutated/create.html",
        "update": "/plugins/flags/assets/file_mutated/edit.html",
    }

    @staticmethod
    def compare(chal_key_obj, provided):
        saved = chal_key_obj.content
        demutated_flag = normalize(provided)
        if saved != demutated_flag:
            return False
        return True

class CTFdOfflineMutatedFlag(BaseFlag):
    name = "offline_mutated"
    templates = {  # Nunjucks templates used for key editing & viewing
        "create": "/plugins/flags/assets/offline_mutated/create.html",
        "update": "/plugins/flags/assets/offline_mutated/edit.html",
    }

    @staticmethod
    def compare(chal_key_obj, provided):
        saved = chal_key_obj.content
        demutated_flag = normalize(provided)
        if saved != demutated_flag:
            return False
        return True


class CTFdRegexFlag(BaseFlag):
    name = "regex"
    templates = {  # Nunjucks templates used for key editing & viewing
        "create": "/plugins/flags/assets/regex/create.html",
        "update": "/plugins/flags/assets/regex/edit.html",
    }

    @staticmethod
    def compare(chal_key_obj, provided):
        saved = chal_key_obj.content
        data = chal_key_obj.data

        try:
            if data == "case_insensitive":
                res = re.match(saved, provided, re.IGNORECASE)
            else:
                res = re.match(saved, provided)
        # TODO: this needs plugin improvements. See #1425.
        except re.error as e:
            raise FlagException("Regex parse error occured") from e

        return res and res.group() == provided


FLAG_CLASSES = {"static": CTFdStaticFlag, "regex": CTFdRegexFlag, "online_mutated": CTFdOnlineMutatedFlag, "file_mutated": CTFdFileMutatedFlag, "offline_mutated": CTFdOfflineMutatedFlag}


def get_flag_class(class_id):
    cls = FLAG_CLASSES.get(class_id)
    if cls is None:
        raise KeyError
    return cls


def load(app):
    register_plugin_assets_directory(app, base_path="/plugins/flags/assets/")
