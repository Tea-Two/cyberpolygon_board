from CTFd.utils import get_app_config, get_config


def mlc():
    return get_config("oauth_client_id") and get_config("oauth_client_secret")

def tg():
    return get_config("tg_bot_secret") and get_config("tg_bot_username")

def tg_notifs():
    return get_config("tg_bot_notifications_url") and get_config("tg_bot_notifications_secret") and get_config("tg_bot_notifications_dev_chat") and get_config("tg_bot_notifications_users_chat")

def telegram_registration():
    v = get_config("registration_visibility")
    return v == "tg"

def mlc():
    admin_config = get_config("oauth_client_id") and get_config("oauth_client_secret")
    main_config = get_app_config("OAUTH_CLIENT_ID") and get_app_config(
        "OAUTH_CLIENT_SECRET"
    )
    return admin_config or main_config
