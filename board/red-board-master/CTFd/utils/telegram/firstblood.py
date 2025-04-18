from CTFd.models import Messages
from CTFd.utils.config import get_config
from .bot import send_message
import random


def firstblood(user, challenge):
    all_messages = Messages.query.all()
    if all_messages:
        messages = []
        for msg in all_messages:
            messages.append(msg.body)
        format = random.choice(messages)
        if get_config('user_mode') == 'teams':
            team = user.team
            props = {
                "user": user.name,
                "team": team.name,
                "challenge": challenge.name,
            }

        else:
            props = {
                "user": user.name,
                "challenge": challenge.name,
            }

        message = format.format(**props)
        send_message(message=message, to='USERS', mtype='markdown')
