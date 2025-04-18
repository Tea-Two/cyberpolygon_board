from flask import render_template

from CTFd.admin import admin
from CTFd.models import AnticheatEvents
from CTFd.utils.decorators import admins_only


@admin.route("/admin/anticheat")
@admins_only
def anticheat_viewer():
    incidents = AnticheatEvents.query.all()
    return render_template("admin/anticheat.html", incidents = incidents)
