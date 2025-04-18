import hmac
import hashlib


def verify(request, token):
    """
    Check Telegram Login Widget callback hash.
    """

    secret_key = hashlib.sha256(token.encode()).digest()

    data = dict(request.values)
    hash = data.pop("hash")

    data_check_string = getDataCheckString(data)

    HMAC = hmac.new(secret_key,
                    data_check_string.encode(),
                    digestmod=hashlib.sha256).hexdigest()

    return True if HMAC == hash else False


def getDataCheckString(data):
    data_check_string = ""
    for key in sorted(data):
        data_check_string += "{}={}\n".format(key, data.get(key))
    return data_check_string[:-1]