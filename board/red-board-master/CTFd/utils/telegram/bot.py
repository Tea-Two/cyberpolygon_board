import requests
from CTFd.utils import get_app_config, get_config
from CTFd.utils.config.integrations import tg_notifs


def send_message(message, to='DEV', mtype='plain'):
    if not tg_notifs():
        return False

    URL = get_app_config("TG_BOT_NOTIFICATIONS_URL") or get_config(
        "tg_bot_notifications_url")
    SECRET = get_app_config("TG_BOT_NOTIFICATIONS_SECRET") or get_config(
        "tg_bot_notifications_secret")
    USERS_CHAT = get_app_config("TG_BOT_NOTIFICATIONS_USERS_CHAT") or get_config(
        "tg_bot_notifications_users_chat")
    DEV_CHAT = get_app_config("TG_BOT_NOTIFICATIONS_DEV_CHAT") or get_config(
        "tg_bot_notifications_dev_chat")

    if to == 'DEV':
        to = DEV_CHAT
    elif to == 'USERS':
        to = USERS_CHAT

    DATA = {
        "id": "RedBoard",
        "message": message,
        "type": mtype,
        "to": to,
    }

    response = requests.post(
        url="{}/{}".format(URL, SECRET), json=DATA)
    if response.status_code == 200:
        return True

    return False
