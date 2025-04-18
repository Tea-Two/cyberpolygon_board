from flask import render_template

from CTFd.admin import admin
from CTFd.models import Notifications, Messages
from CTFd.utils.decorators import admins_only


@admin.route("/admin/notifications")
@admins_only
def notifications():
    notifs = Notifications.query.order_by(Notifications.id.desc()).all()
    return render_template("admin/notifications.html", notifications=notifs)

@admin.route("/admin/messages")
@admins_only
def messages():
    messages = Messages.query.order_by(Messages.id.desc()).all()
    return render_template("admin/messages.html", messages=messages)