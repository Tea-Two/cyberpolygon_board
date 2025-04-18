from flask import Blueprint, render_template, request

from CTFd.utils import config
from CTFd.utils.config.visibility import scores_visible
from CTFd.utils.decorators.visibility import check_score_visibility
from CTFd.utils.helpers import get_infos
from CTFd.utils.scores import get_standings
from CTFd.utils.user import is_admin, get_current_user

scoreboard = Blueprint("scoreboard", __name__)


@scoreboard.route("/scoreboard")
@check_score_visibility
def listing():
    infos = get_infos()

    if config.is_scoreboard_frozen():
        infos.append("Scoreboard has been frozen")

    if is_admin() is True and scores_visible() is False:
        infos.append("Scores are not currently visible to users")

    top50 = request.cookies.get('top50') != "disabled"

    standings = get_standings(50) if top50 else get_standings()
    user = get_current_user()
    place = user.get_place(numeric=True) if user else 0
    place = place if place else 0

    return render_template("scoreboard.html", standings=standings, infos=infos, current_user=user, place=place, top50=top50)
